# Next Action

Generated from `governance/project-state.json`. Do not edit manually.

## TP-PROTO-003 — Establish implementation-independent conformance harness

- Workstream: `WS02_PROTOCOL`
- Phase: `P1`
- Milestone: `P1-M3`

## Purpose

Define a language-neutral conformance contract and machine-readable expected results so a genuinely independent implementation can reproduce canonical bytes, digests, proof validation, structural statuses, and stable codes without relying on the Node.js reference code.

## Acceptance criteria

- A machine-readable conformance manifest covers canonicalization, valid bundles, invalid bundles, digests, proofs, structural statuses, and stable codes.
- Expected outputs are generated or verified independently of incidental CLI text and file ordering.
- A language-neutral runner contract defines inputs, outputs, comparison rules, and failure classification.
- The second implementation plan states independence boundaries and forbids reuse of reference implementation logic.
- The existing Node.js implementation passes the complete conformance harness deterministically.
- Project status, decisions, risks, compatibility, security, and acceptance evidence are reconciled before merge.

## Explicit non-scope

- Writing the second Python implementation
- Managed cloud service
- Production protocol adapters
- Public site migration
- Commercial pricing

## Completion procedure

1. Implement only the approved scope.
2. Add tests and acceptance evidence.
3. Review decisions, risks, assumptions, competitors, compatibility, security, privacy, site, business, and operations impacts.
4. Update `governance/project-state.json` when milestone state changes.
5. Run `npm run project:generate`, `npm test`, and `npm run project:validate`.
