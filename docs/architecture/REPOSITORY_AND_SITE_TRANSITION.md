# Repository and Site Transition

## 1. Existing repository

`BACOUL/timeproofs` remains the historical AgentReady repository.

It must preserve:

- existing tags and releases;
- the published GitHub Marketplace Action;
- public references used by existing users;
- historical documentation and evidence.

AgentReady enters maintenance mode:

- critical fixes only;
- no new commercial roadmap;
- no attempt to merge Outcome Assurance into the same codebase;
- open AgentReady draft PRs are reviewed and closed as not planned after the new repository is safely published.

## 2. New repository

`BACOUL/timeproofs-protocol` becomes the authority for:

- Evidence Bundle specification;
- Outcome Event vocabulary;
- reference verifier;
- test vectors;
- protocol SDKs;
- refund assurance demonstration.

Future managed-service code should live separately when operational security requires private infrastructure.

## 3. Public site transition

The production site must not pivot on words alone.

The site changes from AgentReady to Outcome Assurance only after these assets exist on a public commit:

1. Evidence Bundle specification;
2. JSON Schema;
3. passing verifier CI;
4. valid and invalid vectors;
5. interactive refund demonstration;
6. clear experimental limitations;
7. stable public repository URL.

## 4. Route policy after transition

Recommended structure:

```text
/                         TimeProofs Outcome Assurance
/demo/refund              Refund evidence demonstration
/protocol                 Evidence Bundle and verifier
/docs                     Developer documentation
/verify                   Future public bundle verification
/agentready               Historical AgentReady product page
```

AgentReady should remain accessible but should not compete for primary navigation or product authority.

## 5. Deployment boundary

The static preview in `site/` contains no backend, accounts, uploads, analytics, or production claims.

A public upload-based verifier must not be deployed until privacy controls define:

- whether bundle content leaves the browser;
- maximum file size;
- retention behavior;
- logging behavior;
- abuse controls;
- confidential evidence handling.
