import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  createEvidenceItem,
  createOutcomeEvent,
  createRelationship,
  digestValue
} from '../../core/src/index.mjs';

const SUPPORTED_EVENT_TYPES = new Set(['refund.created', 'refund.updated', 'refund.failed']);
const STRIPE_EXTENSION = 'org.timeproofs.connector.stripe';

export class StripeConnectorError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'StripeConnectorError';
    this.code = code;
  }
}

function safeEqualHex(left, right) {
  if (!/^[0-9a-f]+$/iu.test(left) || !/^[0-9a-f]+$/iu.test(right) || left.length !== right.length) return false;
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}

export function parseStripeSignatureHeader(signatureHeader) {
  if (typeof signatureHeader !== 'string' || signatureHeader.length === 0) {
    throw new StripeConnectorError('STRIPE_SIGNATURE_MISSING', 'Stripe-Signature header is required.');
  }

  const parsed = { timestamp: null, signatures: [] };
  for (const part of signatureHeader.split(',')) {
    const [key, value] = part.trim().split('=', 2);
    if (key === 't' && /^\d+$/u.test(value ?? '')) parsed.timestamp = Number(value);
    if (key === 'v1' && value) parsed.signatures.push(value);
  }

  if (!Number.isSafeInteger(parsed.timestamp) || parsed.signatures.length === 0) {
    throw new StripeConnectorError('STRIPE_SIGNATURE_MALFORMED', 'Stripe-Signature header must contain t and v1 values.');
  }
  return parsed;
}

export function verifyStripeWebhookSignature({
  rawBody,
  signatureHeader,
  endpointSecret,
  toleranceSeconds = 300,
  nowMilliseconds = Date.now()
}) {
  if (typeof endpointSecret !== 'string' || endpointSecret.length === 0) {
    throw new StripeConnectorError('STRIPE_ENDPOINT_SECRET_MISSING', 'Stripe endpoint secret is required.');
  }
  if (typeof rawBody !== 'string' && !Buffer.isBuffer(rawBody)) {
    throw new StripeConnectorError('STRIPE_RAW_BODY_REQUIRED', 'Webhook verification requires the unmodified raw request body.');
  }

  const body = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
  const { timestamp, signatures } = parseStripeSignatureHeader(signatureHeader);
  const ageSeconds = Math.abs(Math.floor(nowMilliseconds / 1000) - timestamp);
  if (Number.isFinite(toleranceSeconds) && ageSeconds > toleranceSeconds) {
    throw new StripeConnectorError('STRIPE_SIGNATURE_TOO_OLD', `Stripe signature age ${ageSeconds}s exceeds tolerance ${toleranceSeconds}s.`);
  }

  const expected = createHmac('sha256', endpointSecret).update(`${timestamp}.${body}`, 'utf8').digest('hex');
  const matched = signatures.some((candidate) => safeEqualHex(candidate, expected));
  if (!matched) {
    throw new StripeConnectorError('STRIPE_SIGNATURE_INVALID', 'Stripe webhook signature did not match the raw payload.');
  }

  return { valid: true, timestamp, age_seconds: ageSeconds, algorithm: 'hmac-sha256' };
}

function normalizedId(value) {
  return value.replace(/[^A-Za-z0-9_-]/gu, '_');
}

function isoFromUnix(value, fallback) {
  return Number.isFinite(value) ? new Date(value * 1000).toISOString() : fallback;
}

function eventDescriptors(stripeEvent) {
  const refund = stripeEvent.data.object;
  const descriptors = [];

  if (stripeEvent.type === 'refund.created') {
    descriptors.push({ suffix: 'created', phase: 'EFFECT', eventType: 'commerce.refund.created', status: 'SUCCEEDED' });
  }

  if (refund.status === 'pending' || refund.status === 'requires_action') {
    descriptors.push({ suffix: 'pending', phase: 'SETTLEMENT', eventType: 'commerce.refund.settlement_pending', status: 'PENDING' });
  } else if (refund.status === 'succeeded') {
    descriptors.push({ suffix: 'settled', phase: 'SETTLEMENT', eventType: 'commerce.refund.settled', status: 'SUCCEEDED' });
  } else if (refund.status === 'failed' || stripeEvent.type === 'refund.failed') {
    descriptors.push({ suffix: 'failed', phase: 'SETTLEMENT', eventType: 'commerce.refund.settlement_failed', status: 'FAILED' });
  } else if (refund.status === 'canceled') {
    descriptors.push({ suffix: 'cancelled', phase: 'TERMINATION', eventType: 'commerce.refund.cancelled', status: 'CANCELLED' });
  }

  return descriptors;
}

