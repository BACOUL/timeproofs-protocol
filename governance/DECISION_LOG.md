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
