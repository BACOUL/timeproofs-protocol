# TimeProofs Evidence Bundle Specification v0.1

Status: EXPERIMENTAL DRAFT  
Profile: `TP-JSON-0.1`  
Date: 2026-07-23

## 1. Purpose

A TimeProofs Evidence Bundle is a portable cryptographic container for evidence associated with the lifecycle of an action performed or attempted by an AI agent.

A bundle records claims, observations, causal relationships, evidence references, issuers, and cryptographic proofs. A bundle does not, by itself, guarantee that every recorded claim is factually true, legally effective, complete, current, or sufficient for a business verdict.

The v0.1 interoperability objective is that independent implementations can parse, canonicalize, digest, sign, exchange, and verify the same bundle without private coordination.

## 2. Conformance language

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, and **OPTIONAL** are normative when written in uppercase.

A producer conforms when it emits bundles satisfying the abstract model, field semantics, canonicalization rules, digest rules, and proof rules in this document.

A verifier conforms when it performs the ordered verification algorithm, returns the structural outcomes defined here, and emits stable codes from `spec/error-codes-v0.1.json`.

## 3. Non-goals

This specification does not define:

- agent identity or authentication;
- user authorization or mandates;
- payment processing;
- legal liability or evidentiary weight;
- a universal trust registry;
- a business outcome verdict;
- managed retention;
- a runtime allow/deny firewall;
- protocol-specific ACP, UCP, AP2, MCP, or A2A mappings.

## 4. Architectural separation

TimeProofs separates three layers:

```text
Immutable Evidence Bundles
→ Versioned Verification Rules
→ Recalculable Verdicts
```

A bundle MUST contain evidence-bearing facts and claims, not a TimeProofs business verdict. A later event, reversal, key-status change, or ruleset revision can change the verdict without modifying prior bundles.

## 5. Evidence Bundle envelope

A `TP-JSON-0.1` bundle MUST be a JSON object containing exactly `payload` and `proofs`:

```json
{
  "payload": {},
  "proofs": []
}
```

`payload` contains evidence-bearing data. `proofs` contains cryptographic attestations over the payload or an addressable payload object. `proofs` MUST NOT be included in the payload digest.

The path `$` identifies the complete envelope. The path `$.payload` identifies the signed evidence-bearing payload. The path `$.proofs` identifies the proof array.

## 6. Payload

The `$.payload` object MUST contain exactly:

```json
{
  "spec_version": "0.1",
  "profile": "TP-JSON-0.1",
  "bundle_id": "tpb_...",
  "action_id": "tpa_...",
  "created_at": "2026-07-23T14:32:08Z",
  "issuers": [],
  "events": [],
  "evidence": [],
  "relationships": [],
  "predecessor_bundle_digests": [],
  "extensions": {}
}
```

### 6.1 Version

`$.payload.spec_version` MUST be the JSON string `"0.1"`. It MUST NOT be encoded as a number.

### 6.2 Profile

`$.payload.profile` MUST be the string `"TP-JSON-0.1"`.

### 6.3 Bundle identifier

`$.payload.bundle_id` MUST be a non-empty opaque string identifying one immutable bundle revision. Consumers MUST NOT infer time, authority, issuer, or semantics from its internal form.

### 6.4 Action identifier

`$.payload.action_id` MUST be a non-empty opaque string identifying the logical action across revisions. Revisions of the same logical action MUST preserve it. A genuinely new attempt SHOULD use a new action identifier.

### 6.5 Creation time

`$.payload.created_at` MUST be a syntactically and calendrically valid UTC timestamp ending in uppercase `Z`. Local offsets and leap-second values are not supported by `TP-JSON-0.1`.

### 6.6 Revision history

`$.payload.predecessor_bundle_digests` MUST be an array of unique SHA-256 payload digests. Its entries are addressed as `$.payload.predecessor_bundle_digests[]`. A first revision MUST use an empty array. A later revision MUST list each direct predecessor. Multiple predecessors MAY represent a merge of independently produced revisions.

Each predecessor digest contains `$.payload.predecessor_bundle_digests[].algorithm` and `$.payload.predecessor_bundle_digests[].value`.

### 6.7 Collections and ordering

`$.payload.issuers`, `$.payload.events`, `$.payload.evidence`, and `$.payload.relationships` MUST be arrays. Their array order is cryptographically significant because arrays are canonicalized in order, but array order MUST NOT be interpreted as authoritative causal or chronological order unless a future profile explicitly says otherwise.

