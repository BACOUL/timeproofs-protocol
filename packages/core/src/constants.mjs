export const TOP_LEVEL_KEYS = Object.freeze(['payload', 'proofs']);
export const PAYLOAD_KEYS = Object.freeze([
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
]);
export const ISSUER_KEYS = Object.freeze(['issuer_id', 'display_name', 'issuer_type', 'identifiers', 'keys', 'extensions']);
export const IDENTIFIER_KEYS = Object.freeze(['scheme', 'value']);
export const KEY_REQUIRED_KEYS = Object.freeze(['key_id', 'algorithm', 'format', 'public_key']);
export const KEY_OPTIONAL_KEYS = Object.freeze(['valid_from', 'valid_until', 'revocation_ref']);
export const ENTITY_REQUIRED_KEYS = Object.freeze(['entity_type', 'entity_id']);
export const ENTITY_OPTIONAL_KEYS = Object.freeze(['display_name']);
export const EVENT_KEYS = Object.freeze([
  'event_id', 'phase', 'event_type', 'status', 'occurred_at', 'recorded_at',
  'source_class', 'issuer_ref', 'actor', 'subject', 'claim', 'evidence_refs',
  'parent_event_digests', 'extensions', 'object_digest'
]);
export const EVIDENCE_KEYS = Object.freeze([
  'evidence_id', 'evidence_type', 'media_type', 'source_class', 'issuer_ref',
  'claim_scope', 'content_digest', 'locator', 'disclosure', 'extensions', 'object_digest'
]);
export const LOCATOR_KEYS = Object.freeze(['scheme', 'value', 'retrieval_policy']);
export const RELATIONSHIP_KEYS = Object.freeze([
  'relationship_id', 'relationship_type', 'from_ref', 'to_ref', 'extensions', 'object_digest'
]);
export const PROOF_KEYS = Object.freeze([
  'proof_id', 'proof_type', 'target', 'issuer_ref', 'verification_method',
  'created_at', 'algorithm', 'proof_value'
]);
export const DIGEST_KEYS = Object.freeze(['algorithm', 'value']);

export const PHASES = new Set(['INTENT', 'AUTHORIZATION', 'DISPATCH', 'ACCEPTANCE', 'EFFECT', 'SETTLEMENT', 'TERMINATION']);
export const STATUSES = new Set(['PENDING', 'SUCCEEDED', 'FAILED', 'PARTIAL', 'CANCELLED', 'REVERSED', 'EXPIRED']);
export const SOURCE_CLASSES = new Set(['SELF_CLAIMED', 'GATEWAY_OBSERVED', 'RECEIVER_ATTESTED', 'SYSTEM_OF_RECORD', 'INDEPENDENTLY_SETTLED']);
export const TARGET_TYPES = new Set(['BUNDLE_PAYLOAD', 'OUTCOME_EVENT', 'EVIDENCE_ITEM', 'RELATIONSHIP']);
export const ISSUER_TYPES = new Set(['AI_AGENT', 'GATEWAY', 'SERVICE', 'ORGANIZATION', 'SYSTEM', 'PAYMENT_PROVIDER', 'OTHER']);
export const DISCLOSURES = new Set(['PUBLIC', 'RESTRICTED', 'PRIVATE', 'COMMITMENT_ONLY']);
export const LOCATOR_SCHEMES = new Set(['opaque', 'embedded', 'https']);
export const RETRIEVAL_POLICIES = new Set(['PUBLIC', 'AUTHORIZED_ONLY', 'LOCAL_ONLY', 'UNAVAILABLE']);
export const RELATIONSHIP_TYPES = new Set(['SUPPORTS', 'CONTRADICTS', 'SUPERSEDES', 'REVERSES', 'CORRESPONDS_TO']);

export const EVENT_TYPE_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)+$/u;
export const EVIDENCE_TYPE_PATTERN = /^[A-Z0-9]+(?:[._-][A-Z0-9]+)*$/u;
export const MEDIA_TYPE_PATTERN = /^[A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+(?:\s*;.*)?$/u;
export const RELATIONSHIP_REF_PATTERN = /^(?:event|evidence|issuer):[^:\s]+$/u;
export const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/u;
