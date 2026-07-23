# TP-PROTO-001 Acceptance Evidence

Date: 2026-07-23  
Milestone: `P1-M1 — Evidence Bundle v0.1 normative coherence`  
Status: PASS for repository acceptance; independent implementation and security review remain future gates.

## Scope delivered

- Exact normative semantics for every schema-accepted field.
- Exact nested-member parity between JSON Schemas and the reference verifier.
- Machine-readable field registry and stable structural error-code registry.
- Deterministic canonicalization vectors for Unicode, numbers, arrays, nested objects, null, and omitted members.
- Stable invalid-fixture manifest.
- Domain-separated Ed25519 signing context tests.
- Refund site outputs regenerated from the shipped verifier and verdict engine.

## Acceptance mapping

| Acceptance criterion | Evidence | Result |
|---|---|---|
| Every schema field has normative semantics | `spec/field-semantics-v0.1.json`; Appendix A of the Evidence Bundle specification; protocol alignment validator | PASS |
| No undocumented field appears in a valid fixture | Recursive valid-fixture field audit in `scripts/validate-protocol-alignment.mjs` | PASS |
| Canonicalization coverage | `test-vectors/canonicalization/vectors.json` and tests | PASS |
| Stable invalid-fixture codes | `spec/error-codes-v0.1.json`; `test-vectors/invalid/manifest.json`; 13 deterministic invalid fixtures | PASS |
| Signature context binding | `packages/core/src/signature-input.mjs`; profile/version/type/algorithm/value tests | PASS |
| Refund outputs use shipped engines | deterministic site-data comparison tests | PASS |
| Governance reconciled | state, decision, risk, roadmap, status, and next-action updates in this change | PASS |

## Commands

```bash
node scripts/generate-fixtures.mjs
npm test
```

## Observed result

```text
39 tests passed.
Protocol alignment passed (106 schema paths, 147 stable codes, 13 invalid fixtures).
Project operating system validation passed (44 required files, 18 workstreams).
```

## Boundaries and unresolved gates

This evidence does not claim independent interoperability or production-grade cryptographic assurance. The following remain unresolved:

- second independent implementation;
- independent security review;
- external trust and revocation resolution;
- real system-of-record connector evidence;
- production privacy and retention review.

## Cross-program review

- Competition: no product-positioning change introduced.
- Agentic protocol compatibility: no ACP, UCP, AP2, MCP, or A2A mapping introduced.
- Site/SEO/GEO: demonstration data remains deterministic; no production site migration.
- Business: no pricing or commercial claim introduced.
- Privacy/legal: no production personal or payment data introduced; fixtures remain synthetic.
- Operations: no hosted service or runtime dependency introduced.
