import { parseJsonStrict } from './strict-json.mjs';
import {
  SHA256_PATTERN,
  calculateObjectDigest,
  calculatePayloadDigest,
  digestEquals
} from './digest.mjs';
import { verifySignatureProof } from './proofs.mjs';

const TOP_LEVEL_KEYS = ['payload', 'proofs'];
const PAYLOAD_KEYS = [
  'spec_version',
  'profile',
  'bundle_id',
  'action_id',
  'created_at',
  'issuers',
  'events',
  'evidence',
  'relationships',
  'predecessor_bundle_digests',
  'extensions'
];
const PHASES = new Set(['INTENT', 'AUTHORIZATION', 'DISPATCH', 'ACCEPTANCE', 'EFFECT', 'SETTLEMENT', 'TERMINATION']);
const STATUSES = new Set(['PENDING', 'SUCCEEDED', 'FAILED', 'PARTIAL', 'CANCELLED', 'REVERSED', 'EXPIRED']);
const SOURCE_CLASSES = new Set(['SELF_CLAIMED', 'GATEWAY_OBSERVED', 'RECEIVER_ATTESTED', 'SYSTEM_OF_RECORD', 'INDEPENDENTLY_SETTLED']);
const TARGET_TYPES = new Set(['BUNDLE_PAYLOAD', 'OUTCOME_EVENT', 'EVIDENCE_ITEM', 'RELATIONSHIP']);

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function exactKeys(object, expected) {
  const actual = Object.keys(object).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function validUtcTimestamp(value) {
  if (typeof value !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/u.test(value)) return false;
  return Number.isFinite(Date.parse(value));
}

function validDigest(value) {
  return isPlainObject(value) && value.algorithm === 'sha-256' && SHA256_PATTERN.test(value.value);
}

function addIssue(collection, code, message, path, detail) {
  collection.push({ code, message, path, ...(detail === undefined ? {} : { detail }) });
}

function verifyObjectDigest(object, path, errors) {
  if (!validDigest(object.object_digest)) {
    addIssue(errors, 'OBJECT_DIGEST_INVALID', 'Object digest is missing or malformed.', `${path}.object_digest`);
    return;
  }
  try {
    const calculated = calculateObjectDigest(object);
    if (!digestEquals(calculated, object.object_digest)) {
      addIssue(errors, 'OBJECT_DIGEST_MISMATCH', 'Object digest does not match canonical object content.', `${path}.object_digest`, { calculated });
    }
  } catch (error) {
    addIssue(errors, 'OBJECT_DIGEST_CALCULATION_FAILED', error.message, path);
  }
}

function verifyIssuer(issuer, path, errors) {
  if (!isPlainObject(issuer)) {
    addIssue(errors, 'ISSUER_NOT_OBJECT', 'Issuer must be an object.', path);
    return;
  }
  if (typeof issuer.issuer_id !== 'string' || issuer.issuer_id.length === 0) {
    addIssue(errors, 'ISSUER_ID_INVALID', 'issuer_id must be a non-empty string.', `${path}.issuer_id`);
  }
  if (!Array.isArray(issuer.keys)) {
    addIssue(errors, 'ISSUER_KEYS_INVALID', 'keys must be an array.', `${path}.keys`);
  } else {
    const keyIds = new Set();
    issuer.keys.forEach((key, keyIndex) => {
      const keyPath = `${path}.keys[${keyIndex}]`;
      if (!isPlainObject(key)) {
        addIssue(errors, 'KEY_NOT_OBJECT', 'Key must be an object.', keyPath);
        return;
      }
      if (typeof key.key_id !== 'string' || key.key_id.length === 0) addIssue(errors, 'KEY_ID_INVALID', 'key_id must be non-empty.', `${keyPath}.key_id`);
      if (keyIds.has(key.key_id)) addIssue(errors, 'DUPLICATE_KEY_ID', 'key_id must be unique within an issuer.', `${keyPath}.key_id`);
      keyIds.add(key.key_id);
      if (key.algorithm !== 'Ed25519') addIssue(errors, 'KEY_ALGORITHM_UNSUPPORTED', 'Only Ed25519 is supported in TP-JSON-0.1.', `${keyPath}.algorithm`);
      if (key.format !== 'spki-pem') addIssue(errors, 'KEY_FORMAT_UNSUPPORTED', 'Only spki-pem is supported in TP-JSON-0.1.', `${keyPath}.format`);
      if (typeof key.public_key !== 'string' || !key.public_key.includes('BEGIN PUBLIC KEY')) addIssue(errors, 'PUBLIC_KEY_INVALID', 'public_key must contain an SPKI PEM public key.', `${keyPath}.public_key`);
    });
  }
}

function verifyEvent(event, path, issuerIds, errors) {
  if (!isPlainObject(event)) {
    addIssue(errors, 'EVENT_NOT_OBJECT', 'Outcome Event must be an object.', path);
    return;
  }
  for (const member of ['event_id', 'phase', 'event_type', 'status', 'occurred_at', 'recorded_at', 'source_class', 'issuer_ref']) {
    if (typeof event[member] !== 'string' || event[member].length === 0) {
      addIssue(errors, 'EVENT_REQUIRED_MEMBER_INVALID', `${member} must be a non-empty string.`, `${path}.${member}`);
    }
  }
  if (!PHASES.has(event.phase)) addIssue(errors, 'EVENT_PHASE_INVALID', 'Unknown lifecycle phase.', `${path}.phase`);
  if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)+$/u.test(event.event_type ?? '')) addIssue(errors, 'EVENT_TYPE_INVALID', 'event_type must use a lower-case namespaced token.', `${path}.event_type`);
  if (!STATUSES.has(event.status)) addIssue(errors, 'EVENT_STATUS_INVALID', 'Unknown event status.', `${path}.status`);
  if (!SOURCE_CLASSES.has(event.source_class)) addIssue(errors, 'SOURCE_CLASS_INVALID', 'Unknown evidence source class.', `${path}.source_class`);
  if (!validUtcTimestamp(event.occurred_at)) addIssue(errors, 'EVENT_OCCURRED_AT_INVALID', 'occurred_at must be a UTC timestamp.', `${path}.occurred_at`);
  if (!validUtcTimestamp(event.recorded_at)) addIssue(errors, 'EVENT_RECORDED_AT_INVALID', 'recorded_at must be a UTC timestamp.', `${path}.recorded_at`);
  if (!issuerIds.has(event.issuer_ref)) addIssue(errors, 'EVENT_ISSUER_NOT_FOUND', 'issuer_ref does not resolve.', `${path}.issuer_ref`);
  if (!Array.isArray(event.parent_event_digests)) addIssue(errors, 'EVENT_PARENTS_INVALID', 'parent_event_digests must be an array.', `${path}.parent_event_digests`);
  if (!Array.isArray(event.evidence_refs)) addIssue(errors, 'EVENT_EVIDENCE_REFS_INVALID', 'evidence_refs must be an array.', `${path}.evidence_refs`);
  if (!isPlainObject(event.actor)) addIssue(errors, 'EVENT_ACTOR_INVALID', 'actor must be an object.', `${path}.actor`);
  if (!isPlainObject(event.subject)) addIssue(errors, 'EVENT_SUBJECT_INVALID', 'subject must be an object.', `${path}.subject`);
  if (!isPlainObject(event.claim)) addIssue(errors, 'EVENT_CLAIM_INVALID', 'claim must be an object.', `${path}.claim`);
  if (!isPlainObject(event.extensions)) addIssue(errors, 'EVENT_EXTENSIONS_INVALID', 'extensions must be an object.', `${path}.extensions`);
  verifyObjectDigest(event, path, errors);
}

