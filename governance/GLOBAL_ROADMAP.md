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

Status: IN PROGRESS

Milestone progress:

- `P1-M1 Evidence Bundle v0.1 normative coherence`: DONE on 2026-07-23;
- `P1-M2 Outcome Event base vocabulary`: DONE on 2026-07-23;
- `P1-M3 Implementation-independent conformance harness`: DONE on 2026-07-23;
- `P1-M4 Independent Python implementation`: IN PROGRESS;
- independent security review: NOT STARTED.

Objectives:

- complete Evidence Bundle v0.1 semantics;
- align schemas, canonicalization, digests, signatures, relations, errors, and fixtures;
- complete Outcome Event base vocabulary;
- document structural verification;
- produce a second independent implementation plan and compatibility harness.

Exit criteria:

- all normative fields are implemented and tested;
- stable valid and invalid vectors exist;
- a second implementation reproduces canonical bytes, digests, and verification results;
- a security review finds no unresolved critical design flaw.

Primary workstreams: WS02, WS09, WS10.

## Phase P2 — Killer outcome demonstration

Status: NOT STARTED

Objectives:

- transform the refund scenarios into a human Outcome Evidence Packet;
- make PENDING, VERIFIED, CONTRADICTED, and UNPROVABLE understandable without technical knowledge;
- keep every human rendering traceable to the machine bundle;
- add appointment and email secondary demonstrations.

Exit criteria:

- users consistently distinguish request, execution, and settlement;
- the public verifier displays source class, issuer, time, status, and missing evidence;
- no badge can conceal an incomplete or reversed lifecycle.

Primary workstreams: WS07, WS12, WS14.

## Phase P3 — Five-minute developer integration

Status: NOT STARTED

Objectives:

- Node.js receiver SDK;
- Python receiver SDK;
- generic HTTP and webhook middleware;
- MCP write-action wrapper;
- local signing and evidence references;
- documentation and copy-paste examples.

Exit criteria:

- a new developer instruments a write action in under ten minutes without direct assistance;
- SDK output passes the reference verifier;
- privacy-safe defaults are enabled;
- error and rollback behavior are documented.

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

## Phase P5 — Systems-of-record connectors

Status: NOT STARTED

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
