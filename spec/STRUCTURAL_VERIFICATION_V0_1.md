# Structural Verification v0.1

Status: EXPERIMENTAL

## 1. Inputs

A verifier receives raw JSON bytes or a data model produced by a strict parser.

Raw JSON verification is preferred because duplicate property names cannot be detected after ordinary parsing.

## 2. Algorithm

A conforming verifier performs these stages in order:

1. Decode UTF-8 and parse strict JSON.
2. Reject duplicate property names.
3. Reject invalid Unicode scalar values.
4. Require exactly `payload` and `proofs` at the top level.
5. Validate required payload fields and profile values.
6. Validate issuer and key descriptions.
7. Validate Outcome Event fields.
8. Validate Evidence Item fields.
9. Validate relationships and references.
10. Recalculate all object digests.
11. Resolve every causal parent digest.
12. Resolve every evidence and relationship reference.
13. Recalculate the payload digest.
14. Resolve each proof target.
15. Verify target digest equality.
16. Reconstruct the domain-separated signing input.
17. Verify each supported Ed25519 signature.
18. Return `INVALID` on any hard failure.
19. Otherwise return `INCOMPLETE` when no events, evidence, or proofs are present.
20. Otherwise return `VALID`.

## 3. Stable error classes

The reference implementation emits machine-readable codes including:

- `DUPLICATE_PROPERTY`
- `TOP_LEVEL_MEMBERS_INVALID`
- `PAYLOAD_MEMBERS_INVALID`
- `OBJECT_DIGEST_MISMATCH`
- `PARENT_EVENT_NOT_FOUND`
- `EVENT_EVIDENCE_NOT_FOUND`
- `RELATIONSHIP_FROM_NOT_FOUND`
- `PROOF_TARGET_NOT_FOUND`
- `PROOF_TARGET_DIGEST_MISMATCH`
- `VERIFICATION_KEY_NOT_FOUND`
- `SIGNATURE_INVALID`

Exact wording is non-normative. Error class meaning is normative for v0.1 interoperability tests.
