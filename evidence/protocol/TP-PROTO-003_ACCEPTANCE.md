# TP-PROTO-003 Acceptance Evidence

Date: 2026-07-23  
Status: PASS

## Scope completed

- language-neutral conformance specification;
- machine-readable expected-result manifest;
- manifest SHA-256 integrity sidecar;
- JSON Lines external runner contract;
- canonicalization byte and digest cases;
- domain-separated signature-input cases;
- exact normalized outputs for every valid and invalid bundle fixture;
- fixture-byte integrity verification;
- reference implementation conformance runner;
- conformance harness validator;
- independent Python implementation plan and boundaries;
- CI and project operating system integration.

## Coverage

| Category | Cases |
|---|---:|
| Canonicalization | 6 |
| Signature input | 2 |
| Bundle verification | 27 |
| **Total conformance cases** | **35** |

Bundle coverage includes all 7 valid/incomplete fixtures and all 20 invalid fixtures present at acceptance time.

## Normative comparisons

The harness compares:

- exact canonical JSON and UTF-8 bytes;
- exact SHA-256 values;
- exact domain-separated signature-input bytes;
- fixture original-byte hashes;
- structural status;
- payload digest;
- exact sorted unique stable error and warning code sets;
- exact normalized valid-proof set;
- summary counts.

Human diagnostic messages, paths, and ordering are non-normative.

## Validation results

- Reference protocol tests: 54 PASS;
- Protocol alignment: PASS — 106 schema paths, 155 stable codes, 38 registered event types, 20 invalid fixtures;
- Conformance manifest validation: PASS;
- Reference conformance run: 35/35 PASS;
- Global project operating system: PASS — 50 required files, 18 workstreams;
- `git diff --check`: PASS.

## Integrity

The accepted manifest digest is recorded in `conformance/manifest-v0.1.sha256`.

## Independence boundary

No second implementation was written in this milestone. `docs/architecture/SECOND_IMPLEMENTATION_PLAN.md` forbids runtime reuse, translation, or oracle calls to the Node.js reference implementation. TP-PROTO-004 must implement from normative artifacts and record the first blind comparison.

## Non-scope respected

- no Python implementation;
- no managed service;
- no production adapters;
- no site migration;
- no pricing publication.
