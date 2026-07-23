# TimeProofs Threat Model v0.1

Status: EXPERIMENTAL

## 1. Assets

- evidence integrity;
- issuer provenance;
- key material;
- causal history;
- confidential business metadata;
- verifier correctness;
- ruleset identity and version;
- long-term retrievability.

## 2. Trust boundaries

```text
AI agent
→ gateway or tool server
→ receiving service
→ system of record
→ settlement provider
→ TimeProofs verifier or managed service
```

No boundary is universally trusted.

## 3. Threats and current controls

### T-001 Bundle tampering

**Threat:** An attacker changes a claim, event, or evidence reference.

**Controls:** Canonical object digests, payload digest, signatures, and immutable revisions.

### T-002 Signature replay across contexts

**Threat:** A valid signature from another protocol or target type is reused.

**Controls:** Domain-separated signing input binds protocol, version, profile, target type, and digest.

### T-003 Duplicate-key parser disagreement

**Threat:** Two implementations interpret the same JSON differently.

**Controls:** Strict raw JSON parsing rejects duplicate properties before data-model creation.

### T-004 Invalid Unicode or numeric ambiguity

**Threat:** Different serializers produce different bytes.

**Controls:** Unicode scalar validation, deterministic property ordering, finite JSON numbers, decimal strings for money.

### T-005 Malicious or mistaken issuer

**Threat:** A correctly signed claim is false.

**Controls:** Explicit source class and issuer; verdict rules require appropriate sources.

**Residual risk:** The core protocol cannot independently prove factual honesty.

### T-006 Event omission

**Threat:** An agent or issuer omits a failure, reversal, or later event.

**Controls:** Multiple independent issuers, long-term outcome collection, transparency anchoring planned.

**Residual risk:** A static bundle cannot prove completeness by itself.

### T-007 Collusion

**Threat:** Multiple issuers coordinate to sign a false outcome.

**Controls:** Independent settlement sources and external audit processes.

**Residual risk:** Protocol cryptography cannot eliminate collusion.

### T-008 Key compromise

**Threat:** An attacker signs false evidence with a stolen key.

**Controls:** Key IDs and future registry, rotation, revocation, and verification-time evaluation.

**Residual risk:** v0.1 bundles embed keys but do not establish production trust or revocation status.

### T-009 Low-entropy digest disclosure

**Threat:** A private amount, status, or identifier is guessed from its plain hash.

**Controls:** Specification requires HMAC or randomized commitments for predictable secrets.

### T-010 Locator leakage

**Threat:** Evidence references expose internal storage or network structure.

**Controls:** Opaque locators and explicit retrieval policies.

### T-011 Evidence disappearance

**Threat:** External evidence becomes unavailable after the bundle is created.

**Controls:** Content digest preserves integrity commitment; managed retention is planned.

**Residual risk:** A commitment does not restore missing evidence.

### T-012 Verdict drift

**Threat:** A changed ruleset silently changes historical interpretation.

**Controls:** Verdict output must identify ruleset name, version, verification time, and decisive events.

### T-013 Graph equivocation

**Threat:** Independent branches present incompatible histories.

**Controls:** Multiple predecessor digests and explicit contradiction relationships.

**Residual risk:** Merge policy and transparency services are not yet defined.

## 4. Security release gates

Before production use:

- independent canonicalization review;
- cryptographic implementation review;
- key registry and revocation design;
- confidential evidence review;
- fuzz testing of strict parser and verifier;
- denial-of-service limits;
- dependency and supply-chain controls;
- incident response process.
