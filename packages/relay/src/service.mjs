import { createHash } from 'node:crypto';
import { join } from 'node:path';
import {
  calculatePayloadDigest,
  createEvidenceBundle,
  createEvidenceItem,
  createIssuerDescriptor,
  createOutcomeEvent,
  createRelationship,
  createSignatureProof,
  digestValue,
  parseJsonStrict,
  verifyBundle,
  withObjectDigest
} from '../../core/src/index.mjs';
import { evaluateBundle } from '../../verdict-engine/src/index.mjs';
import { normalizeStripeRefundEvent, StripeConnectorError, verifyStripeWebhookSignature } from '../../stripe-connector/src/index.mjs';
import { loadOrCreateRelayKey } from './keys.mjs';
import { buildOutcomePacket } from './packet.mjs';
import { RelayStore, RelayStoreError } from './store.mjs';

export class RelayServiceError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = 'RelayServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

function safeId(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex').slice(0, 20);
}

function requiredEntity(value, fieldName) {
  if (!value || typeof value !== 'object' || typeof value.entity_type !== 'string' || typeof value.entity_id !== 'string') {
    throw new RelayServiceError('ENTITY_INVALID', `${fieldName} must contain entity_type and entity_id.`);
  }
  return {
    entity_type: value.entity_type,
    entity_id: value.entity_id,
    ...(typeof value.display_name === 'string' ? { display_name: value.display_name } : {})
  };
}

function currentSummary(bundle, ruleset) {
  const verification = verifyBundle(bundle);
  const evaluation = evaluateBundle(bundle, ruleset);
  return {
    action_id: bundle.payload.action_id,
    bundle_id: bundle.payload.bundle_id,
    payload_digest: verification.payload_digest,
    structural_status: verification.status,
    verdict: evaluation.verdict,
    reasons: evaluation.reasons ?? [],
    decisive_events: evaluation.decisive_events ?? [],
    missing_evidence: buildOutcomePacket(bundle, verification, evaluation).missing_evidence,
    updated_at: bundle.payload.created_at
  };
}

function relayIssuer({ issuerId, key }) {
  return createIssuerDescriptor({
    issuerId,
    displayName: 'TimeProofs Relay',
    issuerType: 'GATEWAY',
    identifiers: [{ scheme: 'urn', value: issuerId }],
    keys: [{
      key_id: key.key_id,
      algorithm: 'Ed25519',
      format: 'spki-pem',
      public_key: key.public_key_pem
    }],
    extensions: {
      'org.timeproofs.relay': {
        role: 'operator_controlled_evidence_relay',
        version: '0.1.0-alpha.0'
      }
    }
  });
}

function signTargets(bundle, objects, { issuerId, key, createdAt, proofPrefix }) {
  for (const [index, object] of objects.entries()) {
    bundle.proofs.push(createSignatureProof({
      bundle,
      target: object.target,
      issuerRef: issuerId,
      keyId: key.key_id,
      privateKeyPem: key.private_key_pem,
      proofId: `${proofPrefix}_${index + 1}`,
      createdAt
    }));
  }
}