function verifyEvidence(evidence, path, issuerIds, errors) {
  if (!isPlainObject(evidence)) {
    addIssue(errors, 'EVIDENCE_NOT_OBJECT', 'Evidence Item must be an object.', path);
    return;
  }
  for (const member of ['evidence_id', 'evidence_type', 'media_type', 'source_class', 'issuer_ref', 'disclosure']) {
    if (typeof evidence[member] !== 'string' || evidence[member].length === 0) addIssue(errors, 'EVIDENCE_REQUIRED_MEMBER_INVALID', `${member} must be a non-empty string.`, `${path}.${member}`);
  }
  if (!SOURCE_CLASSES.has(evidence.source_class)) addIssue(errors, 'SOURCE_CLASS_INVALID', 'Unknown evidence source class.', `${path}.source_class`);
  if (!issuerIds.has(evidence.issuer_ref)) addIssue(errors, 'EVIDENCE_ISSUER_NOT_FOUND', 'issuer_ref does not resolve.', `${path}.issuer_ref`);
  if (!validDigest(evidence.content_digest)) addIssue(errors, 'CONTENT_DIGEST_INVALID', 'content_digest must be a SHA-256 digest.', `${path}.content_digest`);
  if (!isPlainObject(evidence.locator)) addIssue(errors, 'EVIDENCE_LOCATOR_INVALID', 'locator must be an object.', `${path}.locator`);
  if (!Array.isArray(evidence.claim_scope)) addIssue(errors, 'CLAIM_SCOPE_INVALID', 'claim_scope must be an array.', `${path}.claim_scope`);
  if (!isPlainObject(evidence.extensions)) addIssue(errors, 'EVIDENCE_EXTENSIONS_INVALID', 'extensions must be an object.', `${path}.extensions`);
  verifyObjectDigest(evidence, path, errors);
}

