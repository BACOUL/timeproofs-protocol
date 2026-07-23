# Security Policy

## Experimental status

TimeProofs v0.1 is not approved for protecting production financial, medical, identity, or legal evidence without an independent security review.

## Reporting

Do not disclose active private keys, production evidence, authentication material, or personal data in public issues.

Report security concerns privately to the project operator before public disclosure.

## Core security assumptions

- a valid signature proves control of a key, not factual truth;
- issuer and key trust must be established outside a raw bundle;
- hashes of predictable secrets can be guessed and require HMAC or randomized commitments;
- external evidence locators must not expose internal infrastructure;
- revocation and key rotation can affect later evaluations;
- a structurally valid bundle can remain insufficient for an outcome verdict.