export async function createRelayService({
  dataDirectory,
  issuerId = 'urn:timeproofs:relay:local',
  stripeWebhookSecret = null,
  clock = () => new Date()
}) {
  if (!dataDirectory) throw new RelayServiceError('DATA_DIRECTORY_REQUIRED', 'dataDirectory is required.');
  const key = await loadOrCreateRelayKey(join(dataDirectory, 'keys', 'relay-ed25519.json'));
  const store = new RelayStore({ directory: dataDirectory });
  await store.init();
  const issuer = relayIssuer({ issuerId, key });

  async function createAction(input) {
    if (!input || typeof input !== 'object') throw new RelayServiceError('ACTION_BODY_INVALID', 'Action body must be a JSON object.');
    const actionId = input.action_id;
    if (typeof actionId !== 'string' || actionId.length === 0) throw new RelayServiceError('ACTION_ID_INVALID', 'action_id is required.');
    const ruleset = input.ruleset ?? 'refund-v0.1';
    if (input.correlations !== undefined && (!input.correlations || typeof input.correlations !== 'object' || Array.isArray(input.correlations))) {
      throw new RelayServiceError('CORRELATIONS_INVALID', 'correlations must be a JSON object when present.');
    }
    if (ruleset !== 'refund-v0.1') throw new RelayServiceError('RULESET_NOT_SUPPORTED', 'Only refund-v0.1 is supported by the alpha Relay.');
    const actor = requiredEntity(input.actor, 'actor');
    const subject = requiredEntity(input.subject, 'subject');
    const timestamp = clock().toISOString();
    const suffix = safeId(actionId);
    const evidenceId = `tpev_claim_${suffix}`;
    const eventId = `tpe_claim_${suffix}`;
    const claim = input.claim && typeof input.claim === 'object' ? input.claim : {};
    const evidence = createEvidenceItem({
      evidenceId,
      evidenceType: 'AGENT_ACTION_CLAIM',
      mediaType: 'application/json',
      sourceClass: 'SELF_CLAIMED',
      issuerRef: issuerId,
      claimScope: ['commerce.refund.requested'],
      contentDigest: digestValue({ action_id: actionId, actor, subject, claim }),
      locator: { scheme: 'opaque', value: `relay:claim:${actionId}`, retrieval_policy: 'LOCAL_ONLY' },
      disclosure: 'COMMITMENT_ONLY',
      extensions: {
        'org.timeproofs.relay': {
          recorded_by_relay: true,
          claimant_identity_independently_verified: false
        }
      }
    });
    const event = createOutcomeEvent({
      eventId,
      phase: 'INTENT',
      eventType: 'commerce.refund.requested',
      status: 'SUCCEEDED',
      occurredAt: input.occurred_at ?? timestamp,
      recordedAt: timestamp,
      sourceClass: 'SELF_CLAIMED',
      issuerRef: issuerId,
      actor,
      subject,
      claim,
      evidenceRefs: [evidenceId],
      extensions: {
        'org.timeproofs.relay': {
          semantics: 'relay_records_agent_claim_without_upgrading_factual_strength'
        }
      }
    });
    const relationship = createRelationship({
      relationshipId: `tpr_claim_${suffix}`,
      relationshipType: 'SUPPORTS',
      fromRef: `evidence:${evidenceId}`,
      toRef: `event:${eventId}`
    });
    const bundle = createEvidenceBundle({
      bundleId: `tpb_${suffix}_r000001`,
      actionId,
      createdAt: timestamp,
      issuers: [issuer],
      events: [event],
      evidence: [evidence],
      relationships: [relationship],
      extensions: {
        'org.timeproofs.relay': {
          revision: 1,
          ruleset,
          correlations: input.correlations ?? {}
        }
      }
    });
    signTargets(bundle, [
      { target: { target_type: 'EVIDENCE_ITEM', target_id: evidenceId } },
      { target: { target_type: 'OUTCOME_EVENT', target_id: eventId } }
    ], { issuerId, key, createdAt: timestamp, proofPrefix: `tpp_claim_${suffix}` });
    const current = currentSummary(bundle, ruleset);
    const result = await store.createAction({
      actionId,
      bundle,
      current,
      ruleset,
      correlations: input.correlations ?? {}
    });
    return { ...result, packet: buildOutcomePacket(bundle, verifyBundle(bundle), evaluateBundle(bundle, ruleset)) };
  }

  async function ingestStripeWebhook({ rawBody, signatureHeader }) {
    if (!stripeWebhookSecret) throw new RelayServiceError('STRIPE_WEBHOOK_SECRET_NOT_CONFIGURED', 'Stripe webhook ingestion is not configured.', 503);
    let verification;
    let stripeEvent;
    let observation;
    try {
      verification = verifyStripeWebhookSignature({
        rawBody,
        signatureHeader,
        endpointSecret: stripeWebhookSecret,
        nowMilliseconds: clock().getTime()
      });
      stripeEvent = parseJsonStrict(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody);
      observation = normalizeStripeRefundEvent(stripeEvent, {
        relayIssuerRef: issuerId,
        recordedAt: clock().toISOString(),
        signatureVerification: verification
      });
    } catch (error) {
      if (error instanceof StripeConnectorError || error.name === 'StrictJsonError') {
        throw new RelayServiceError(error.code ?? 'STRIPE_WEBHOOK_INVALID', error.message, 400);
      }
      throw error;
    }
    const refundId = stripeEvent.data.object.id;
    const actionId = await store.findByStripeRefundId(refundId);
    if (!actionId) throw new RelayServiceError('STRIPE_REFUND_NOT_LINKED', `No action is linked to Stripe refund ${refundId}.`, 404);
    const previous = await store.getAction(actionId);
    if (previous.metadata.seen_upstream_event_ids.includes(stripeEvent.id)) return { ...previous, duplicate: true };

    let parentDigest = previous.bundle.payload.events.at(-1)?.object_digest ?? null;
    const newEvents = observation.events.map((event) => {
      const linked = withObjectDigest({
        ...event,
        parent_event_digests: parentDigest ? [parentDigest] : []
      });
      parentDigest = linked.object_digest;
      return linked;
    });
    const revision = previous.metadata.revision + 1;
    const timestamp = clock().toISOString();
    const bundle = createEvidenceBundle({
      bundleId: `tpb_${safeId(actionId)}_r${String(revision).padStart(6, '0')}`,
      actionId,
      createdAt: timestamp,
      issuers: previous.bundle.payload.issuers,
      events: [...previous.bundle.payload.events, ...newEvents],
      evidence: [...previous.bundle.payload.evidence, ...observation.evidence],
      relationships: [...previous.bundle.payload.relationships, ...observation.relationships],
      predecessorBundleDigests: [calculatePayloadDigest(previous.bundle)],
      extensions: {
        'org.timeproofs.relay': {
          revision,
          ruleset: previous.metadata.ruleset,
          correlations: previous.metadata.correlations,
          appended_upstream_event: {
            provider: 'stripe',
            event_id: stripeEvent.id,
            event_type: stripeEvent.type,
            signature_verified: true
          }
        }
      },
      proofs: previous.bundle.proofs
    });
    signTargets(bundle, [
      ...observation.evidence.map((item) => ({ target: { target_type: 'EVIDENCE_ITEM', target_id: item.evidence_id } })),
      ...newEvents.map((event) => ({ target: { target_type: 'OUTCOME_EVENT', target_id: event.event_id } }))
    ], { issuerId, key, createdAt: timestamp, proofPrefix: `tpp_stripe_${safeId(stripeEvent.id)}` });
    const current = currentSummary(bundle, previous.metadata.ruleset);
    const result = await store.appendRevision({ actionId, bundle, current, upstreamEventId: stripeEvent.id });
    return { ...result, packet: buildOutcomePacket(bundle, verifyBundle(bundle), evaluateBundle(bundle, previous.metadata.ruleset)) };
  }

  async function getAction(actionId) {
    return store.getAction(actionId);
  }

  async function getPacket(actionId) {
    const { metadata, bundle } = await store.getAction(actionId);
    const verification = verifyBundle(bundle);
    const evaluation = evaluateBundle(bundle, metadata.ruleset);
    return buildOutcomePacket(bundle, verification, evaluation);
  }

  return {
    issuer: { issuer_id: issuerId, key_id: key.key_id, public_key_pem: key.public_key_pem },
    createAction,
    ingestStripeWebhook,
    getAction,
    getPacket,
    listRevisions: (actionId) => store.listRevisions(actionId)
  };
}

export { RelayStoreError };
