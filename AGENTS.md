# TimeProofs — Mandatory Project Operating Instructions

This file is the mandatory entry point for any human or AI contributor working in this repository.

## Before doing any work

Read these documents in order:

1. `governance/GLOBAL_MASTER_PLAN.md`
2. `governance/CURRENT_STATUS.md`
3. `governance/NEXT_ACTION.md`
4. `governance/DECISION_LOG.md`
5. `governance/RISK_REGISTER.md`
6. `strategy/COMPETITOR_RADAR.md`
7. `integrations/COMPATIBILITY_MATRIX.md`
8. the specifications and program documents relevant to the requested work

Do not start implementation until the current phase, unique next action, dependencies, exclusions, and acceptance criteria are understood.

## Source of truth

`governance/project-state.json` is the machine-readable project state.

The following files are generated from it and MUST NOT be edited manually:

- `governance/CURRENT_STATUS.md`
- `governance/NEXT_ACTION.md`
- root `NEXT_ACTION.md`

Run:

```bash
npm run project:generate
npm run project:validate
```

## Non-negotiable product boundaries

TimeProofs is an outcome-evidence and assurance layer for consequential AI actions.

TimeProofs MUST NOT silently drift into:

- generic LLM observability;
- a payment processor;
- an identity provider;
- a universal authorization gateway;
- a proprietary blockchain;
- an insurance product;
- a legal oracle;
- an all-purpose AI governance suite.

Evidence, verification, and verdict remain separate layers.

## Change discipline

Every material change MUST state:

- the workstream and milestone it advances;
- its explicit scope and non-scope;
- affected protocol invariants;
- tests and evidence added;
- decisions changed or introduced;
- risks created, reduced, or accepted;
- documentation and generated state updates required;
- rollback or migration implications.

A new idea is not automatically a new priority. Route it through `governance/CHANGE_CONTROL.md`.

## Completion rule

A task is not complete because code exists. It is complete only when the applicable criteria in `governance/DEFINITION_OF_DONE.md` and `governance/RELEASE_GATES.md` pass.
