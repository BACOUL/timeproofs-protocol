# TimeProofs Protocol

**Independent evidence for AI action outcomes.**

TimeProofs defines a portable way to record, sign, exchange, verify, and evaluate evidence about actions performed by AI agents.

The project exists to answer one practical question:

> When an AI says “done”, what evidence shows what actually happened?

## Product direction

TimeProofs Outcome Assurance separates three layers:

```text
Immutable evidence
      ↓
Versioned verification rules
      ↓
Recalculable outcome verdict
```

This repository contains the open protocol foundation and reference implementation. It does **not** contain a payment protocol, an identity system, a runtime firewall, or a legal guarantee of truth.

## Core objects

- **Outcome Event** — one immutable observation or claim in an action lifecycle.
- **Evidence Bundle** — a signed, portable set of events, evidence references, issuers, causal relationships, and proofs.
- **Structural Verifier** — checks shape, digests, references, signatures, and graph integrity.
- **Verdict Engine** — applies a separately versioned ruleset to verified evidence.
- **Outcome Evidence Packet** — deterministic human-readable rendering generated from the same machine-verifiable record.
- **Outcome Ledger** — future long-term chronology across bundle revisions.

## Current status

`v0.1.0-alpha.0` is an experimental interoperability foundation.

Implemented now:

- strict JSON parser with duplicate-key rejection;
- deterministic JSON canonicalization compatible with the initial `TP-JSON-0.1` profile;
- SHA-256 object and payload digests;
- Ed25519 proof creation and verification;
- structural verification with `VALID`, `INVALID`, and `INCOMPLETE` outcomes;
- experimental refund verdict rules;
- valid and invalid test vectors;
- a registered base Outcome Event vocabulary with collision-resistant extensions;
- four machine-derived printable Outcome Evidence Packets;
- an anonymous local comprehension experiment and validation report tooling;
- a static refund demonstration site;
- a runnable local/VPC TimeProofs Relay with append-only bundle revisions;
- authenticated Stripe refund webhook ingestion and outcome recalculation;
- HTTP endpoints for current outcome, bundle, packet, issuer, and revision history.

Not yet stable:

- independent Python interoperability;
- the public extension registry;
- long-term key discovery and revocation;
- external evidence retrieval;
- SCITT/COSE integration;
- production retention and verification services.


## Project operating system

This repository is also the official memory and control system for the global product. Before contributing, read [AGENTS.md](AGENTS.md) and [PROJECT_START_HERE.md](PROJECT_START_HERE.md).

The operating system governs protocol, product, integrations, agentic commerce, site, SEO, GEO, AI-first discovery, security, privacy, business, competition, distribution, and operations. The current state and unique next action are generated from `governance/project-state.json`.

## Quick start

Requirements: Node.js 22 or later.

```bash
npm ci
npm test
node packages/cli/bin/timeproofs.mjs verify test-vectors/valid/refund-verified.bundle.json
node packages/cli/bin/timeproofs.mjs verdict test-vectors/valid/refund-pending.bundle.json --ruleset refund-v0.1
```


### Run TimeProofs Relay

```bash
STRIPE_WEBHOOK_SECRET=whsec_test_only npm run relay:start
```

Containerized start:

```bash
export STRIPE_WEBHOOK_SECRET=whsec_test_only
docker compose up --build
```

The local alpha listens on `127.0.0.1:8787`, creates an operator-controlled Ed25519 key in `.timeproofs-relay/`, and stores immutable bundle revisions locally. The container listens through port `8787` and persists the same data model in a named volume. Create an action with `POST /v1/actions`, then forward Stripe test-mode webhooks to `POST /v1/webhooks/stripe`.

See [Relay HTTP API](integrations/RELAY_HTTP_API.md) and [local quick start](examples/relay/README.md).

## Repository map

```text
spec/              Normative and draft protocol documents
schemas/           JSON Schema definitions
packages/core/     Canonicalization, digests, signatures, verification
packages/cli/      Reference command-line interface
packages/verdict-engine/ Experimental versioned verdict rules
packages/stripe-connector/ Authenticated Stripe refund normalization
packages/relay/    Runnable local/VPC Relay and HTTP API
test-vectors/      Interoperability fixtures
examples/          Human-oriented scenarios
site/              Static product and demo preview
```

## Non-goals

TimeProofs does not claim that a valid signature makes a statement true. It proves integrity, provenance, and consistency of recorded evidence. Business sufficiency is evaluated separately by explicit versioned rules.

## License

Apache License 2.0. See [LICENSE](LICENSE).
