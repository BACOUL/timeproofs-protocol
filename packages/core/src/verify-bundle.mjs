import { parseJsonStrict } from './strict-json.mjs';
import {
  SHA256_PATTERN,
  calculateObjectDigest,
  calculatePayloadDigest,
  digestEquals
} from './digest.mjs';
import { verifySignatureProof } from './proofs.mjs';
import { assertKnownErrorCode, isKnownErrorCode } from './error-codes.mjs';
import { validateEventVocabulary, validateRelationshipVocabulary } from './vocabulary.mjs';
import {
  TOP_LEVEL_KEYS,
  PAYLOAD_KEYS,
  ISSUER_KEYS,
  IDENTIFIER_KEYS,
  KEY_REQUIRED_KEYS,
  KEY_OPTIONAL_KEYS,
  ENTITY_REQUIRED_KEYS,
  ENTITY_OPTIONAL_KEYS,
  EVENT_KEYS,
  EVIDENCE_KEYS,
  LOCATOR_KEYS,
  RELATIONSHIP_KEYS,
  PROOF_KEYS,
  DIGEST_KEYS,
  PHASES,
  STATUSES,
  SOURCE_CLASSES,
  TARGET_TYPES,
  ISSUER_TYPES,
  DISCLOSURES,
  LOCATOR_SCHEMES,
  RETRIEVAL_POLICIES,
  RELATIONSHIP_TYPES,
  EVENT_TYPE_PATTERN,
  EVIDENCE_TYPE_PATTERN,
  MEDIA_TYPE_PATTERN,
  RELATIONSHIP_REF_PATTERN,
  BASE64URL_PATTERN
} from './constants.mjs';

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(object, expected) {
  if (!isPlainObject(object)) return false;
  const actual = Object.keys(object).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function allowedKeys(object, required, optional = []) {
  if (!isPlainObject(object)) return false;
  const keys = Object.keys(object);
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => Object.hasOwn(object, key)) && keys.every((key) => allowed.has(key));
}

function validUtcTimestamp(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?Z$/u.exec(value);
  if (!match) return false;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59) return false;
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day &&
    date.getUTCHours() === hour && date.getUTCMinutes() === minute && date.getUTCSeconds() === second;
}

function compareTimestamps(left, right) {
  return Date.parse(left) - Date.parse(right);
}

function validDigest(value) {
  return isPlainObject(value) && exactKeys(value, DIGEST_KEYS) && value.algorithm === 'sha-256' &&
    typeof value.value === 'string' && SHA256_PATTERN.test(value.value);
}

function addIssue(collection, code, message, path, detail) {
  assertKnownErrorCode(code);
  collection.push({ code, message, path, ...(detail === undefined ? {} : { detail }) });
}

function addExternalIssue(collection, code, message, path, detail) {
  const normalizedCode = isKnownErrorCode(code) ? code : 'JSON_PARSE_ERROR';
  addIssue(collection, normalizedCode, message, path, detail);
}

function duplicates(values, key = (value) => value) {
  const seen = new Set();
  const repeated = [];
  for (const value of values) {
    const identifier = key(value);
    if (seen.has(identifier)) repeated.push(identifier);
    else seen.add(identifier);
  }
  return repeated;
}

