# TimeProofs Outcome Assurance — Product Master Plan

Status: ACTIVE PRODUCT AUTHORITY  
Version: 0.1  
Date: 2026-07-23

## 1. Mission

TimeProofs verifies, tracks, and preserves evidence of the real outcomes of actions executed by AI agents.

Canonical promise:

> When an AI says “done”, verify what actually happened.

## 2. Problem

Agentic actions cross multiple trust boundaries:

```text
User intent
→ chat or agent
→ tool or protocol
→ receiving service
→ system of record
→ settlement or final outcome
```

A trace owned by one participant cannot always establish what another participant received or executed. TimeProofs creates a portable evidence layer across those boundaries.

## 3. Product boundaries

TimeProofs is:

- an evidence protocol;
- a structural verifier;
- a versioned outcome evaluation system;
- a long-term evidence and verification service;
- an interoperability layer across agent and commerce protocols.

TimeProofs is not:

- an agent observability platform;
- a payment processor;
- an identity provider;
- an authorization engine;
- a universal risk firewall;
- a blockchain;
- a legal oracle;
- a guarantee that every signed claim is factually true.

## 4. Product architecture

### Open layer

- Evidence Bundle specification;
- Outcome Event vocabulary;
- JSON Schema;
- canonicalizer;
- local verifier;
- test vectors;
- SDKs;
- public verification format.

### Commercial layer

- managed key lifecycle;
- trusted timestamps and transparency anchoring;
- long-term retention;
- automated re-verification;
- external evidence connectors;
- lifecycle correlation;
- audit and dispute packets;
- organization policies and rulesets;
- usage analytics limited to evidence operations, not private content.

## 5. Defensible advantage

The protocol syntax is intentionally open. The defensible product is built from:

1. integrations with systems of record;
2. evidence-source and key registry;
3. lifecycle correlation across protocols;
4. contradiction and reversal detection;
5. versioned domain rulesets;
6. trusted long-term verification;
7. developer adoption and a recognizable outcome vocabulary.

## 6. Initial wedge

First supported domain: **refund lifecycle assurance**.

The killer demonstration distinguishes:

- refund requested;
- refund accepted;
- refund created;
- refund sent for settlement;
- refund settled;
- refund reversed or failed.

An agent must not display “refund completed” when only a request or refund object exists.

## 7. First integrations

Priority order:

1. generic HTTP/webhook receiver SDK;
2. MCP write-action adapter;
3. Stripe test connector;
4. Shopify order/refund connector;
5. calendar and email demonstrations;
6. ACP/UCP/AP2 mapping profiles after protocol stabilization.

## 8. Business model

The open verifier remains free.

Paid services:

- managed evidence retention;
- automated re-verification;
- key and issuer management;
- connectors;
- audit exports;
- dispute-ready evidence packets;
- organization-specific rules;
- high-volume anchoring.

Initial revenue should combine subscriptions and usage. Pure microbilling is a scale-stage model, not the launch model.

## 9. Product gates

No public promise is considered production-ready before all required gates pass.

### Protocol gate

- normative scope and invariants;
- schemas;
- canonicalization vectors;
- independent verifier compatibility.

### Demonstration gate

- pending refund;
- verified refund;
- reversed or contradicted refund;
- human-readable packet matching machine evidence.

### Developer gate

- Node SDK;
- Python SDK;
- MCP and HTTP examples;
- five-minute integration path.

### Service gate

- secure key handling;
- retention policy;
- privacy review;
- recovery and rotation;
- availability and incident procedures.

### Commercial gate

- self-service onboarding;
- transparent pricing;
- usage limits;
- legal terms;
- no unsupported compliance or certification claims.

## 10. Drift controls

The project must reject these recurring drifts:

- turning TimeProofs into generic observability;
- storing verdicts as immutable evidence;
- presenting self-claims as verified outcomes;
- centralizing all runtime traffic before adoption requires it;
- inventing proprietary cryptography;
- expanding into identity, payment, authorization, and insurance simultaneously;
- building dashboards before interoperability tests pass.
