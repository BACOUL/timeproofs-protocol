# TimeProofs Evidence Bundle Specification v0.1

Status: EXPERIMENTAL DRAFT  
Profile: `TP-JSON-0.1`  
Date: 2026-07-23

## 1. Purpose

A TimeProofs Evidence Bundle is a portable cryptographic container for evidence associated with the lifecycle of an action performed or attempted by an AI agent.

A bundle records claims, observations, causal relationships, evidence references, issuers, and cryptographic proofs. A bundle does not, by itself, guarantee that every recorded claim is factually true.

## 2. Conformance language

The terms **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative requirements.

A producer conforms when it emits bundles satisfying this specification.

A verifier conforms when it rejects malformed or cryptographically invalid bundles and returns stable structural outcomes.

## 3. Non-goals

This specification does not define:

- agent identity;
- user authorization;
- payment processing;
- legal liability;
- a universal trust registry;
- a business outcome verdict;
- production evidence retention;
- a runtime allow/deny firewall.

## 4. Architectural separation

TimeProofs separates three layers:

```text
Evidence Bundle
→ Verification Rules
→ Verdict Engine
```

The bundle contains immutable evidence-bearing data.

Verification rules are versioned separately.

A verdict is recalculated and MUST NOT be stored as an immutable fact in the bundle.

## 5. Top-level envelope

A `TP-JSON-0.1` bundle MUST contain exactly two top-level members:

```json
{
  "payload": {},
  "proofs": []
}
```

`payload` contains evidence-bearing data.

`proofs` contains cryptographic proofs over the payload or an individually addressable object.

`proofs` MUST NOT be included in the payload digest.

## 6. Payload

The payload MUST contain exactly:

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

### 6.1 `bundle_id`

Identifies one immutable bundle revision.

It MUST be opaque and non-empty.

Consumers MUST NOT infer authority, time, or semantics from its internal format.

### 6.2 `action_id`

Identifies the logical action across bundle revisions.

Revisions of the same logical action MUST preserve the same `action_id`.

A genuinely new attempt SHOULD receive a new `action_id`.

### 6.3 `created_at`

MUST be a UTC timestamp ending in `Z`.

Local offsets are not permitted in `TP-JSON-0.1`.

### 6.4 `predecessor_bundle_digests`

A first revision MUST use an empty array.

A later revision MUST reference the SHA-256 payload digest of each direct predecessor.

Multiple predecessors MAY be used to merge independently produced branches.

## 7. Issuers and keys

An issuer describes an entity that creates an event, supplies evidence, or issues a proof.

Example:

```json
{
  "issuer_id": "merchant.example",
  "display_name": "Merchant Refund System",
  "issuer_type": "SYSTEM",
  "identifiers": [
    { "scheme": "dns", "value": "merchant.example" }
  ],
  "keys": [
    {
      "key_id": "refund-2026-01",
      "algorithm": "Ed25519",
      "format": "spki-pem",
      "public_key": "-----BEGIN PUBLIC KEY-----..."
    }
  ],
  "extensions": {}
}
```

A raw bundle may describe a key, but trust in that key is established by a separate trust process.

A verifier MUST NOT treat an issuer as authoritative solely because the issuer declares itself authoritative.

## 8. Outcome Events

An Outcome Event is one immutable claim or observation in an action lifecycle.

Every event MUST distinguish:

- universal lifecycle phase;
- domain-specific event type;
- event status;
- source class;
- issuer;
- actor;
- subject;
- claim content;
- causal parents;
- evidence references;
- object digest.

Example:

```json
{
  "event_id": "tpe_refund_created",
  "phase": "EFFECT",
  "event_type": "commerce.refund.created",
  "status": "SUCCEEDED",
  "occurred_at": "2026-07-23T14:31:54Z",
  "recorded_at": "2026-07-23T14:32:08Z",
  "source_class": "SYSTEM_OF_RECORD",
  "issuer_ref": "merchant.example",
  "actor": {
    "entity_type": "SERVICE",
    "entity_id": "merchant-refund-api"
  },
  "subject": {
    "entity_type": "REFUND",
    "entity_id": "refund-demo-001"
  },
  "claim": {
    "amount": "79.00",
    "currency": "EUR",
    "merchant_reference": "REF-001"
  },
  "evidence_refs": ["tpev_refund_created_response"],
  "parent_event_digests": [],
  "extensions": {},
  "object_digest": {
    "algorithm": "sha-256",
    "value": "..."
  }
}
```

### 8.1 Causal graph

Events form a directed graph, not an authoritative linear log.

`parent_event_digests` MAY contain zero, one, or multiple event object digests.

An event MUST NOT reference its own digest.

Every parent digest MUST resolve to another event in the bundle revision or through a predecessor bundle profile that explicitly supports external graph resolution.

The initial reference verifier requires parents to resolve within the current bundle.

### 8.2 Source classes

Allowed source classes are:

- `SELF_CLAIMED`
- `GATEWAY_OBSERVED`
- `RECEIVER_ATTESTED`
- `SYSTEM_OF_RECORD`
- `INDEPENDENTLY_SETTLED`

These classes describe origin, not a universal strength ranking.

The ruleset evaluating a claim determines which classes are sufficient.

## 9. Evidence Items

An Evidence Item references content supporting one or more claims.

Example:

