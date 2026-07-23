# Definition of Done

A task or pull request is DONE only when every applicable item passes.

## Scope

- Workstream and milestone identified.
- Scope and non-scope stated.
- Dependencies and rollback understood.

## Product and protocol

- Applicable invariants preserved.
- User-visible semantics documented.
- Compatibility and migration implications addressed.
- No new claim exceeds available evidence.

## Engineering

- Tests cover success, failure, malformed, privacy, and reversal cases where relevant.
- Deterministic outputs are reproducible.
- Error codes are stable and documented.
- Security-sensitive code has targeted review.

## Global program

- `project-state.json` reconciled when status changes.
- generated status views regenerated.
- decision log updated for durable decisions.
- risk and assumption registers reviewed.
- competitor and compatibility documents updated when external landscape changes.
- website, SEO, GEO, legal, and operations impacts explicitly considered.

## Evidence

- Acceptance evidence stored or referenced.
- Commands and versions recorded.
- Screenshots or human review included only when visual behavior changes.
- External claims include source and review date.

## Validation

```bash
npm run project:generate
npm test
npm run project:validate
```

A passing CI run is necessary but not sufficient when human, legal, security, or commercial review is required.
