# Next Action

Generated from `governance/project-state.json`. Do not edit manually.

## TP-BUILD-001 — Ship the first runnable TimeProofs Relay with Stripe refund evidence

- Workstream: `WS03_PRODUCT`
- Phase: `P3`
- Milestone: `P3-M1`

## Purpose

Turn the existing protocol and refund demonstration into a runnable local/VPC product that receives agent claims and authenticated Stripe refund webhooks, preserves append-only evidence revisions, and exposes a current recalculable outcome.

## Acceptance criteria

- The Stripe connector verifies the raw webhook signature and rejects changed or stale payloads.
- Stripe refund created, pending, succeeded, failed, and cancelled states map to registered TimeProofs event semantics without treating object creation as settlement.
- A runnable Relay accepts an action claim and later provider observations through documented HTTP endpoints.
- The Relay stores append-only Evidence Bundle revisions and links each revision to its predecessor digest.
- The current action endpoint returns structural status, current verdict, reasons, decisive events, and missing evidence without rewriting prior bundles.
- Every normalized provider observation is signed by an operator-controlled Relay key with the upstream authentication method disclosed.
- A local Stripe test-mode walkthrough completes in ten minutes or less and produces a portable Evidence Packet.
- All protocol, connector, service, conformance, site, and governance tests pass.

## Explicit non-scope

- Enterprise dashboard
- Production payment credentials or live money movement
- Shopify and additional connector breadth
- Identity, authorization, insurance, or payment processing
- Final pricing and billing
- Production, compliance, certification, or legal-validity claims

## Completion procedure

1. Implement only the approved scope.
2. Add tests and acceptance evidence.
3. Review decisions, risks, assumptions, competitors, compatibility, security, privacy, site, business, and operations impacts.
4. Update `governance/project-state.json` when milestone state changes.
5. Run `npm run project:generate`, `npm test`, and `npm run project:validate`.
