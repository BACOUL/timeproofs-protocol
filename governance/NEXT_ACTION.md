# Next Action

Generated from `governance/project-state.json`. Do not edit manually.

## TP-PROTO-002 — Complete Outcome Event v0.1 normative vocabulary

- Workstream: `WS02_PROTOCOL`
- Phase: `P1`
- Milestone: `P1-M2`

## Purpose

Define the universal lifecycle phases, statuses, source classes, naming rules, base relationship semantics, and initial domain profiles without confusing events with verdicts.

## Acceptance criteria

- Every universal phase, status, and source class has normative semantics and invalid combinations are documented.
- Event type registration and extension rules prevent naming collisions.
- The refund vocabulary is complete for request, acceptance, creation, settlement, failure, cancellation, expiry, and reversal.
- At least one email and one appointment vocabulary profile are defined without changing the base Evidence Bundle schema.
- Vocabulary fixtures and verifier checks remain deterministic.
- Project status, decisions, risks, compatibility, and evidence are reconciled before merge.

## Explicit non-scope

- Second implementation language
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
