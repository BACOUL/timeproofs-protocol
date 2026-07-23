# Independent Python Implementation Plan

Status: APPROVED PLAN — IMPLEMENTATION NOT STARTED

## Objective

Build a Python implementation that independently reproduces the TimeProofs v0.1 conformance manifest without reusing the Node.js reference implementation logic.

## Independence boundaries

The Python implementation MUST NOT:

- import, execute, transpile, embed, or call `packages/core`;
- copy JavaScript functions line-for-line or mechanically translate them;
- use the reference CLI as an oracle during normal execution;
- generate expected outputs from the Node.js implementation;
- share mutable internal test helpers with the reference implementation;
- weaken strict parsing by accepting only already parsed Python objects.

The Python team or work session MAY read:

- normative specifications;
- JSON Schemas and machine-readable registries;
- the committed conformance manifest;
- fixture bytes;
- public standards referenced by the specification.

Reference implementation source SHOULD remain unread until the first complete conformance attempt is recorded. When the same contributor builds both implementations, work MUST proceed from the normative artifacts only and record any later source comparison separately.

## Planned package boundaries

```text
implementations/python/
├── pyproject.toml
├── src/timeproofs_conformance/
│   ├── strict_json.py
│   ├── canonicalize.py
│   ├── digest.py
│   ├── signature_input.py
│   ├── proofs.py
│   ├── vocabulary.py
│   ├── verify_bundle.py
│   └── adapter.py
└── tests/
```

## Implementation sequence

1. strict UTF-8 and duplicate-key-preserving parser input path;
2. canonicalization and canonical byte vectors;
3. SHA-256 object and payload digests;
4. signature-input construction;
5. Ed25519 public-key and proof validation;
6. envelope, field, vocabulary, graph, and relationship rules;
7. stable code normalization;
8. JSON Lines adapter;
9. blind run against the complete manifest;
10. discrepancy report and specification corrections where required.

## Acceptance criteria for TP-PROTO-004

- all canonicalization cases match exactly;
- all signature-input cases match exactly;
- all bundle fixture hashes are checked before parsing;
- all bundle normalized outputs match the manifest;
- no runtime dependency on Node.js exists;
- independence boundaries are evidenced in the acceptance report;
- any discrepancy is resolved through specification or implementation review, not by hiding it in an adapter.
