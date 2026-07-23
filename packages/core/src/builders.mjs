import { calculateObjectDigest } from './digest.mjs';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function withObjectDigest(value) {
  const result = clone(value);
  result.object_digest = calculateObjectDigest(result);
  return result;
}

export function createIssuerDescriptor({
  issuerId,
  displayName,
  issuerType,
  identifiers = [],
  keys = [],
  extensions = {}
}) {
  return {
    issuer_id: issuerId,
    display_name: displayName,
    issuer_type: issuerType,
    identifiers: clone(identifiers),
    keys: clone(keys),
    extensions: clone(extensions)
  };
}

export function createOutcomeEvent({
  eventId,
  phase,
  eventType,
  status,
  occurredAt,
  recordedAt,
  sourceClass,
  issuerRef,
  actor,
  subject,
  claim,
  evidenceRefs = [],
  parentEventDigests = [],
  extensions = {}
}) {
  return withObjectDigest({
    event_id: eventId,
    phase,
    event_type: eventType,
    status,
    occurred_at: occurredAt,
    recorded_at: recordedAt,
    source_class: sourceClass,
    issuer_ref: issuerRef,
    actor: clone(actor),
    subject: clone(subject),
    claim: clone(claim),
    evidence_refs: clone(evidenceRefs),
    parent_event_digests: clone(parentEventDigests),
    extensions: clone(extensions)
  });
}

export function createEvidenceItem({
  evidenceId,
  evidenceType,
  mediaType,
  sourceClass,
  issuerRef,
  claimScope,
  contentDigest,
  locator,
  disclosure = 'RESTRICTED',
  extensions = {}
}) {
  return withObjectDigest({
    evidence_id: evidenceId,
    evidence_type: evidenceType,
    media_type: mediaType,
    source_class: sourceClass,
    issuer_ref: issuerRef,
    claim_scope: clone(claimScope),
    content_digest: clone(contentDigest),
    locator: clone(locator),
    disclosure,
    extensions: clone(extensions)
  });
}

export function createRelationship({
  relationshipId,
  relationshipType,
  fromRef,
  toRef,
  extensions = {}
}) {
  return withObjectDigest({
    relationship_id: relationshipId,
    relationship_type: relationshipType,
    from_ref: fromRef,
    to_ref: toRef,
    extensions: clone(extensions)
  });
}

export function createEvidenceBundle({
  bundleId,
  actionId,
  createdAt,
  issuers = [],
  events = [],
  evidence = [],
  relationships = [],
  predecessorBundleDigests = [],
  extensions = {},
  proofs = [],
  specVersion = '0.1',
  profile = 'TP-JSON-0.1'
}) {
  return {
    payload: {
      spec_version: specVersion,
      profile,
      bundle_id: bundleId,
      action_id: actionId,
      created_at: createdAt,
      issuers: clone(issuers),
      events: clone(events),
      evidence: clone(evidence),
      relationships: clone(relationships),
      predecessor_bundle_digests: clone(predecessorBundleDigests),
      extensions: clone(extensions)
    },
    proofs: clone(proofs)
  };
}
