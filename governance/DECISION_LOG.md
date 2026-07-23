# Decision Log

Only durable product, protocol, business, or operating decisions belong here. Each decision is append-only; superseding decisions reference earlier IDs.

## D-001 — Separate the new product from AgentReady

Date: 2026-07-23
Status: ACCEPTED

The new TimeProofs protocol and Outcome Assurance product use a new repository. The existing AgentReady repository and published assets are preserved in maintenance mode.

Reason: the product architecture, runtime model, buyer, commercial layer, and roadmap are materially different.

## D-002 — Evidence, verification, and verdict are separate

Date: 2026-07-23
Status: ACCEPTED

Immutable evidence is stored in Evidence Bundles. Structural and cryptographic verification is separate. Business verdicts are recalculated using explicitly versioned rules.

## D-003 — Use a causal graph, not only a linear chain

Date: 2026-07-23
Status: ACCEPTED

Events may have multiple parents and independent sources. A simple chain is a valid subset, not the complete model.

## D-004 — Open protocol, commercial assurance service

Date: 2026-07-23
Status: ACCEPTED

The protocol, schemas, local verifier, and base SDKs are open. Managed retention, keys, connectors, re-verification, evidence packets, organization rules, and operational guarantees are commercial.

## D-005 — Refund is the initial demonstration, not the product boundary

Date: 2026-07-23
Status: ACCEPTED

Refund lifecycle assurance is the first wedge because it exposes the difference between request, creation, settlement, and reversal. Expansion covers all consequential AI actions.

## D-006 — Global product operating system is mandatory

Date: 2026-07-23
Status: ACCEPTED

The repository is the official memory of the project. Every work session begins with the mandatory reading sequence in `AGENTS.md`. Project status and next action are generated from machine-readable state and checked in CI.

## D-007 — English is normative; translations are non-normative

Date: 2026-07-23
Status: ACCEPTED

Protocol and global product authorities are written in English. French and future localized guides support adoption but do not silently redefine normative semantics.

## D-008 — Complement agentic commerce protocols

Date: 2026-07-23
Status: ACCEPTED

TimeProofs maps and correlates evidence from commerce, payment, tool, agent-to-agent, API, webhook, and system-of-record layers. It does not attempt to own payment processing or authorization.

## D-009 — Schema and verifier acceptance sets must match

Date: 2026-07-23
Status: ACCEPTED

Every field and nested member accepted by the TP-JSON schema must have normative semantics and be accepted by the reference verifier. Every field rejected by the schema must also be rejected by the reference verifier, except where JSON Schema cannot express an explicitly documented semantic check.

The machine-readable field registry and protocol-alignment validator enforce this decision.

## D-010 — Stable structural codes are protocol surface

Date: 2026-07-23
Status: ACCEPTED

Structural error and completeness codes are versioned interoperability outputs, not incidental log messages. Their machine-readable authority is `spec/error-codes-v0.1.json`. Human messages and paths may improve without changing code meaning.

## D-011 — Registered base vocabulary with collision-resistant extensions

Date: 2026-07-23
Status: ACCEPTED

TimeProofs maintains a machine-readable registry for base event types and reserves its core namespaces. Third-party event types remain valid only under the explicit `x.<reverse-dns>.<domain>.<resource>.<event>` form. This prevents collisions without making the protocol closed.

## D-012 — Provenance is representable even when it is insufficient

Date: 2026-07-23
Status: ACCEPTED

Source classes describe who made or observed a claim. A self-claimed external outcome remains structurally representable and signable; it is not rejected merely because it is weak evidence. Domain verdict rules determine sufficiency. This preserves unsupported or contradictory claims for audit instead of erasing them at parse time.

## D-013 — Phase, event type, and status have normative semantic compatibility

Date: 2026-07-23
Status: ACCEPTED

Universal phase/status compatibility and registered event type phase/status semantics are structural interoperability rules. A verifier rejects impossible combinations while keeping overall action verdicts outside the Evidence Bundle layer. Relationship direction is also normative by relationship type.

## D-014 — Conformance is defined by committed normalized outputs

Date: 2026-07-23
Status: ACCEPTED

TimeProofs conformance is measured against a versioned, machine-readable manifest that binds fixture bytes and expected canonicalization, signature-input, digest, proof, structural-status, and stable-code outputs. CLI prose, diagnostic paths, error ordering, and source-code organization are non-normative.

The manifest has an integrity sidecar and cannot be regenerated automatically during ordinary CI, preventing an implementation change from silently rewriting its own expected results.

## D-015 — Product validation may precede full protocol-alpha completion

Date: 2026-07-23
Status: ACCEPTED

The Outcome Evidence Packet, comprehension experiment, and demand validation proceed before the independent Python implementation and external cryptographic review are complete.

This does not pass the interoperable protocol gate and does not permit an interoperability, production, compliance, or legal-validity claim. It prevents protocol overbuilding by requiring visible user comprehension, reusable integration demand, and willingness-to-pay evidence before further protocol breadth or managed infrastructure.

The independent implementation remains required before `G1_PROTOCOL` can pass.

## D-016 — External validation uses a static, anonymous, no-backend preview first

Date: 2026-07-23
Status: ACCEPTED

The first market experiment is deployed as a static GitHub Pages preview. Browser forms send no data and collect no name, email, company, phone, address, analytics, or cookies. Participants deliberately export structured anonymous JSON and return it through the channel that shared the preview.

This reduces privacy and infrastructure scope while preserving auditable evidence. It is an experiment surface, not a production service or a substitute for consented design-partner follow-up.

## D-017 — Clarify category and provenance before adding feedback infrastructure

Date: 2026-07-23
Status: ACCEPTED

The deployed validation preview explicitly states that TimeProofs is not a timestamping protocol and labels the provenance class of every demonstrated lifecycle event. Anonymous results can be copied to the clipboard or downloaded locally.

A collection backend is not added from predicted friction alone. It may be introduced only if observed completion and return rates show that manual return materially biases or blocks the validation sample. This preserves the no-backend privacy experiment while reducing unnecessary participant effort.
## D-018 — Build-first Relay execution replaces validation as the blocking next action

Date: 2026-07-23
Status: ACCEPTED

The broad outcome-verification category is no longer empty. Direct competitors already publish system-of-record checks, completion decisions, signed receipts, offline verification, refund examples, and provider connectors. TimeProofs therefore cannot base its strategy on being the first generic completion-verification product.

The project proceeds immediately with TimeProofs Relay: an open-source local/VPC reference product for multi-issuer Evidence Bundles, append-only bundle revisions, and separately recalculable evaluations. External feedback remains useful but does not block implementation. The first accelerated connector is Stripe refunds in test mode.

TimeProofs MUST NOT copy a competitor's closed completion-control interface or claim category primacy. Its differentiation must be demonstrated through portable protocol objects, transparent upstream authentication, evidence/evaluation separation, revision history, and cross-domain interoperability.