## 7. Issuers, identifiers, and keys

An entry at `$.payload.issuers[]` describes an entity that creates an event, supplies evidence, or issues a proof. A self-declared issuer description does not establish trust or authority.

Each issuer MUST contain:

- `$.payload.issuers[].issuer_id`: non-empty identifier unique in the issuer collection;
- `$.payload.issuers[].display_name`: non-empty human-readable label with no trust semantics;
- `$.payload.issuers[].issuer_type`: one of `AI_AGENT`, `GATEWAY`, `SERVICE`, `ORGANIZATION`, `SYSTEM`, `PAYMENT_PROVIDER`, or `OTHER`;
- `$.payload.issuers[].identifiers`: array of external identifiers;
- `$.payload.issuers[].keys`: array of public verification keys;
- `$.payload.issuers[].extensions`: namespaced extension object.

Each `$.payload.issuers[].identifiers[]` MUST contain exactly `$.payload.issuers[].identifiers[].scheme` and `$.payload.issuers[].identifiers[].value`. The same scheme/value pair MUST NOT be repeated for one issuer.

Each `$.payload.issuers[].keys[]` MUST contain:

- `$.payload.issuers[].keys[].key_id`, unique within the issuer;
- `$.payload.issuers[].keys[].algorithm`, equal to `Ed25519`;
- `$.payload.issuers[].keys[].format`, equal to `spki-pem`;
- `$.payload.issuers[].keys[].public_key`, containing an Ed25519 SPKI PEM public key.

A key MAY contain `$.payload.issuers[].keys[].valid_from`, `$.payload.issuers[].keys[].valid_until`, and `$.payload.issuers[].keys[].revocation_ref`. Validity timestamps use the same UTC rules as payload timestamps. When both validity endpoints exist, `valid_until` MUST be later than `valid_from`. A revocation reference is opaque in v0.1; the base verifier does not retrieve or interpret it.

## 8. Outcome Events

An entry at `$.payload.events[]` is one immutable claim or observation. Every event MUST contain exactly the fields defined below.

### 8.1 Identity and lifecycle dimensions

- `$.payload.events[].event_id` MUST identify the event and be unique among addressable payload objects.
- `$.payload.events[].phase` MUST be one of `INTENT`, `AUTHORIZATION`, `DISPATCH`, `ACCEPTANCE`, `EFFECT`, `SETTLEMENT`, or `TERMINATION`.
- `$.payload.events[].event_type` MUST be a lower-case namespaced token matching the schema pattern. It describes an observation, not a verdict.
- `$.payload.events[].status` MUST be one of `PENDING`, `SUCCEEDED`, `FAILED`, `PARTIAL`, `CANCELLED`, `REVERSED`, or `EXPIRED`. It describes this event only.

Phase, event type, and status MUST NOT be collapsed into one field.

### 8.2 Time

`$.payload.events[].occurred_at` records when the issuer claims the event occurred. `$.payload.events[].recorded_at` records when the issuer recorded it. Both MUST be valid UTC timestamps. `recorded_at` MUST NOT precede `occurred_at` in v0.1.

### 8.3 Provenance

`$.payload.events[].source_class` MUST be one of `SELF_CLAIMED`, `GATEWAY_OBSERVED`, `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD`, or `INDEPENDENTLY_SETTLED`.

Source classes describe origin, not a universal ranking. `$.payload.events[].issuer_ref` MUST resolve to `$.payload.issuers[].issuer_id`.

### 8.4 Actor and subject

`$.payload.events[].actor` and `$.payload.events[].subject` are Entity References. Each MUST contain `entity_type` and `entity_id` and MAY contain `display_name`.

The complete field paths are `$.payload.events[].actor.entity_type`, `$.payload.events[].actor.entity_id`, `$.payload.events[].actor.display_name`, `$.payload.events[].subject.entity_type`, `$.payload.events[].subject.entity_id`, and `$.payload.events[].subject.display_name`.

Entity References are contextual identifiers, not universal identities.

### 8.5 Claim

`$.payload.events[].claim` MUST be a JSON object containing domain-defined claim data. Its descendants are governed by a domain profile. Sensitive raw prompts, secrets, or predictable personal values SHOULD NOT be embedded without an explicit privacy profile.

### 8.6 Evidence references