```json
{
  "evidence_id": "tpev_refund_created_response",
  "evidence_type": "API_RESPONSE",
  "media_type": "application/json",
  "source_class": "SYSTEM_OF_RECORD",
  "issuer_ref": "merchant.example",
  "claim_scope": ["commerce.refund.created"],
  "content_digest": {
    "algorithm": "sha-256",
    "value": "..."
  },
  "locator": {
    "scheme": "opaque",
    "value": "evref_demo_refund_created",
    "retrieval_policy": "AUTHORIZED_ONLY"
  },
  "disclosure": "RESTRICTED",
  "extensions": {},
  "object_digest": {
    "algorithm": "sha-256",
    "value": "..."
  }
}
```

An external locator SHOULD be opaque.

A bundle SHOULD NOT expose storage bucket names, database keys, internal file paths, or private network topology.

The `content_digest` covers the external or embedded evidence content.

The `object_digest` covers the Evidence Item metadata after omitting `object_digest` itself.

## 10. Relationships

Relationships connect events, evidence, and issuers without overloading individual objects.

Allowed base types are:

- `SUPPORTS`
- `CONTRADICTS`
- `SUPERSEDES`
- `REVERSES`
- `CORRESPONDS_TO`

Example:

```json
{
  "relationship_id": "tpr_support_001",
  "relationship_type": "SUPPORTS",
  "from_ref": "evidence:tpev_refund_created_response",
  "to_ref": "event:tpe_refund_created",
  "extensions": {},
  "object_digest": {
    "algorithm": "sha-256",
    "value": "..."
  }
}
```

## 11. Extensions

Unknown data MUST appear only under an `extensions` object.

Namespace keys SHOULD be collision-resistant, for example:

```json
{
  "extensions": {
    "org.timeproofs.mcp": {},
    "com.example.refund": {}
  }
}
```

Readers that reserialize a bundle SHOULD preserve unknown extensions unchanged.

A verifier MAY ignore an unknown extension unless a declared profile or ruleset marks it required.

## 12. Canonicalization

`TP-JSON-0.1` uses deterministic JSON canonicalization based on these requirements:

- object property names are sorted by UTF-16 code units;
- array order is preserved;
- insignificant whitespace is removed;
- JSON strings use JSON escaping rules;
- Unicode content is preserved without normalization;
- unpaired surrogate values are rejected;
- duplicate property names are rejected before parsing into the data model;
- non-finite numbers are rejected;
- the ECMAScript JSON number serialization is used for finite numbers.

Implementations MUST NOT use ordinary pretty-printed JSON bytes as signature input.

Monetary amounts MUST be decimal strings with a separate currency code.

Large integers that cannot be represented interoperably as IEEE-754 numbers MUST be strings.

## 13. Digests

The initial profile supports only:

```json
{
  "algorithm": "sha-256",
  "value": "64 lowercase hexadecimal characters"
}
```

Uppercase hexadecimal, a `0x` prefix, omitted leading zeroes, or whitespace are invalid.

### 13.1 Payload digest

```text
payload_digest = SHA-256(Canonicalize(bundle.payload))
```

The top-level `proofs` array is excluded.

### 13.2 Object digest

For an event, evidence item, or relationship:

```text
object_without_digest = object with object_digest omitted
object_digest = SHA-256(Canonicalize(object_without_digest))
```

No other field is excluded.

## 14. Proofs

The initial proof type is an Ed25519 signature.

A proof MUST identify:

- proof ID;
- target type;
- target ID when the target is not the payload;
- target digest;
- issuer;
- verification method;
- creation time;
- algorithm;
- proof value.

Example:

```json
{
  "proof_id": "tpp_refund_created",
  "proof_type": "SIGNATURE",
  "target": {
    "target_type": "OUTCOME_EVENT",
    "target_id": "tpe_refund_created",
    "digest": {
      "algorithm": "sha-256",
      "value": "..."
    }
  },
  "issuer_ref": "merchant.example",
  "verification_method": "merchant.example#refund-2026-01",
  "created_at": "2026-07-23T14:32:09Z",
  "algorithm": "Ed25519",
  "proof_value": "base64url-signature"
}
```

### 14.1 Domain-separated signature input

The proof signs the canonical JSON encoding of:

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

This context prevents signatures from being silently reused for another protocol or target class.

A proof MUST NOT cover itself.

## 15. Confidentiality

A bundle may reveal sensitive metadata even when raw evidence is external.

Producers SHOULD:

- minimize personal data;
- use opaque locators;
- avoid raw prompts and secrets;
- use randomized commitments or HMAC for predictable private values;
- separate public, restricted, private, and commitment-only evidence;
- define retention and disclosure outside the public bundle.

A plain SHA-256 digest of a low-entropy secret is not sufficient confidentiality protection.

## 16. Structural outcomes

The structural verifier returns:

- `VALID` — structure, digests, internal references, and all supplied proofs are valid, and evidence-bearing content is present;
- `INCOMPLETE` — no structural invalidity was found, but required evidence-bearing elements or proofs are absent;
- `INVALID` — parsing, structure, digest, graph, reference, or cryptographic validation failed.

A `VALID` bundle does not imply a `VERIFIED` business outcome.

## 17. Security model limitations

A valid signature proves control of the corresponding private key at signature time. It does not prove:

- the issuer recorded every relevant event;
- the claim was factually accurate;
- the issuer had legal authority;
- the action was prudent or compliant;
- the outcome remains current;
- no later reversal occurred.

Trust registries, key status, external evidence retrieval, and domain rules are separate layers.

## 18. Interoperability criterion

Evidence Bundle v0.1 succeeds when two independent implementations can:

1. parse the same input with identical duplicate-key and Unicode behavior;
2. produce identical canonical bytes;
3. produce identical SHA-256 digests;
4. verify the same Ed25519 proofs;
5. return compatible structural error codes;
6. exchange bundles without private integration agreements.
