# Key Lifecycle Program

The managed product must support:

- issuer registration and domain/control verification;
- separate signing keys by environment and purpose;
- hardware-backed or managed KMS options;
- public key discovery;
- activation and expiry times;
- rotation with overlap;
- revocation and compromise reason;
- historical verification at event time;
- countersignature and transparency anchoring where useful;
- tenant separation;
- test-key isolation;
- recovery without rewriting historical bundles.

A key being currently revoked does not automatically mean every historical proof was invalid. Verification rules must consider signing time, compromise time, trust policy, and available timestamp evidence.