`$.payload.events[].evidence_refs` MUST be an array of unique Evidence Item IDs. Every entry MUST resolve to `$.payload.evidence[].evidence_id`.

### 8.7 Causal graph

`$.payload.events[].parent_event_digests` MUST be an array of unique Event object digests. An event MUST NOT reference its own digest. In the base v0.1 verifier every parent MUST resolve in the current bundle. External predecessor-graph resolution requires a future profile.

The causal model is a directed graph. Zero, one, or multiple parents are permitted.

### 8.8 Extensions and digest

`$.payload.events[].extensions` MUST be a JSON object. `$.payload.events[].object_digest` MUST be a SHA-256 digest of the complete event after omitting only the `object_digest` member. Its members are `$.payload.events[].object_digest.algorithm` and `$.payload.events[].object_digest.value`.

## 9. Evidence Items

An entry at `$.payload.evidence[]` describes evidence content without requiring that sensitive raw content be embedded.

- `$.payload.evidence[].evidence_id` MUST identify the item and be unique among addressable payload objects.
- `$.payload.evidence[].evidence_type` MUST be an upper-case namespaced token.
- `$.payload.evidence[].media_type` MUST be a syntactically valid media type.
- `$.payload.evidence[].source_class` uses the same source-class vocabulary as events.
- `$.payload.evidence[].issuer_ref` MUST resolve to an issuer.
- `$.payload.evidence[].claim_scope` MUST be a non-empty array of unique event-type tokens describing claims the evidence may support.
- `$.payload.evidence[].content_digest` MUST digest the evidence content according to its content profile. Its members are `$.payload.evidence[].content_digest.algorithm` and `$.payload.evidence[].content_digest.value`.
- `$.payload.evidence[].disclosure` MUST be `PUBLIC`, `RESTRICTED`, `PRIVATE`, or `COMMITMENT_ONLY`.
- `$.payload.evidence[].extensions` MUST be an object.
- `$.payload.evidence[].object_digest` MUST digest the Evidence Item metadata after omitting only `object_digest`; its members are `$.payload.evidence[].object_digest.algorithm` and `$.payload.evidence[].object_digest.value`.

### 9.1 Locator

`$.payload.evidence[].locator` MUST contain exactly:

- `$.payload.evidence[].locator.scheme`: `opaque`, `embedded`, or `https`;
- `$.payload.evidence[].locator.value`: non-empty value interpreted by the scheme;
- `$.payload.evidence[].locator.retrieval_policy`: `PUBLIC`, `AUTHORIZED_ONLY`, `LOCAL_ONLY`, or `UNAVAILABLE`.

An `https` locator value MUST be an absolute HTTPS URL. An `embedded` locator MUST NOT declare `UNAVAILABLE`. Opaque locators are RECOMMENDED for private infrastructure. Bucket names, database keys, local file paths, and private network topology SHOULD NOT be exposed.

A content digest proves correspondence to retrieved bytes; it does not make those bytes retrievable.

## 10. Relationships

An entry at `$.payload.relationships[]` connects addressable objects without changing them. It MUST contain:

- `$.payload.relationships[].relationship_id`, unique among addressable payload objects;
- `$.payload.relationships[].relationship_type`, one of `SUPPORTS`, `CONTRADICTS`, `SUPERSEDES`, `REVERSES`, or `CORRESPONDS_TO`;
- `$.payload.relationships[].from_ref` and `$.payload.relationships[].to_ref`, typed references using `event:`, `evidence:`, or `issuer:`;
- `$.payload.relationships[].extensions`;
- `$.payload.relationships[].object_digest`, with members `$.payload.relationships[].object_digest.algorithm` and `$.payload.relationships[].object_digest.value`.

Both endpoints MUST resolve in the current bundle. A relationship MUST NOT point from and to the same typed reference.

A relationship object digest is calculated after omitting only its `object_digest` member.

## 11. Extensions

`$.payload.extensions`, `$.payload.issuers[].extensions`, `$.payload.events[].extensions`, `$.payload.evidence[].extensions`, and `$.payload.relationships[].extensions` are open JSON objects.

Extension keys SHOULD use collision-resistant namespaces such as `org.timeproofs.mcp` or `com.example.refund`. A reader that reserializes a bundle SHOULD preserve unknown extension content unchanged. A verifier MAY ignore an unknown extension unless a declared profile or ruleset requires it.

Unknown fields outside `claim` and an approved `extensions` object are invalid.

