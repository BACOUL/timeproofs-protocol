# Next Action

Generated from `governance/project-state.json`. Do not edit manually.

## TP-PROTO-004 — Build independent Python conformance implementation

- Workstream: `WS02_PROTOCOL`
- Phase: `P1`
- Milestone: `P1-M4`

## Purpose

Implement TP-JSON-0.1 independently in Python from the normative specifications, registries, fixture bytes, and committed conformance manifest, then reproduce every canonicalization, signature-input, digest, proof, structural status, and stable-code result without calling or translating the Node.js reference implementation.

## Acceptance criteria

- A standalone Python package implements strict JSON input handling, canonicalization, SHA-256 digests, signature-input construction, Ed25519 proof verification, vocabulary checks, graph checks, and structural results.
- The Python implementation has no runtime or generated-code dependency on Node.js or packages/core.
- A JSON Lines adapter implements conformance/runner-contract-v0.1.json.
- All 35 committed conformance cases pass exactly, including fixture byte hashes and normalized stable-code sets.
- Independence boundaries and the first blind conformance run are documented in acceptance evidence.
- Discrepancies are resolved through specification or implementation review and project state is reconciled before merge.

## Explicit non-scope

- Verdict Engine implementation in Python
- Managed cloud service
- Production ACP, UCP, AP2, MCP, or A2A adapters
- Public site migration
- Commercial pricing

## Completion procedure

1. Implement only the approved scope.
2. Add tests and acceptance evidence.
3. Review decisions, risks, assumptions, competitors, compatibility, security, privacy, site, business, and operations impacts.
4. Update `governance/project-state.json` when milestone state changes.
5. Run `npm run project:generate`, `npm test`, and `npm run project:validate`.
