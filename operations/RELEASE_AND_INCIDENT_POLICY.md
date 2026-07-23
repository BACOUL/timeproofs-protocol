# Release and Incident Policy

## Release classes

- experimental draft;
- alpha;
- beta;
- stable protocol profile;
- managed service preview;
- managed service general availability.

Each class requires matching release-gate evidence. “Stable” never applies solely because tests pass in one implementation.

## Incident categories

- cryptographic verification error;
- incorrect verdict or ruleset behavior;
- key compromise;
- evidence loss or corruption;
- privacy or access-control incident;
- connector outage or stale evidence;
- dependency or supply-chain compromise;
- misleading public status or badge.

## Response requirements

- contain and preserve evidence;
- stop unsafe verdict issuance when needed;
- publish accurate affected-version information;
- provide re-verification or migration path;
- rotate or revoke keys;
- update risk, decisions, tests, and threat model;
- avoid deleting historical incident context required for trust.
