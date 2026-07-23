# Privacy Model v0.1

## Principles

1. Store evidence commitments instead of raw sensitive content whenever possible.
2. Keep raw evidence at the system that already controls it unless transfer is necessary.
3. Use opaque locators.
4. Separate public verification data from restricted evidence.
5. Make retention and deletion explicit.
6. Do not treat hashing as anonymization.

## Disclosure classes

- `PUBLIC` — safe for unrestricted display.
- `RESTRICTED` — retrievable only after authorization.
- `PRIVATE` — retained inside the originating trust domain.
- `COMMITMENT_ONLY` — only a digest or protected commitment is exchanged.

## Managed-service boundary

A future TimeProofs service should accept metadata and commitments by default. Raw prompts, personal data, credentials, payment instruments, and private documents must require an explicit product feature and retention policy.