function verifyRelationship(relationship, path, errors) {
  if (!isPlainObject(relationship)) {
    addIssue(errors, 'RELATIONSHIP_NOT_OBJECT', 'Relationship must be an object.', path);
    return;
  }
  for (const member of ['relationship_id', 'relationship_type', 'from_ref', 'to_ref']) {
    if (typeof relationship[member] !== 'string' || relationship[member].length === 0) addIssue(errors, 'RELATIONSHIP_REQUIRED_MEMBER_INVALID', `${member} must be non-empty.`, `${path}.${member}`);
  }
  if (!isPlainObject(relationship.extensions)) addIssue(errors, 'RELATIONSHIP_EXTENSIONS_INVALID', 'extensions must be an object.', `${path}.extensions`);
  verifyObjectDigest(relationship, path, errors);
}

export function verifyBundle(input) {
  const errors = [];
  const warnings = [];
  let bundle;

  try {
    bundle = typeof input === 'string' ? parseJsonStrict(input) : input;
  } catch (error) {
    addIssue(errors, error.code ?? 'JSON_PARSE_ERROR', error.message, '$');
    return { status: 'INVALID', errors, warnings, checks: [], valid_proofs: [] };
  }

  if (!isPlainObject(bundle)) {
    addIssue(errors, 'BUNDLE_NOT_OBJECT', 'Bundle must be a JSON object.', '$');
    return { status: 'INVALID', errors, warnings, checks: [], valid_proofs: [] };
  }
  if (!exactKeys(bundle, TOP_LEVEL_KEYS)) addIssue(errors, 'TOP_LEVEL_MEMBERS_INVALID', 'Top-level members must be exactly payload and proofs.', '$');
  if (!isPlainObject(bundle.payload)) addIssue(errors, 'PAYLOAD_NOT_OBJECT', 'payload must be an object.', '$.payload');
  if (!Array.isArray(bundle.proofs)) addIssue(errors, 'PROOFS_NOT_ARRAY', 'proofs must be an array.', '$.proofs');
  if (errors.length > 0) return { status: 'INVALID', errors, warnings, checks: [], valid_proofs: [] };

  const payload = bundle.payload;
  if (!exactKeys(payload, PAYLOAD_KEYS)) addIssue(errors, 'PAYLOAD_MEMBERS_INVALID', 'Payload members do not match TP-JSON-0.1.', '$.payload');
  if (payload.spec_version !== '0.1') addIssue(errors, 'SPEC_VERSION_UNSUPPORTED', 'spec_version must equal 0.1.', '$.payload.spec_version');
  if (payload.profile !== 'TP-JSON-0.1') addIssue(errors, 'PROFILE_UNSUPPORTED', 'profile must equal TP-JSON-0.1.', '$.payload.profile');
  if (typeof payload.bundle_id !== 'string' || payload.bundle_id.length === 0) addIssue(errors, 'BUNDLE_ID_INVALID', 'bundle_id must be non-empty.', '$.payload.bundle_id');
  if (typeof payload.action_id !== 'string' || payload.action_id.length === 0) addIssue(errors, 'ACTION_ID_INVALID', 'action_id must be non-empty.', '$.payload.action_id');
  if (!validUtcTimestamp(payload.created_at)) addIssue(errors, 'CREATED_AT_INVALID', 'created_at must be a UTC timestamp.', '$.payload.created_at');

  for (const member of ['issuers', 'events', 'evidence', 'relationships', 'predecessor_bundle_digests']) {
    if (!Array.isArray(payload[member])) addIssue(errors, 'PAYLOAD_ARRAY_INVALID', `${member} must be an array.`, `$.payload.${member}`);
  }
  if (!isPlainObject(payload.extensions)) addIssue(errors, 'PAYLOAD_EXTENSIONS_INVALID', 'extensions must be an object.', '$.payload.extensions');
  if (errors.length > 0) return { status: 'INVALID', errors, warnings, checks: [], valid_proofs: [] };

  const issuerIds = new Set();
  payload.issuers.forEach((issuer, index) => {
    verifyIssuer(issuer, `$.payload.issuers[${index}]`, errors);
    if (issuerIds.has(issuer.issuer_id)) addIssue(errors, 'DUPLICATE_ISSUER_ID', 'issuer_id must be unique.', `$.payload.issuers[${index}].issuer_id`);
    issuerIds.add(issuer.issuer_id);
  });

  const allIds = new Map();
  function registerId(id, path) {
    if (typeof id !== 'string') return;
    if (allIds.has(id)) addIssue(errors, 'DUPLICATE_OBJECT_ID', `Identifier duplicates ${allIds.get(id)}.`, path);
    else allIds.set(id, path);
  }

  payload.events.forEach((event, index) => {
    const path = `$.payload.events[${index}]`;
    verifyEvent(event, path, issuerIds, errors);
    registerId(event.event_id, `${path}.event_id`);
  });
  payload.evidence.forEach((evidence, index) => {
    const path = `$.payload.evidence[${index}]`;
    verifyEvidence(evidence, path, issuerIds, errors);
    registerId(evidence.evidence_id, `${path}.evidence_id`);
  });
  payload.relationships.forEach((relationship, index) => {
    const path = `$.payload.relationships[${index}]`;
    verifyRelationship(relationship, path, errors);
    registerId(relationship.relationship_id, `${path}.relationship_id`);
  });

  const eventDigests = new Set(payload.events.map((event) => event.object_digest?.value).filter(Boolean));
  const evidenceIds = new Set(payload.evidence.map((item) => item.evidence_id));
  payload.events.forEach((event, index) => {
    for (const parent of event.parent_event_digests ?? []) {
      if (!validDigest(parent)) addIssue(errors, 'PARENT_DIGEST_INVALID', 'Parent event digest is malformed.', `$.payload.events[${index}].parent_event_digests`);
      else if (!eventDigests.has(parent.value)) addIssue(errors, 'PARENT_EVENT_NOT_FOUND', 'Parent event digest does not resolve.', `$.payload.events[${index}].parent_event_digests`);
      else if (parent.value === event.object_digest?.value) addIssue(errors, 'EVENT_SELF_PARENT', 'Event cannot be its own causal parent.', `$.payload.events[${index}].parent_event_digests`);
    }
    for (const evidenceRef of event.evidence_refs ?? []) {
      if (!evidenceIds.has(evidenceRef)) addIssue(errors, 'EVENT_EVIDENCE_NOT_FOUND', 'evidence_ref does not resolve.', `$.payload.events[${index}].evidence_refs`);
    }
  });

  const resolvableRefs = new Set([
    ...payload.events.map((item) => `event:${item.event_id}`),
    ...payload.evidence.map((item) => `evidence:${item.evidence_id}`),
    ...payload.issuers.map((item) => `issuer:${item.issuer_id}`)
  ]);
  payload.relationships.forEach((relationship, index) => {
    if (!resolvableRefs.has(relationship.from_ref)) addIssue(errors, 'RELATIONSHIP_FROM_NOT_FOUND', 'from_ref does not resolve.', `$.payload.relationships[${index}].from_ref`);
    if (!resolvableRefs.has(relationship.to_ref)) addIssue(errors, 'RELATIONSHIP_TO_NOT_FOUND', 'to_ref does not resolve.', `$.payload.relationships[${index}].to_ref`);
  });

  payload.predecessor_bundle_digests.forEach((digest, index) => {
    if (!validDigest(digest)) addIssue(errors, 'PREDECESSOR_DIGEST_INVALID', 'Predecessor digest is malformed.', `$.payload.predecessor_bundle_digests[${index}]`);
  });

  const validProofs = [];
  const proofIds = new Set();
  bundle.proofs.forEach((proof, index) => {
    const path = `$.proofs[${index}]`;
    if (!isPlainObject(proof)) {
      addIssue(errors, 'PROOF_NOT_OBJECT', 'Proof must be an object.', path);
      return;
    }
    if (proofIds.has(proof.proof_id)) addIssue(errors, 'DUPLICATE_PROOF_ID', 'proof_id must be unique.', `${path}.proof_id`);
    proofIds.add(proof.proof_id);
    if (proof.proof_type !== 'SIGNATURE') addIssue(errors, 'PROOF_TYPE_UNSUPPORTED', 'Only SIGNATURE proofs are supported.', `${path}.proof_type`);
    if (!TARGET_TYPES.has(proof.target?.target_type)) addIssue(errors, 'PROOF_TARGET_TYPE_INVALID', 'Unknown proof target type.', `${path}.target.target_type`);
    if (!validUtcTimestamp(proof.created_at)) addIssue(errors, 'PROOF_CREATED_AT_INVALID', 'created_at must be a UTC timestamp.', `${path}.created_at`);
    if (!issuerIds.has(proof.issuer_ref)) addIssue(errors, 'PROOF_ISSUER_NOT_FOUND', 'issuer_ref does not resolve.', `${path}.issuer_ref`);
    const issuer = payload.issuers.find((candidate) => candidate.issuer_id === proof.issuer_ref);
    const result = verifySignatureProof(bundle, proof, issuer);
    if (!result.valid) addIssue(errors, result.code, 'Cryptographic proof verification failed.', path, result.detail);
    else validProofs.push({ proof_id: proof.proof_id, issuer_ref: proof.issuer_ref, target: proof.target });
  });

  let payloadDigest = null;
  try {
    payloadDigest = calculatePayloadDigest(bundle);
  } catch (error) {
    addIssue(errors, 'PAYLOAD_DIGEST_CALCULATION_FAILED', error.message, '$.payload');
  }

  if (errors.length > 0) {
    return { status: 'INVALID', errors, warnings, payload_digest: payloadDigest, valid_proofs: validProofs };
  }

  const incompleteReasons = [];
  if (payload.events.length === 0) incompleteReasons.push('NO_EVENTS');
  if (payload.evidence.length === 0) incompleteReasons.push('NO_EVIDENCE');
  if (bundle.proofs.length === 0) incompleteReasons.push('NO_PROOFS');
  for (const reason of incompleteReasons) addIssue(warnings, reason, 'Bundle is structurally sound but lacks evidence-bearing completeness.', '$');

  return {
    status: incompleteReasons.length > 0 ? 'INCOMPLETE' : 'VALID',
    errors,
    warnings,
    payload_digest: payloadDigest,
    valid_proofs: validProofs,
    summary: {
      issuers: payload.issuers.length,
      events: payload.events.length,
      evidence: payload.evidence.length,
      relationships: payload.relationships.length,
      proofs: bundle.proofs.length
    }
  };
}