export function normalizeStripeRefundEvent(stripeEvent, {
  relayIssuerRef = 'timeproofs.stripe-relay',
  recordedAt = new Date().toISOString(),
  signatureVerification = null
} = {}) {
  if (!stripeEvent || typeof stripeEvent !== 'object' || !SUPPORTED_EVENT_TYPES.has(stripeEvent.type)) {
    throw new StripeConnectorError('STRIPE_EVENT_UNSUPPORTED', 'Only refund.created, refund.updated, and refund.failed are supported.');
  }
  const refund = stripeEvent.data?.object;
  if (!refund || refund.object !== 'refund' || typeof refund.id !== 'string') {
    throw new StripeConnectorError('STRIPE_REFUND_OBJECT_REQUIRED', 'Stripe event data.object must be a Refund object.');
  }

  const descriptors = eventDescriptors(stripeEvent);
  if (descriptors.length === 0) {
    throw new StripeConnectorError('STRIPE_REFUND_STATUS_UNSUPPORTED', `Unsupported Stripe refund status: ${refund.status ?? 'missing'}.`);
  }

  const occurredAt = isoFromUnix(stripeEvent.created, recordedAt);
  const stripeEventId = normalizedId(stripeEvent.id ?? `evt_${refund.id}`);
  const evidenceId = `tpev_stripe_${stripeEventId}`;
  const claimScope = descriptors.map((item) => item.eventType);
  const providerProjection = {
    event_id: stripeEvent.id ?? null,
    event_type: stripeEvent.type,
    refund_id: refund.id,
    refund_status: refund.status ?? null,
    amount: Number.isSafeInteger(refund.amount) ? String(refund.amount) : null,
    currency: refund.currency ?? null,
    charge: refund.charge ?? null,
    payment_intent: refund.payment_intent ?? null,
    balance_transaction: refund.balance_transaction ?? null,
    failure_reason: refund.failure_reason ?? null
  };

  const evidence = createEvidenceItem({
    evidenceId,
    evidenceType: 'STRIPE_WEBHOOK_EVENT',
    mediaType: 'application/json',
    sourceClass: 'SYSTEM_OF_RECORD',
    issuerRef: relayIssuerRef,
    claimScope,
    contentDigest: digestValue(stripeEvent),
    locator: {
      scheme: 'opaque',
      value: `stripe:event:${stripeEvent.id ?? 'unknown'}`,
      retrieval_policy: 'AUTHORIZED_ONLY'
    },
    disclosure: 'COMMITMENT_ONLY',
    extensions: {
      [STRIPE_EXTENSION]: {
        provider: 'stripe',
        upstream_event: providerProjection,
        authentication: signatureVerification ? {
          verified: signatureVerification.valid === true,
          algorithm: signatureVerification.algorithm,
          signed_at: new Date(signatureVerification.timestamp * 1000).toISOString()
        } : { verified: false }
      }
    }
  });

  const actor = { entity_type: 'PAYMENT_PROVIDER', entity_id: 'stripe', display_name: 'Stripe' };
  const subject = {
    entity_type: 'REFUND',
    entity_id: refund.id,
    display_name: `Stripe refund ${refund.id}`
  };

  const events = descriptors.map((descriptor) => createOutcomeEvent({
    eventId: `tpe_stripe_${stripeEventId}_${descriptor.suffix}`,
    phase: descriptor.phase,
    eventType: descriptor.eventType,
    status: descriptor.status,
    occurredAt,
    recordedAt,
    sourceClass: 'SYSTEM_OF_RECORD',
    issuerRef: relayIssuerRef,
    actor,
    subject,
    claim: providerProjection,
    evidenceRefs: [evidenceId],
    extensions: {
      [STRIPE_EXTENSION]: {
        normalized_from: stripeEvent.type,
        upstream_signature_verified: signatureVerification?.valid === true
      }
    }
  }));

  const relationships = events.map((event, index) => createRelationship({
    relationshipId: `tpr_stripe_${stripeEventId}_${index + 1}`,
    relationshipType: 'SUPPORTS',
    fromRef: `evidence:${evidenceId}`,
    toRef: `event:${event.event_id}`,
    extensions: {}
  }));

  return {
    connector: 'stripe-refunds-v0.1',
    issuer_ref: relayIssuerRef,
    events,
    evidence: [evidence],
    relationships,
    upstream: {
      provider: 'stripe',
      event_id: stripeEvent.id ?? null,
      event_type: stripeEvent.type,
      signature_verified: signatureVerification?.valid === true
    }
  };
}