## 12. Canonicalization

`TP-JSON-0.1` canonicalization produces a deterministic UTF-8 byte sequence:

```text
Canonicalize(value) = UTF8(JCS-compatible deterministic JSON serialization)
```

The profile requires:

- strict JSON parsing before canonicalization;
- rejection of duplicate property names;
- rejection of unpaired Unicode surrogate values;
- object property ordering by UTF-16 code units;
- preservation of array order;
- removal of insignificant whitespace;
- ECMAScript JSON serialization of finite numbers;
- preservation of Unicode without NFC, NFD, NFKC, NFKD, case folding, or trimming;
- rejection of undefined, functions, symbols, and non-finite values.

A present `null` member is cryptographically different from an omitted member. Implementations MUST NOT insert defaults, delete nulls, normalize strings, or reconstruct a semantically similar object before verification.

Monetary values MUST be decimal strings paired with explicit currency codes. Large integers outside interoperable IEEE-754 handling MUST be strings.

Normative fixed vectors are stored in `test-vectors/canonicalization/vectors.json` and cover Unicode, number serialization, arrays, nested objects, null, and omitted members.

## 13. Digests

All v0.1 digest objects MUST contain exactly `algorithm` and `value`. `algorithm` MUST be `sha-256`. `value` MUST be exactly 64 lower-case hexadecimal characters without prefix, whitespace, or omitted leading zeroes.

### 13.1 Payload digest

```text
payload_digest = SHA-256(Canonicalize(bundle.payload))
```

The top-level proofs array is excluded.

### 13.2 Object digest

For an Event, Evidence Item, or Relationship:

```text
object_without_digest = object with only object_digest omitted
object_digest = SHA-256(Canonicalize(object_without_digest))
```

No other member is excluded.

## 14. Proofs and signature input

An entry at `$.proofs[]` MUST contain exactly:

- `$.proofs[].proof_id`, unique in the proof array;
- `$.proofs[].proof_type`, equal to `SIGNATURE`;
- `$.proofs[].target`;
- `$.proofs[].issuer_ref`, resolving to an issuer;
- `$.proofs[].verification_method`, exactly identifying `issuer_id#key_id`;
- `$.proofs[].created_at`, a valid UTC timestamp;
- `$.proofs[].algorithm`, equal to `Ed25519`;
- `$.proofs[].proof_value`, canonical unpadded base64url Ed25519 signature bytes.

### 14.1 Proof Target

`$.proofs[].target.target_type` MUST be `BUNDLE_PAYLOAD`, `OUTCOME_EVENT`, `EVIDENCE_ITEM`, or `RELATIONSHIP`.

`$.proofs[].target.target_id` is REQUIRED for all non-payload targets and MUST NOT appear for `BUNDLE_PAYLOAD`.

`$.proofs[].target.digest` contains `$.proofs[].target.digest.algorithm` and `$.proofs[].target.digest.value` and MUST equal the verifier-resolved digest of the target.

A proof MUST NOT cover itself.

### 14.2 Domain-separated signing input

The Ed25519 signature input is the canonical UTF-8 encoding of:

```json
{
  "domain": "org.timeproofs.signature.v0.1",
  "profile": "TP-JSON-0.1",
  "spec_version": "0.1",
  "target_digest": {
    "algorithm": "sha-256",
    "value": "..."
  },
  "target_type": "OUTCOME_EVENT"
}
```

The signature therefore binds the TimeProofs domain, specification version, profile, target class, digest algorithm, and digest value. The target ID is resolved indirectly through the declared digest and target type; a verifier MUST also resolve and compare the declared target ID for non-payload targets.

If key validity fields are present, proof creation time MUST fall inside the declared interval. Revocation status remains external to the base profile.

## 15. Confidentiality and disclosure

A bundle can reveal sensitive metadata even when content is external. Producers SHOULD minimize personal data, use opaque locators, avoid raw prompts and secrets, and use randomized commitments or HMAC where values are predictable.

A plain SHA-256 digest of a low-entropy secret is not confidentiality protection. Encryption, access policy, retention, lawful basis, disclosure authorization, and deletion procedures are outside the public-bundle base profile and MUST be addressed by the implementation using it.

## 16. Structural verification outcomes

The structural verifier returns:

- `VALID`: parsing, exact field sets, values, digests, internal references, graph rules, and every supplied proof are valid, and events, evidence, and proofs are present;
- `INCOMPLETE`: no hard failure exists, but one or more of events, evidence, or proofs is absent;
- `INVALID`: a parsing, field, value, digest, reference, graph, or cryptographic rule failed.

`VALID` does not imply a `VERIFIED` business outcome. `INCOMPLETE` is not a business verdict. Stable machine-readable codes are defined in `spec/error-codes-v0.1.json` and rendered in `spec/ERROR_CODES_V0_1.md`.

## 17. Structural verification order

A conforming verifier MUST process the stages in `spec/STRUCTURAL_VERIFICATION_V0_1.md` in the documented order. It MAY report multiple errors after a stage can be processed safely. It MUST NOT silently repair input before digest or signature verification.

## 18. Security limitations

A valid signature proves that the corresponding private key signed the declared TimeProofs signing input. It does not prove that:

- every relevant event was recorded;
- the claim was factually accurate;
- the issuer was legally authorized;
- the issuer is independent;
- the outcome remains current;
- no later reversal exists;
- the evidence is sufficient under a particular ruleset.

Trust registries, key status, evidence retrieval, non-omission mechanisms, external timestamps, and domain rules are separate layers.

## 19. Interoperability criterion

Evidence Bundle v0.1 succeeds when two independent implementations can:

1. reject the same malformed JSON classes;
2. produce identical canonical bytes;
3. produce identical SHA-256 digests;
4. verify the same Ed25519 proofs;
5. resolve the same causal and evidence references;
6. return compatible stable structural codes;
7. exchange valid bundles without private integration agreements.

## Appendix A — Normative field registry

The machine-readable authority is `spec/field-semantics-v0.1.json`. The table below makes every schema-accepted field explicit.

