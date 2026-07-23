# Roadmap

## Milestone 0 — Repository foundation

Status: IN PROGRESS

- repository structure;
- product authority;
- protocol boundaries;
- CI and reference tests;
- refund demonstration fixtures.

Exit criterion: `npm test` passes from a clean checkout.

## Milestone 1 — Evidence Bundle v0.1

- normative abstract model;
- `TP-JSON-0.1` profile;
- complete JSON Schemas;
- digest and signature rules;
- structural verification algorithm;
- at least 3 valid and 5 invalid vectors.

Exit criterion: a second independent implementation reproduces canonical bytes and verification outcomes.

## Milestone 2 — Outcome Event vocabulary v0.1

- universal phases;
- status registry;
- evidence source classes;
- domain namespace rules;
- refund vocabulary.

Exit criterion: refund lifecycle can be represented without private fields or ambiguous state names.

## Milestone 3 — Refund outcome assurance demo

- pending, verified, contradicted, and unprovable scenarios;
- human Evidence Packet;
- machine-verifiable bundles;
- public static demo.

Exit criterion: a non-technical reviewer correctly distinguishes “initiated” from “settled”.

## Milestone 4 — Receiver SDK

- Node middleware;
- Python middleware;
- HTTP and MCP wrappers;
- local signing and evidence references.

Exit criterion: a developer instruments a write action in under ten minutes.

## Milestone 5 — Managed verification service

- issuer registry;
- key rotation;
- retention;
- re-verification;
- audit exports;
- usage billing.

Exit criterion: first paying external user retains and verifies real outcome bundles.

## Milestone 6 — Multi-protocol evidence bridge

- ACP mapping;
- UCP mapping;
- AP2 mapping;
- generic webhook and system-of-record connectors.

Exit criterion: one action dossier contains evidence from at least three independent protocol sources.
