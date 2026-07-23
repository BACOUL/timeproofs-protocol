# Decision Log

## D-001 — Separate AgentReady from the new protocol

**Decision:** The new TimeProofs protocol is developed as a clean project. AgentReady remains historical and maintenance-only.

**Reason:** The products differ in lifecycle position, architecture, users, evidence model, and commercial direction.

## D-002 — Evidence is separate from verdict

**Decision:** Bundles contain immutable claims and evidence. Verdicts are recalculated from versioned rules.

**Reason:** New evidence, reversals, key status, or improved rules can change the evaluation without modifying history.

## D-003 — JSON first, COSE later

**Decision:** `TP-JSON-0.1` is the initial interoperable profile. CBOR/COSE follows after model stability.

**Reason:** Human inspection and rapid implementation are more important than compact encoding in the first interoperability phase.

## D-004 — Causal graph, not linear log

**Decision:** Events may have multiple causal parents and independent sources.

**Reason:** Real actions span concurrent systems and cannot be reduced to one authoritative sequence.

## D-005 — Receiver and system-of-record evidence is preferred

**Decision:** The source class is explicit. Self-claims are never silently upgraded to verified outcomes.

**Reason:** An agent-owned trace cannot independently establish what an external system received or executed.

## D-006 — Refund assurance is the first product wedge

**Decision:** The first domain ruleset and public demonstration cover refunds.

**Reason:** The difference between requested, created, and settled is valuable, easy to understand, and commercially relevant.

## D-007 — Open protocol, paid assurance services

**Decision:** Specifications, schemas, verifier, and local tools remain open. Retention, key management, connectors, and continuous verification form the commercial layer.