function canonicalBase64url(value) {
  if (typeof value !== 'string' || value.length === 0 || !BASE64URL_PATTERN.test(value) || value.includes('=')) return false;
  try {
    const bytes = Buffer.from(value, 'base64url');
    return bytes.length > 0 && bytes.toString('base64url') === value;
  } catch {
    return false;
  }
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

function verifyEntityRef(entity, path, errorCode, errors) {
  if (!isPlainObject(entity)) {
    addIssue(errors, errorCode, 'Entity Reference must be an object.', path);
    return;
  }
  if (!allowedKeys(entity, ENTITY_REQUIRED_KEYS, ENTITY_OPTIONAL_KEYS)) {
    addIssue(errors, 'ENTITY_REF_MEMBERS_INVALID', 'Entity Reference members are not permitted by TP-JSON-0.1.', path);
  }
  if (typeof entity.entity_type !== 'string' || entity.entity_type.length === 0) {
    addIssue(errors, 'ENTITY_TYPE_INVALID', 'entity_type must be a non-empty string.', `${path}.entity_type`);
  }
  if (typeof entity.entity_id !== 'string' || entity.entity_id.length === 0) {
    addIssue(errors, 'ENTITY_ID_INVALID', 'entity_id must be a non-empty string.', `${path}.entity_id`);
  }
  if (Object.hasOwn(entity, 'display_name') && typeof entity.display_name !== 'string') {
    addIssue(errors, 'ENTITY_DISPLAY_NAME_INVALID', 'display_name must be a string when present.', `${path}.display_name`);
  }
}

function verifyIssuer(issuer, path, errors) {
  if (!isPlainObject(issuer)) {
    addIssue(errors, 'ISSUER_NOT_OBJECT', 'Issuer must be an object.', path);
    return;
  }
  if (!exactKeys(issuer, ISSUER_KEYS)) addIssue(errors, 'ISSUER_MEMBERS_INVALID', 'Issuer members do not match TP-JSON-0.1.', path);
  if (typeof issuer.issuer_id !== 'string' || issuer.issuer_id.length === 0) addIssue(errors, 'ISSUER_ID_INVALID', 'issuer_id must be a non-empty string.', `${path}.issuer_id`);
  if (typeof issuer.display_name !== 'string' || issuer.display_name.length === 0) addIssue(errors, 'ISSUER_DISPLAY_NAME_INVALID', 'display_name must be a non-empty string.', `${path}.display_name`);
  if (!ISSUER_TYPES.has(issuer.issuer_type)) addIssue(errors, 'ISSUER_TYPE_INVALID', 'issuer_type is unsupported.', `${path}.issuer_type`);
  if (!Array.isArray(issuer.identifiers)) {
    addIssue(errors, 'ISSUER_IDENTIFIERS_INVALID', 'identifiers must be an array.', `${path}.identifiers`);
  } else {
    const identifierKeys = [];
    issuer.identifiers.forEach((identifier, identifierIndex) => {
      const identifierPath = `${path}.identifiers[${identifierIndex}]`;
      if (!isPlainObject(identifier)) {
        addIssue(errors, 'IDENTIFIER_NOT_OBJECT', 'Identifier must be an object.', identifierPath);
        return;
      }
      if (!exactKeys(identifier, IDENTIFIER_KEYS)) addIssue(errors, 'IDENTIFIER_MEMBERS_INVALID', 'Identifier members must be exactly scheme and value.', identifierPath);
      if (typeof identifier.scheme !== 'string' || identifier.scheme.length === 0) addIssue(errors, 'IDENTIFIER_SCHEME_INVALID', 'scheme must be a non-empty string.', `${identifierPath}.scheme`);
      if (typeof identifier.value !== 'string' || identifier.value.length === 0) addIssue(errors, 'IDENTIFIER_VALUE_INVALID', 'value must be a non-empty string.', `${identifierPath}.value`);
      identifierKeys.push(`${identifier.scheme}\u0000${identifier.value}`);
    });
    if (duplicates(identifierKeys).length > 0) addIssue(errors, 'DUPLICATE_ISSUER_IDENTIFIER', 'Issuer identifiers must be unique by scheme and value.', `${path}.identifiers`);
  }
  if (!Array.isArray(issuer.keys)) {
    addIssue(errors, 'ISSUER_KEYS_INVALID', 'keys must be an array.', `${path}.keys`);
  } else {
    const keyIds = [];
    issuer.keys.forEach((key, keyIndex) => {
      const keyPath = `${path}.keys[${keyIndex}]`;
      if (!isPlainObject(key)) {
        addIssue(errors, 'KEY_NOT_OBJECT', 'Key must be an object.', keyPath);
        return;
      }
      if (!allowedKeys(key, KEY_REQUIRED_KEYS, KEY_OPTIONAL_KEYS)) addIssue(errors, 'KEY_MEMBERS_INVALID', 'Key members are outside the TP-JSON-0.1 model.', keyPath);
      if (typeof key.key_id !== 'string' || key.key_id.length === 0) addIssue(errors, 'KEY_ID_INVALID', 'key_id must be non-empty.', `${keyPath}.key_id`);
      keyIds.push(key.key_id);
      if (key.algorithm !== 'Ed25519') addIssue(errors, 'KEY_ALGORITHM_UNSUPPORTED', 'Only Ed25519 is supported in TP-JSON-0.1.', `${keyPath}.algorithm`);
      if (key.format !== 'spki-pem') addIssue(errors, 'KEY_FORMAT_UNSUPPORTED', 'Only spki-pem is supported in TP-JSON-0.1.', `${keyPath}.format`);
      if (typeof key.public_key !== 'string' || !key.public_key.includes('-----BEGIN PUBLIC KEY-----') || !key.public_key.includes('-----END PUBLIC KEY-----')) {
        addIssue(errors, 'PUBLIC_KEY_INVALID', 'public_key must contain an SPKI PEM public key.', `${keyPath}.public_key`);
      }
      if (Object.hasOwn(key, 'valid_from') && !validUtcTimestamp(key.valid_from)) addIssue(errors, 'KEY_VALID_FROM_INVALID', 'valid_from must be a UTC timestamp.', `${keyPath}.valid_from`);
      if (Object.hasOwn(key, 'valid_until') && !validUtcTimestamp(key.valid_until)) addIssue(errors, 'KEY_VALID_UNTIL_INVALID', 'valid_until must be a UTC timestamp.', `${keyPath}.valid_until`);
      if (validUtcTimestamp(key.valid_from) && validUtcTimestamp(key.valid_until) && compareTimestamps(key.valid_until, key.valid_from) <= 0) {
        addIssue(errors, 'KEY_VALIDITY_INTERVAL_INVALID', 'valid_until must be later than valid_from.', keyPath);
      }
      if (Object.hasOwn(key, 'revocation_ref') && (typeof key.revocation_ref !== 'string' || key.revocation_ref.length === 0)) {
        addIssue(errors, 'KEY_REVOCATION_REF_INVALID', 'revocation_ref must be a non-empty string when present.', `${keyPath}.revocation_ref`);
      }
    });
    if (duplicates(keyIds).length > 0) addIssue(errors, 'DUPLICATE_KEY_ID', 'key_id must be unique within an issuer.', `${path}.keys`);
  }
  if (!isPlainObject(issuer.extensions)) addIssue(errors, 'ISSUER_EXTENSIONS_INVALID', 'extensions must be an object.', `${path}.extensions`);
}

function verifyEvent(event, path, issuerIds, errors) {
  if (!isPlainObject(event)) {
    addIssue(errors, 'EVENT_NOT_OBJECT', 'Outcome Event must be an object.', path);
    return;
  }
  if (!exactKeys(event, EVENT_KEYS)) addIssue(errors, 'EVENT_MEMBERS_INVALID', 'Outcome Event members do not match TP-JSON-0.1.', path);
  for (const member of ['event_id', 'phase', 'event_type', 'status', 'occurred_at', 'recorded_at', 'source_class', 'issuer_ref']) {
    if (typeof event[member] !== 'string' || event[member].length === 0) addIssue(errors, 'EVENT_REQUIRED_MEMBER_INVALID', `${member} must be a non-empty string.`, `${path}.${member}`);
  }
  if (!PHASES.has(event.phase)) addIssue(errors, 'EVENT_PHASE_INVALID', 'Unknown lifecycle phase.', `${path}.phase`);
  if (!EVENT_TYPE_PATTERN.test(event.event_type ?? '')) addIssue(errors, 'EVENT_TYPE_INVALID', 'event_type must use a lower-case namespaced token.', `${path}.event_type`);
  if (!STATUSES.has(event.status)) addIssue(errors, 'EVENT_STATUS_INVALID', 'Unknown event status.', `${path}.status`);
  if (!SOURCE_CLASSES.has(event.source_class)) addIssue(errors, 'SOURCE_CLASS_INVALID', 'Unknown evidence source class.', `${path}.source_class`);
  if (!validUtcTimestamp(event.occurred_at)) addIssue(errors, 'EVENT_OCCURRED_AT_INVALID', 'occurred_at must be a UTC timestamp.', `${path}.occurred_at`);
  if (!validUtcTimestamp(event.recorded_at)) addIssue(errors, 'EVENT_RECORDED_AT_INVALID', 'recorded_at must be a UTC timestamp.', `${path}.recorded_at`);
  if (validUtcTimestamp(event.occurred_at) && validUtcTimestamp(event.recorded_at) && compareTimestamps(event.recorded_at, event.occurred_at) < 0) {
    addIssue(errors, 'EVENT_RECORDED_BEFORE_OCCURRED', 'recorded_at must not precede occurred_at.', `${path}.recorded_at`);
  }
  if (!issuerIds.has(event.issuer_ref)) addIssue(errors, 'EVENT_ISSUER_NOT_FOUND', 'issuer_ref does not resolve.', `${path}.issuer_ref`);
  if (!Array.isArray(event.parent_event_digests)) addIssue(errors, 'EVENT_PARENTS_INVALID', 'parent_event_digests must be an array.', `${path}.parent_event_digests`);
  else if (duplicates(event.parent_event_digests, (digest) => `${digest?.algorithm}:${digest?.value}`).length > 0) addIssue(errors, 'DUPLICATE_PARENT_DIGEST', 'parent_event_digests must be unique.', `${path}.parent_event_digests`);
  if (!Array.isArray(event.evidence_refs)) addIssue(errors, 'EVENT_EVIDENCE_REFS_INVALID', 'evidence_refs must be an array.', `${path}.evidence_refs`);
  else if (duplicates(event.evidence_refs).length > 0) addIssue(errors, 'DUPLICATE_EVENT_EVIDENCE_REF', 'evidence_refs must be unique.', `${path}.evidence_refs`);
  verifyEntityRef(event.actor, `${path}.actor`, 'EVENT_ACTOR_INVALID', errors);
  verifyEntityRef(event.subject, `${path}.subject`, 'EVENT_SUBJECT_INVALID', errors);
  if (!isPlainObject(event.claim)) addIssue(errors, 'EVENT_CLAIM_INVALID', 'claim must be an object.', `${path}.claim`);
  if (!isPlainObject(event.extensions)) addIssue(errors, 'EVENT_EXTENSIONS_INVALID', 'extensions must be an object.', `${path}.extensions`);
  if (PHASES.has(event.phase) && STATUSES.has(event.status) && SOURCE_CLASSES.has(event.source_class) && EVENT_TYPE_PATTERN.test(event.event_type ?? '')) {
    for (const issue of validateEventVocabulary(event)) {
      addIssue(errors, issue.code, issue.message, issue.member ? `${path}.${issue.member}` : path);
    }
  }
  verifyObjectDigest(event, path, errors);
}

function verifyLocator(locator, path, errors) {
  if (!isPlainObject(locator)) {
    addIssue(errors, 'EVIDENCE_LOCATOR_INVALID', 'locator must be an object.', path);
    return;
  }
  if (!exactKeys(locator, LOCATOR_KEYS)) addIssue(errors, 'LOCATOR_MEMBERS_INVALID', 'Locator members do not match TP-JSON-0.1.', path);
  if (!LOCATOR_SCHEMES.has(locator.scheme)) addIssue(errors, 'LOCATOR_SCHEME_INVALID', 'Unknown locator scheme.', `${path}.scheme`);
  if (typeof locator.value !== 'string' || locator.value.length === 0) addIssue(errors, 'LOCATOR_VALUE_INVALID', 'locator.value must be a non-empty string.', `${path}.value`);
  if (!RETRIEVAL_POLICIES.has(locator.retrieval_policy)) addIssue(errors, 'LOCATOR_RETRIEVAL_POLICY_INVALID', 'Unknown retrieval policy.', `${path}.retrieval_policy`);
  if (locator.scheme === 'https') {
    try {
      const url = new URL(locator.value);
      if (url.protocol !== 'https:') throw new TypeError('not https');
    } catch {
      addIssue(errors, 'LOCATOR_VALUE_INVALID', 'https locator values must be absolute HTTPS URLs.', `${path}.value`);
    }
  }
  if (locator.scheme === 'embedded' && locator.retrieval_policy === 'UNAVAILABLE') {
    addIssue(errors, 'LOCATOR_POLICY_CONFLICT', 'Embedded evidence cannot use UNAVAILABLE retrieval policy.', path);
  }
}

function verifyEvidence(evidence, path, issuerIds, errors) {
  if (!isPlainObject(evidence)) {
    addIssue(errors, 'EVIDENCE_NOT_OBJECT', 'Evidence Item must be an object.', path);
    return;
  }
  if (!exactKeys(evidence, EVIDENCE_KEYS)) addIssue(errors, 'EVIDENCE_MEMBERS_INVALID', 'Evidence Item members do not match TP-JSON-0.1.', path);
  for (const member of ['evidence_id', 'evidence_type', 'media_type', 'source_class', 'issuer_ref', 'disclosure']) {
    if (typeof evidence[member] !== 'string' || evidence[member].length === 0) addIssue(errors, 'EVIDENCE_REQUIRED_MEMBER_INVALID', `${member} must be a non-empty string.`, `${path}.${member}`);
  }
  if (!EVIDENCE_TYPE_PATTERN.test(evidence.evidence_type ?? '')) addIssue(errors, 'EVIDENCE_TYPE_INVALID', 'evidence_type must use an upper-case namespaced token.', `${path}.evidence_type`);
  if (!MEDIA_TYPE_PATTERN.test(evidence.media_type ?? '')) addIssue(errors, 'MEDIA_TYPE_INVALID', 'media_type is invalid.', `${path}.media_type`);
  if (!SOURCE_CLASSES.has(evidence.source_class)) addIssue(errors, 'SOURCE_CLASS_INVALID', 'Unknown evidence source class.', `${path}.source_class`);
  if (!issuerIds.has(evidence.issuer_ref)) addIssue(errors, 'EVIDENCE_ISSUER_NOT_FOUND', 'issuer_ref does not resolve.', `${path}.issuer_ref`);
  if (!validDigest(evidence.content_digest)) addIssue(errors, 'CONTENT_DIGEST_INVALID', 'content_digest must be a SHA-256 digest.', `${path}.content_digest`);
  verifyLocator(evidence.locator, `${path}.locator`, errors);
  if (!Array.isArray(evidence.claim_scope) || evidence.claim_scope.length === 0 || evidence.claim_scope.some((item) => typeof item !== 'string' || !EVENT_TYPE_PATTERN.test(item))) {
    addIssue(errors, 'CLAIM_SCOPE_INVALID', 'claim_scope must be a non-empty array of event type strings.', `${path}.claim_scope`);
  } else if (duplicates(evidence.claim_scope).length > 0) {
    addIssue(errors, 'DUPLICATE_CLAIM_SCOPE', 'claim_scope entries must be unique.', `${path}.claim_scope`);
  }
  if (!DISCLOSURES.has(evidence.disclosure)) addIssue(errors, 'DISCLOSURE_INVALID', 'Unknown disclosure class.', `${path}.disclosure`);
  if (!isPlainObject(evidence.extensions)) addIssue(errors, 'EVIDENCE_EXTENSIONS_INVALID', 'extensions must be an object.', `${path}.extensions`);
  verifyObjectDigest(evidence, path, errors);
}

function verifyRelationship(relationship, path, errors) {
  if (!isPlainObject(relationship)) {
    addIssue(errors, 'RELATIONSHIP_NOT_OBJECT', 'Relationship must be an object.', path);
    return;
  }
  if (!exactKeys(relationship, RELATIONSHIP_KEYS)) addIssue(errors, 'RELATIONSHIP_MEMBERS_INVALID', 'Relationship members do not match TP-JSON-0.1.', path);
  for (const member of ['relationship_id', 'relationship_type', 'from_ref', 'to_ref']) {
    if (typeof relationship[member] !== 'string' || relationship[member].length === 0) addIssue(errors, 'RELATIONSHIP_REQUIRED_MEMBER_INVALID', `${member} must be non-empty.`, `${path}.${member}`);
  }
  if (!RELATIONSHIP_TYPES.has(relationship.relationship_type)) addIssue(errors, 'RELATIONSHIP_TYPE_INVALID', 'Unknown relationship type.', `${path}.relationship_type`);
  for (const member of ['from_ref', 'to_ref']) {
    if (!RELATIONSHIP_REF_PATTERN.test(relationship[member] ?? '')) addIssue(errors, 'RELATIONSHIP_REF_INVALID', `${member} must be a typed event, evidence, or issuer reference.`, `${path}.${member}`);
  }
  if (relationship.from_ref === relationship.to_ref) addIssue(errors, 'RELATIONSHIP_SELF_REFERENCE', 'Relationship endpoints must differ.', path);
  if (RELATIONSHIP_TYPES.has(relationship.relationship_type) && RELATIONSHIP_REF_PATTERN.test(relationship.from_ref ?? '') && RELATIONSHIP_REF_PATTERN.test(relationship.to_ref ?? '')) {
    for (const issue of validateRelationshipVocabulary(relationship)) {
      addIssue(errors, issue.code, issue.message, path);
    }
  }
  if (!isPlainObject(relationship.extensions)) addIssue(errors, 'RELATIONSHIP_EXTENSIONS_INVALID', 'extensions must be an object.', `${path}.extensions`);
  verifyObjectDigest(relationship, path, errors);
}

function targetExpectedKeys(targetType) {
  return targetType === 'BUNDLE_PAYLOAD' ? ['target_type', 'digest'] : ['target_type', 'target_id', 'digest'];
}

function verifyProofShape(proof, path, issuerIds, errors) {
  if (!isPlainObject(proof)) {
    addIssue(errors, 'PROOF_NOT_OBJECT', 'Proof must be an object.', path);
    return false;
  }
  if (!exactKeys(proof, PROOF_KEYS)) addIssue(errors, 'PROOF_MEMBERS_INVALID', 'Proof members do not match TP-JSON-0.1.', path);
  if (typeof proof.proof_id !== 'string' || proof.proof_id.length === 0) addIssue(errors, 'PROOF_ID_INVALID', 'proof_id must be a non-empty string.', `${path}.proof_id`);
  if (proof.proof_type !== 'SIGNATURE') addIssue(errors, 'PROOF_TYPE_UNSUPPORTED', 'Only SIGNATURE proofs are supported.', `${path}.proof_type`);
  if (!isPlainObject(proof.target)) {
    addIssue(errors, 'PROOF_TARGET_INVALID', 'target must be an object.', `${path}.target`);
  } else {
    if (!TARGET_TYPES.has(proof.target.target_type)) addIssue(errors, 'PROOF_TARGET_TYPE_INVALID', 'Unknown proof target type.', `${path}.target.target_type`);
    const expected = targetExpectedKeys(proof.target.target_type);
    if (!exactKeys(proof.target, expected)) addIssue(errors, 'PROOF_TARGET_MEMBERS_INVALID', 'Proof Target members do not match target_type.', `${path}.target`);
    if (proof.target.target_type === 'BUNDLE_PAYLOAD' && Object.hasOwn(proof.target, 'target_id')) addIssue(errors, 'PROOF_TARGET_ID_FORBIDDEN', 'target_id is forbidden for BUNDLE_PAYLOAD.', `${path}.target.target_id`);
    if (proof.target.target_type !== 'BUNDLE_PAYLOAD' && (typeof proof.target.target_id !== 'string' || proof.target.target_id.length === 0)) addIssue(errors, 'PROOF_TARGET_ID_REQUIRED', 'target_id is required for non-payload targets.', `${path}.target.target_id`);
    if (!validDigest(proof.target.digest)) addIssue(errors, 'PROOF_TARGET_DIGEST_INVALID', 'target.digest must be a SHA-256 digest.', `${path}.target.digest`);
  }
  if (!issuerIds.has(proof.issuer_ref)) addIssue(errors, 'PROOF_ISSUER_NOT_FOUND', 'issuer_ref does not resolve.', `${path}.issuer_ref`);
  if (typeof proof.verification_method !== 'string' || !/^.+#[^#]+$/u.test(proof.verification_method)) addIssue(errors, 'VERIFICATION_METHOD_INVALID', 'verification_method must be issuer_id#key_id.', `${path}.verification_method`);
  if (!validUtcTimestamp(proof.created_at)) addIssue(errors, 'PROOF_CREATED_AT_INVALID', 'created_at must be a UTC timestamp.', `${path}.created_at`);
  if (proof.algorithm !== 'Ed25519') addIssue(errors, 'PROOF_ALGORITHM_UNSUPPORTED', 'Only Ed25519 is supported.', `${path}.algorithm`);
  if (!canonicalBase64url(proof.proof_value)) addIssue(errors, 'PROOF_VALUE_INVALID', 'proof_value must be canonical unpadded base64url.', `${path}.proof_value`);
  return true;
}

export function verifyBundle(input) {
  const errors = [];
  const warnings = [];
  let bundle;

  try {
    bundle = typeof input === 'string' ? parseJsonStrict(input) : input;
  } catch (error) {
    addExternalIssue(errors, error.code, error.message, '$', error.position === undefined ? undefined : { position: error.position });
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
    const path = `$.payload.issuers[${index}]`;
    verifyIssuer(issuer, path, errors);
    if (typeof issuer?.issuer_id === 'string') {
      if (issuerIds.has(issuer.issuer_id)) addIssue(errors, 'DUPLICATE_ISSUER_ID', 'issuer_id must be unique.', `${path}.issuer_id`);
      issuerIds.add(issuer.issuer_id);
    }
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
    registerId(event?.event_id, `${path}.event_id`);
  });
  payload.evidence.forEach((evidence, index) => {
    const path = `$.payload.evidence[${index}]`;
    verifyEvidence(evidence, path, issuerIds, errors);
    registerId(evidence?.evidence_id, `${path}.evidence_id`);
  });
  payload.relationships.forEach((relationship, index) => {
    const path = `$.payload.relationships[${index}]`;
    verifyRelationship(relationship, path, errors);
    registerId(relationship?.relationship_id, `${path}.relationship_id`);
  });

  const eventDigests = new Set(payload.events.map((event) => event?.object_digest?.value).filter(Boolean));
  const evidenceIds = new Set(payload.evidence.map((item) => item?.evidence_id).filter((value) => typeof value === 'string'));
  payload.events.forEach((event, index) => {
    for (const parent of event?.parent_event_digests ?? []) {
      if (!validDigest(parent)) addIssue(errors, 'PARENT_DIGEST_INVALID', 'Parent event digest is malformed.', `$.payload.events[${index}].parent_event_digests`);
      else if (!eventDigests.has(parent.value)) addIssue(errors, 'PARENT_EVENT_NOT_FOUND', 'Parent event digest does not resolve.', `$.payload.events[${index}].parent_event_digests`);
      else if (parent.value === event?.object_digest?.value) addIssue(errors, 'EVENT_SELF_PARENT', 'Event cannot be its own causal parent.', `$.payload.events[${index}].parent_event_digests`);
    }
    for (const evidenceRef of event?.evidence_refs ?? []) {
      if (!evidenceIds.has(evidenceRef)) addIssue(errors, 'EVENT_EVIDENCE_NOT_FOUND', 'evidence_ref does not resolve.', `$.payload.events[${index}].evidence_refs`);
    }
  });

  const resolvableRefs = new Set([
    ...payload.events.map((item) => `event:${item?.event_id}`),
    ...payload.evidence.map((item) => `evidence:${item?.evidence_id}`),
    ...payload.issuers.map((item) => `issuer:${item?.issuer_id}`)
  ]);
  payload.relationships.forEach((relationship, index) => {
    if (!resolvableRefs.has(relationship?.from_ref)) addIssue(errors, 'RELATIONSHIP_FROM_NOT_FOUND', 'from_ref does not resolve.', `$.payload.relationships[${index}].from_ref`);
    if (!resolvableRefs.has(relationship?.to_ref)) addIssue(errors, 'RELATIONSHIP_TO_NOT_FOUND', 'to_ref does not resolve.', `$.payload.relationships[${index}].to_ref`);
  });

  const predecessorKeys = [];
  payload.predecessor_bundle_digests.forEach((digest, index) => {
    if (!validDigest(digest)) addIssue(errors, 'PREDECESSOR_DIGEST_INVALID', 'Predecessor digest is malformed.', `$.payload.predecessor_bundle_digests[${index}]`);
    predecessorKeys.push(`${digest?.algorithm}:${digest?.value}`);
  });
  if (duplicates(predecessorKeys).length > 0) addIssue(errors, 'DUPLICATE_PREDECESSOR_DIGEST', 'Predecessor digests must be unique.', '$.payload.predecessor_bundle_digests');

  const validProofs = [];
  const proofIds = new Set();
  bundle.proofs.forEach((proof, index) => {
    const path = `$.proofs[${index}]`;
    const shapeProcessed = verifyProofShape(proof, path, issuerIds, errors);
    if (!shapeProcessed || !isPlainObject(proof)) return;
    if (proofIds.has(proof.proof_id)) addIssue(errors, 'DUPLICATE_PROOF_ID', 'proof_id must be unique.', `${path}.proof_id`);
    proofIds.add(proof.proof_id);
    const issuer = payload.issuers.find((candidate) => candidate?.issuer_id === proof.issuer_ref);
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

  if (errors.length > 0) return { status: 'INVALID', errors, warnings, payload_digest: payloadDigest, valid_proofs: validProofs };

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
