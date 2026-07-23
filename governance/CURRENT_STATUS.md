# Current Status

Generated from `governance/project-state.json`. Do not edit manually.

As of: 2026-07-23

## Project

- Name: **TimeProofs Outcome Assurance**
- Stage: `EXPERIMENTAL_FOUNDATION`
- Current phase: **P3 — TimeProofs Relay product alpha** (`IN_PROGRESS`)
- Current milestone: **P3-M1 — Stripe refund connector and relay foundation** (`IN_PROGRESS`)
- Unique next action: **TP-BUILD-001 — Ship the first runnable TimeProofs Relay with Stripe refund evidence**

## Completed foundation

- New repository foundation separated from AgentReady
- Experimental Evidence Bundle model
- Strict JSON parsing and deterministic canonicalization
- SHA-256 digests and Ed25519 proof verification
- Structural verifier and experimental verdict engine
- Refund scenarios: pending, verified, contradicted, unprovable
- Static product demonstration
- Global project operating system
- Evidence Bundle v0.1 normative fields, schemas, verifier, stable codes, and test vectors aligned
- Outcome Event v0.1 normative vocabulary, extension namespaces, relationship semantics, and refund/email/appointment profiles aligned
- Implementation-independent v0.1 conformance manifest, runner contract, fixture integrity hashes, and reference harness completed
- Machine-derived printable Outcome Evidence Packets and an anonymous local comprehension experiment completed for four refund outcomes
- Deployment-ready GitHub Pages preview, structured anonymous practitioner experiment, deterministic market analyzers, and field-validation runbooks completed
- Public GitHub repository created and complete prepared history imported on main
- Experimental validation preview deployed publicly through GitHub Pages at https://bacoul.github.io/timeproofs-protocol/
- First qualitative preview iteration completed: explicit non-timestamping category guard, source-provenance badges, and clipboard return path
- Stripe refund connector foundation implemented with authenticated webhook verification, provider-event normalization, and pending/verified/failed outcome tests

## Current blockers

- TimeProofs Relay HTTP service and append-only revision store are not implemented yet.
- The Stripe connector has not yet been exercised against a live Stripe test-mode webhook endpoint.
- No second independent implementation exists yet; G1 remains incomplete.
- The protocol and cryptographic design have not received independent security review.
- The broad outcome-verification category already has direct competitors, so TimeProofs must earn differentiation through open multi-issuer interoperability and recalculable evidence history.

## Workstreams

| ID | Workstream | Status |
|---|---|---|
| WS01_VISION | Vision, category, positioning, brand | ACTIVE |
| WS02_PROTOCOL | Open protocol and interoperability | ACTIVE |
| WS03_PRODUCT | Product software and developer experience | ACTIVE |
| WS04_AGENT_INTEGRATIONS | Agent frameworks and action protocols | ACTIVE |
| WS05_AGENTIC_COMMERCE | Agentic commerce and in-chat transactions | ACTIVE |
| WS06_NON_COMMERCE | Non-commerce consequential actions | PLANNED |
| WS07_DEMOS | Demonstrations and reference use cases | ACTIVE |
| WS08_COMPETITION | Competition and category intelligence | ACTIVE |
| WS09_STANDARDS | Standards and research | ACTIVE |
| WS10_SECURITY | Security and cryptographic assurance | ACTIVE |
| WS11_PRIVACY_LEGAL | Privacy, legal, and regulatory readiness | PLANNED |
| WS12_SITE | Global website and trust surfaces | ACTIVE |
| WS13_SEO | Global SEO and topical authority | PLANNED |
| WS14_GEO_AI_FIRST | GEO and AI-first discoverability | PLANNED |
| WS15_INTERNATIONAL | Internationalization and localization | PLANNED |
| WS16_BUSINESS | Business model, pricing, and revenue | DISCOVERY |
| WS17_DISTRIBUTION | Distribution and adoption | ACTIVE |
| WS18_OPERATIONS | Operations, reliability, and evolution | ACTIVE |

Status counts: ACTIVE=12, PLANNED=5, DISCOVERY=1.

## Release gates

| Gate | Name | Status |
|---|---|---|
| G0_OS | Global operating system | PASS |
| G1_PROTOCOL | Interoperable protocol alpha | IN_PROGRESS |
| G2_DEMO | Killer outcome demonstration | IN_PROGRESS |
| G3_DEVELOPER | Five-minute developer integration | IN_PROGRESS |
| G4_SERVICE | Managed service security and operations | NOT_STARTED |
| G5_MARKET | External adoption and payment evidence | NOT_STARTED |
| G6_GLOBAL | Global public launch | NOT_STARTED |

## Required reading

Read `AGENTS.md` and `governance/GLOBAL_MASTER_PLAN.md` before starting work.
