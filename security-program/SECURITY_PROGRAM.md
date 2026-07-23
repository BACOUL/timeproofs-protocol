# Security Program

## Security objective

A verifier must fail safely. Missing, stale, unverifiable, revoked, contradictory, or malformed evidence must never be upgraded into a stronger outcome status.

## Program areas

- protocol threat modeling;
- canonicalization and parser security;
- cryptographic algorithm and domain separation;
- issuer identity and key lifecycle;
- replay, omission, truncation, equivocation, and suppression attacks;
- connector authentication and webhook verification;
- multi-tenant isolation;
- secrets management;
- access control and audit logs;
- dependency and supply-chain security;
- incident response and responsible disclosure;
- backups and disaster recovery;
- external review and penetration testing before production.

## Mandatory security gates

- no custom cryptographic primitive;
- strict parser and duplicate-key rejection;
- deterministic test vectors;
- second implementation;
- key rotation and revocation semantics;
- freshness and evidence retrieval failure handling;
- privacy review for every new embedded field;
- no production signing key in repository or client bundle;
- no VERIFIED verdict from unavailable required evidence.
