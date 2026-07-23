# TimeProofs Global Roadmap

Status: ACTIVE  
Planning horizon: foundation to global scale

The roadmap is ordered by dependency. A later phase may be researched early, but it MUST NOT displace the unique next action unless change control approves the reordering.

## Phase G0 — Global operating system

Status: DONE

Deliverables:

- global authority and 18 workstreams;
- machine-readable state;
- unique generated next action;
- risk, assumption, decision, competition, standards, site, business, and operations registers;
- CI validation and PR completion discipline.

Exit gate: `G0_OS = PASS`.

## Phase P1 — Interoperable protocol alpha

Status: IN PROGRESS, NON-BLOCKING FOR VALIDATION PREVIEW

Milestone progress:

- `P1-M1 Evidence Bundle v0.1 normative coherence`: DONE on 2026-07-23;
- `P1-M2 Outcome Event base vocabulary`: DONE on 2026-07-23;
- `P1-M3 implementation-independent conformance harness`: DONE on 2026-07-23;
- `P1-M4 independent Python implementation`: PAUSED until the first product-validation decision;
- independent security review: NOT STARTED.

The incomplete G1 gate forbids an interoperability-alpha or production claim, but it does not block a clearly labelled experimental demonstration used to validate product comprehension and demand.

Objectives:

- complete Evidence Bundle v0.1 semantics;
- align schemas, canonicalization, digests, signatures, relations, errors, and fixtures;
- complete Outcome Event base vocabulary;
- document structural verification;
- retain the independent implementation and security review as requirements before G1 can pass.

Exit criteria:

- all normative fields are implemented and tested;
- stable valid and invalid vectors exist;
- a second implementation reproduces canonical bytes, digests, and verification results;
- a security review finds no unresolved critical design flaw.

Primary workstreams: WS02, WS09, WS10.

## Phase P2 — Killer outcome demonstration and product validation

Status: CONTINUES IN PARALLEL, NON-BLOCKING

Milestone progress:

- `P2-M1 machine-derived Outcome Evidence Packet and local anonymous comprehension test`: DONE on 2026-07-23;
- `P2-M2 external comprehension, integration-demand, and willingness-to-pay evidence`: IN PROGRESS.

Objectives:

- transform the refund scenarios into human Outcome Evidence Packets;
- make PENDING, VERIFIED, CONTRADICTED, and UNPROVABLE understandable without technical knowledge;
- keep every human rendering traceable to the machine bundle;
- add appointment and email secondary demonstrations;
- measure comprehension before technical explanation;
- collect concrete reusable workflow and willingness-to-pay evidence.

Exit criteria:

- users consistently distinguish request, execution, and settlement;
- the public verifier displays source class, issuer, time, status, and missing evidence;
- no badge can conceal an incomplete or reversed lifecycle;
- at least 10 external comprehension results and 5 qualified workflow interviews are recorded honestly;
- the connector decision is based on evidence rather than protocol enthusiasm.

Primary workstreams: WS03, WS07, WS12, WS14, WS16, WS17.

## Phase P3 — TimeProofs Relay product alpha

Status: IN PROGRESS

Acceleration decision: Stripe refund connector work originally scheduled for P5 is pulled into P3 so the protocol immediately produces a runnable product.

Objectives:

- Node.js Evidence Bundle builders and Relay signing path;
- authenticated generic HTTP and webhook middleware;
- Stripe refund connector and test-mode walkthrough;
- append-only local action store with predecessor bundle digests;
- current outcome API with recalculable evaluations;
- MCP write-action wrapper after the Relay API stabilizes;
- Python receiver SDK after the runnable Node product.

Exit criteria:

- a new developer runs the Relay and instruments a refund workflow in under ten minutes without direct assistance;
- authenticated Stripe webhook fixtures produce PENDING, VERIFIED, and CONTRADICTED outcomes;
- every Relay bundle passes the reference verifier and links to prior revisions;
- privacy-safe defaults are enabled;
- error, replay, idempotency, and rollback behavior are documented.

Primary workstreams: WS03, WS04, WS10.

## Phase P4 — Managed service alpha

Status: NOT STARTED

Objectives:

- issuer and key registry;
- secure retention;
- re-verification;
- lifecycle correlation;
- access control;
- audit exports;
- service monitoring and incident procedures;
- initial self-service account and billing architecture.

Exit criteria:

- threat model and privacy review pass;
- keys can rotate and revoke without losing historical verification;
- backups and restoration are tested;
- one external user retains and re-verifies real evidence.

Primary workstreams: WS03, WS10, WS11, WS18.

## Phase P5 — Systems-of-record connector expansion

Status: STRIPE FOUNDATION ACCELERATED INTO P3; BROADER EXPANSION NOT STARTED

Objectives:

- Stripe sandbox settlement/refund connector;
- Shopify order/refund connector;
- calendar and email connectors;
- webhook correlation and idempotency;
- connector evidence-quality tests.

Exit criteria:

- at least one real sandbox workflow produces receiver or system-of-record evidence;
- reversal and delayed-settlement scenarios are demonstrated;
- connector outages do not create false VERIFIED verdicts.

Primary workstreams: WS05, WS06, WS07.

## Phase P6 — Agentic protocol bridge

Status: NOT STARTED

Objectives:

- MCP compatibility profile;
- A2A delegation mapping;
- ACP, UCP, and AP2 evidence mapping;
- version tracking and compatibility matrix;
- cross-protocol action correlation.

Exit criteria:

- one action dossier combines evidence from at least three independent protocol or system sources;
- mappings state exactly what each protocol can and cannot prove;
- upstream version changes are detected by compatibility checks.

Primary workstreams: WS04, WS05, WS09.

## Phase P7 — Global site, SEO, GEO, and category launch

Status: NOT STARTED

Objectives:

- migrate `timeproofs.io` only after product gates pass;
- public product, protocol, verifier, demos, docs, trust, security, privacy, pricing, and status pages;
- English canonical site, French support, scalable localization;
- SEO topic clusters and AI-first source pages;
- structured data, `llms.txt`, version metadata, and no-JavaScript documentation access.

Exit criteria:

- site claims map to reproducible evidence;
- no AgentReady legacy ambiguity remains;
- technical pages are indexable, fast, accessible, and machine-readable;
- ChatGPT, Gemini, and other assistants can extract the canonical product definition from first-party pages.

Primary workstreams: WS01, WS12, WS13, WS14, WS15.

## Phase P8 — Commercial self-service

Status: NOT STARTED

Objectives:

- validated packaging and pricing;
- automated signup, billing, limits, entitlements, and cancellation;
- onboarding telemetry with privacy boundaries;
- support model and documentation;
- conversion and retention experiments.

Exit criteria:

- first repeatable paid acquisition or product-led conversion path;
- positive gross-margin model;
- clear path to EUR 10,000 MRR;
- no required manual review in the standard purchase path.

Primary workstreams: WS16, WS17, WS18.

## Phase P9 — Standardization and scale

Status: NOT STARTED

Objectives:

- standards participation where evidence supports it;
- extension registry governance;
- additional languages and regions;
- enterprise retention, compliance, and dispute workflows;
- high-volume anchoring and usage economics;
- partner ecosystem.

Exit criteria:

- external implementations and integrations exist without private coordination;
- protocol evolution is governed transparently;
- reliability, security, and economics support global scale.

Primary workstreams: all, governed by validated demand.