| Field path | Required | Section | Normative semantics |
|---|---|---|---|
| `$` | `yes` | 5 | Evidence Bundle envelope containing exactly payload and proofs. |
| `$.payload` | `yes` | 6 | Immutable evidence-bearing payload. Its canonical form is the payload digest target. |
| `$.proofs` | `yes` | 14 | Array of cryptographic proofs excluded from the payload digest. |
| `$.payload.spec_version` | `yes` | 6.1 | Exact protocol specification version string. |
| `$.payload.profile` | `yes` | 6.2 | Exact serialization and cryptographic profile identifier. |
| `$.payload.bundle_id` | `yes` | 6.3 | Opaque identifier of one immutable bundle revision. |
| `$.payload.action_id` | `yes` | 6.4 | Opaque identifier of the logical action across revisions. |
| `$.payload.created_at` | `yes` | 6.5 | UTC time at which this payload revision was created. |
| `$.payload.issuers` | `yes` | 7 | Issuer and verification-key descriptions referenced by the bundle. |
| `$.payload.events` | `yes` | 8 | Outcome Events in non-authoritative array order. |
| `$.payload.evidence` | `yes` | 9 | Evidence Items referenced by events or relationships. |
| `$.payload.relationships` | `yes` | 10 | Typed relationships between resolvable bundle objects. |
| `$.payload.predecessor_bundle_digests` | `yes` | 6.6 | Direct predecessor payload digests for immutable revision history. |
| `$.payload.extensions` | `yes` | 11 | Namespaced protocol-specific payload extensions. |
| `$.payload.issuers[]` | `yes` | 7 | One issuer description. |
| `$.payload.issuers[].issuer_id` | `yes` | 7 | Bundle-local issuer identifier used by issuer_ref and verification_method. |
| `$.payload.issuers[].display_name` | `yes` | 7 | Human-readable issuer label with no trust semantics. |
| `$.payload.issuers[].issuer_type` | `yes` | 7 | Coarse issuer category. |
| `$.payload.issuers[].identifiers` | `yes` | 7 | Externally meaningful issuer identifiers. |
| `$.payload.issuers[].identifiers[]` | `no` | 7 | One scheme/value identifier. |
| `$.payload.issuers[].identifiers[].scheme` | `yes` | 7 | Identifier scheme name. |
| `$.payload.issuers[].identifiers[].value` | `yes` | 7 | Identifier value interpreted by its scheme. |
| `$.payload.issuers[].keys` | `yes` | 7 | Verification keys declared by the issuer. |
| `$.payload.issuers[].keys[]` | `no` | 7 | One public verification key. |
| `$.payload.issuers[].keys[].key_id` | `yes` | 7 | Identifier unique within the issuer. |
| `$.payload.issuers[].keys[].algorithm` | `yes` | 7 | Key algorithm; Ed25519 in v0.1. |
| `$.payload.issuers[].keys[].format` | `yes` | 7 | Public-key encoding; spki-pem in v0.1. |
| `$.payload.issuers[].keys[].public_key` | `yes` | 7 | SPKI PEM public key material. |
| `$.payload.issuers[].keys[].valid_from` | `no` | 7 | Optional inclusive start of declared key validity. |
| `$.payload.issuers[].keys[].valid_until` | `no` | 7 | Optional inclusive end of declared key validity. |
| `$.payload.issuers[].keys[].revocation_ref` | `no` | 7 | Opaque reference to external key-status information. |
| `$.payload.issuers[].extensions` | `yes` | 7 | Namespaced issuer extensions. |
| `$.payload.events[].actor` | `yes` | 8.4 | Entity Reference identifying the event actor. |
| `$.payload.events[].actor.entity_type` | `yes` | 8.4 | Application-defined entity category. |
| `$.payload.events[].actor.entity_id` | `yes` | 8.4 | Opaque entity identifier in the producer context. |
| `$.payload.events[].actor.display_name` | `no` | 8.4 | Optional human-readable label with no identity authority. |
| `$.payload.events[].subject` | `yes` | 8.4 | Entity Reference identifying the event subject. |
| `$.payload.events[].subject.entity_type` | `yes` | 8.4 | Application-defined entity category. |
| `$.payload.events[].subject.entity_id` | `yes` | 8.4 | Opaque entity identifier in the producer context. |
| `$.payload.events[].subject.display_name` | `no` | 8.4 | Optional human-readable label with no identity authority. |
| `$.payload.events[]` | `no` | 8 | One immutable Outcome Event. |
| `$.payload.events[].event_id` | `yes` | 8 | Identifier unique among addressable payload objects. |
| `$.payload.events[].phase` | `yes` | 8 | Universal lifecycle phase. |
| `$.payload.events[].event_type` | `yes` | 8 | Lower-case domain-specific observation type. |
| `$.payload.events[].status` | `yes` | 8 | Status of this event, not the whole action. |
| `$.payload.events[].occurred_at` | `yes` | 8 | Claimed time the observed event occurred. |
| `$.payload.events[].recorded_at` | `yes` | 8 | Time the issuer recorded the event. |
| `$.payload.events[].source_class` | `yes` | 8 | Origin class of the event claim. |
| `$.payload.events[].issuer_ref` | `yes` | 8 | Reference to a payload issuer. |
| `$.payload.events[].claim` | `yes` | 8 | Domain-defined JSON claim object. |
| `$.payload.events[].evidence_refs` | `yes` | 8 | Unique Evidence Item IDs supporting this event. |
| `$.payload.events[].parent_event_digests` | `yes` | 8 | Unique causal parent object digests. |
| `$.payload.events[].extensions` | `yes` | 8 | Namespaced event extensions. |
| `$.payload.events[].object_digest` | `yes` | 8 | Digest of the event with object_digest omitted. |
| `$.payload.events[].object_digest.algorithm` | `yes` | 8 | sha-256. |
| `$.payload.events[].object_digest.value` | `yes` | 8 | 64 lower-case hexadecimal digest value. |
| `$.payload.evidence[]` | `no` | 9 | One immutable Evidence Item metadata object. |
| `$.payload.evidence[].evidence_id` | `yes` | 9 | Identifier unique among addressable payload objects. |
| `$.payload.evidence[].evidence_type` | `yes` | 9 | Upper-case namespaced evidence artifact type. |
| `$.payload.evidence[].media_type` | `yes` | 9 | Media type of the referenced content. |
| `$.payload.evidence[].source_class` | `yes` | 9 | Origin class of the evidence content. |
| `$.payload.evidence[].issuer_ref` | `yes` | 9 | Reference to the issuer describing or supplying the evidence. |
| `$.payload.evidence[].claim_scope` | `yes` | 9 | Non-empty unique event types the evidence may support. |
| `$.payload.evidence[].content_digest` | `yes` | 9 | Digest of the external or embedded evidence bytes under its content profile. |
| `$.payload.evidence[].content_digest.algorithm` | `yes` | 9 | sha-256. |
| `$.payload.evidence[].content_digest.value` | `yes` | 9 | 64 lower-case hexadecimal digest value. |
| `$.payload.evidence[].locator` | `yes` | 9 | Retrieval metadata that is not part of the evidence content. |
| `$.payload.evidence[].locator.scheme` | `yes` | 9 | Locator scheme: opaque, embedded, or https. |
| `$.payload.evidence[].locator.value` | `yes` | 9 | Locator value interpreted by the scheme. |
| `$.payload.evidence[].locator.retrieval_policy` | `yes` | 9 | Access expectation for retrieving the evidence. |
| `$.payload.evidence[].disclosure` | `yes` | 9 | Disclosure classification. |
| `$.payload.evidence[].extensions` | `yes` | 9 | Namespaced Evidence Item extensions. |
| `$.payload.evidence[].object_digest` | `yes` | 9 | Digest of Evidence Item metadata with object_digest omitted. |
| `$.payload.evidence[].object_digest.algorithm` | `yes` | 9 | sha-256. |
| `$.payload.evidence[].object_digest.value` | `yes` | 9 | 64 lower-case hexadecimal digest value. |
| `$.payload.relationships[]` | `no` | 10 | One typed relationship. |
| `$.payload.relationships[].relationship_id` | `yes` | 10 | Identifier unique among addressable payload objects. |
| `$.payload.relationships[].relationship_type` | `yes` | 10 | Base relationship semantic. |
| `$.payload.relationships[].from_ref` | `yes` | 10 | Typed source reference. |
| `$.payload.relationships[].to_ref` | `yes` | 10 | Typed destination reference. |
| `$.payload.relationships[].extensions` | `yes` | 10 | Namespaced relationship extensions. |
| `$.payload.relationships[].object_digest` | `yes` | 10 | Digest of relationship with object_digest omitted. |
| `$.payload.relationships[].object_digest.algorithm` | `yes` | 10 | sha-256. |
| `$.payload.relationships[].object_digest.value` | `yes` | 10 | 64 lower-case hexadecimal digest value. |
| `$.payload.predecessor_bundle_digests[]` | `no` | 6.6 | One direct predecessor payload SHA-256 digest. |
| `$.payload.predecessor_bundle_digests[].algorithm` | `yes` | 6.6 | sha-256. |
| `$.payload.predecessor_bundle_digests[].value` | `yes` | 6.6 | 64 lower-case hexadecimal digest value. |
| `$.proofs[]` | `no` | 14 | One cryptographic Proof. |
| `$.proofs[].proof_id` | `yes` | 14 | Identifier unique in the proofs array. |
| `$.proofs[].proof_type` | `yes` | 14 | Proof kind; SIGNATURE in v0.1. |
| `$.proofs[].target` | `yes` | 14 | Precisely identifies the signed digest target. |
| `$.proofs[].target.target_type` | `yes` | 14 | Target class. |
| `$.proofs[].target.target_id` | `conditional` | 14 | Required except for BUNDLE_PAYLOAD, where it is forbidden. |
| `$.proofs[].target.digest` | `yes` | 14 | Digest declared by the signer for the target. |
| `$.proofs[].target.digest.algorithm` | `yes` | 14 | sha-256. |
| `$.proofs[].target.digest.value` | `yes` | 14 | 64 lower-case hexadecimal digest value. |
| `$.proofs[].issuer_ref` | `yes` | 14 | Reference to the proof issuer. |
| `$.proofs[].verification_method` | `yes` | 14 | Exact issuer_id#key_id verification method. |
| `$.proofs[].created_at` | `yes` | 14 | UTC time at which the proof was created. |
| `$.proofs[].algorithm` | `yes` | 14 | Signature algorithm; Ed25519 in v0.1. |
| `$.proofs[].proof_value` | `yes` | 14 | Canonical unpadded base64url Ed25519 signature bytes. |
| `$.payload.events[].evidence_refs[]` | `no` | 8.6 | One Evidence Item identifier referenced by the event. |
| `$.payload.events[].parent_event_digests[]` | `no` | 8.7 | One causal parent Event object digest. |
| `$.payload.events[].parent_event_digests[].algorithm` | `yes` | 8.7 | sha-256. |
| `$.payload.events[].parent_event_digests[].value` | `yes` | 8.7 | 64 lower-case hexadecimal digest value. |
| `$.payload.evidence[].claim_scope[]` | `yes` | 9 | One lower-case namespaced event type covered by the evidence. |
