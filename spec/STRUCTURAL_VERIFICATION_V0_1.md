# TimeProofs Structural Verification v0.1

Status: EXPERIMENTAL NORMATIVE DRAFT
Profile: `TP-JSON-0.1`

## 1. Purpose

Structural verification determines whether an Evidence Bundle is syntactically, structurally, referentially, digest-wise, and cryptographically valid under `TP-JSON-0.1`.

It does not determine whether a business outcome is proven. That operation belongs to a separately versioned Verdict Engine ruleset.

## 2. Inputs

A verifier SHOULD receive the original UTF-8 JSON bytes so duplicate property names and malformed Unicode escapes remain detectable.

When a verifier receives an already parsed object, it MAY verify the data model but MUST disclose that duplicate-key detection was not possible for that invocation.

A verifier MUST NOT repair, normalize, reorder, default, trim, or otherwise mutate evidence-bearing values before digest or signature verification.

## 3. Ordered verification algorithm

A conforming verifier performs the following stages in order.

### Stage 1 — Strict JSON

1. Decode UTF-8.
2. Parse exactly one JSON value.
3. Reject duplicate property names.
4. Reject unpaired surrogate values, invalid escapes, unescaped controls, malformed numbers, non-finite numbers, and trailing data.

Failure returns `INVALID` with a parsing code from `spec/error-codes-v0.1.json`.

### Stage 2 — Envelope

5. Require a JSON object root.
6. Require exactly `payload` and `proofs`.
7. Require `payload` to be an object and `proofs` to be an array.

### Stage 3 — Payload shape

8. Require the exact payload member set.
9. Require `spec_version = "0.1"` and `profile = "TP-JSON-0.1"`.
10. Validate opaque identifiers and the UTC creation timestamp.
11. Require each payload collection to have the defined JSON type.
12. Validate predecessor digests and reject duplicates.

### Stage 4 — Issuers and keys

13. Validate the exact Issuer member set.
14. Validate issuer identifiers and reject duplicate scheme/value pairs.
15. Validate key member sets, Ed25519 algorithm, SPKI PEM format, key IDs, validity timestamps, and validity interval ordering.
16. Reject duplicate issuer IDs and duplicate key IDs within an issuer.
17. Do not infer trust from an embedded issuer or key description.

### Stage 5 — Events, evidence, and relationships

18. Validate exact member sets for every Outcome Event, Entity Reference, Evidence Item, Locator, and Relationship.
19. Validate lifecycle phases, statuses, source classes, event type syntax, evidence type syntax, media types, disclosure classes, locator policies, and relationship types.
20. Validate timestamps and require `recorded_at >= occurred_at`.
21. Validate unique identifiers and array uniqueness constraints.
22. Recalculate each Event, Evidence Item, and Relationship object digest after omitting only `object_digest`.
23. Reject every digest mismatch.

### Stage 6 — References and graph

24. Resolve every `issuer_ref`.
25. Resolve every Event `evidence_refs` entry.
26. Resolve every causal parent digest in the current bundle.
27. Reject self-parenting and repeated parent digests.
28. Resolve typed Relationship endpoints.
29. Reject a Relationship whose endpoints are identical.

The base v0.1 profile does not resolve Event parents through predecessor bundles. A future profile may add that capability.

### Stage 7 — Payload digest

30. Canonicalize `bundle.payload` according to the Evidence Bundle specification.
31. Calculate SHA-256 over the canonical UTF-8 bytes.
32. Exclude the top-level `proofs` array.

### Stage 8 — Proof shape and target resolution

33. Validate the exact Proof member set.
34. Validate proof IDs, proof type, target type, target-ID conditionality, target digest, issuer, verification method, timestamp, algorithm, and canonical unpadded base64url proof value.
35. Resolve the target object.
36. Recalculate the target digest and compare it to the declared proof target digest.
37. Resolve `issuer_id#key_id` and require it to agree with `issuer_ref`.
38. Apply declared key validity timestamps when present.

### Stage 9 — Signature verification

39. Reconstruct the domain-separated signing input binding protocol domain, specification version, profile, target type, digest algorithm, and digest value.
40. Parse the public key and require Ed25519.
41. Verify the Ed25519 signature.
42. Record valid proofs only after all preceding checks succeed.

### Stage 10 — Structural result

43. Return `INVALID` when one or more hard errors exist.
44. Otherwise return `INCOMPLETE` when events, evidence, or proofs is empty and include the corresponding completeness warnings.
45. Otherwise return `VALID`.

A verifier MAY continue after a safe-to-report failure to return multiple diagnostic errors. It MUST NOT use a failed object as trusted input to a later cryptographic decision.

## 4. Result object

The reference verifier returns:

```json
{
  "status": "VALID",
  "errors": [],
  "warnings": [],
  "payload_digest": {
    "algorithm": "sha-256",
    "value": "..."
  },
  "valid_proofs": [],
  "summary": {
    "issuers": 0,
    "events": 0,
    "evidence": 0,
    "relationships": 0,
    "proofs": 0
  }
}
```

The exact human-readable message text is non-normative. Machine-readable codes and their structural class are normative within v0.1.

## 5. Stable codes

The authority is `spec/error-codes-v0.1.json`. The generated human view is `spec/ERROR_CODES_V0_1.md`.

Every invalid fixture MUST identify its expected primary code in `test-vectors/invalid/manifest.json`. A fixture MAY produce additional codes when one mutation has multiple structural consequences, but the declared primary code MUST be present.

An implementation MUST NOT repurpose an existing v0.1 code for a different meaning. New codes MAY be added during the experimental draft period only with specification, registry, tests, and fixture reconciliation.

## 6. Determinism requirements

Given identical input bytes and the same supported profile, two conforming verifiers MUST agree on:

- parsing acceptance or rejection;
- canonical bytes;
- object and payload digests;
- proof target resolution;
- signature validity;
- final structural status;
- the presence of each normative error class triggered by the input.

Diagnostic ordering SHOULD follow the algorithm stages above.

## 7. Security boundary

`VALID` means that the bundle is internally coherent under the supplied keys. It does not establish issuer trust, non-omission, legal authority, factual truth, continued validity of the outcome, or sufficiency for a domain verdict.
