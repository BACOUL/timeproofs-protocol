# Next Action

Generated from `governance/project-state.json`. Do not edit manually.

## TP-BUILD-002 — Package and exercise TimeProofs Relay with Stripe test mode

- Workstream: `WS03_PRODUCT`
- Phase: `P3`
- Milestone: `P3-M2`

## Purpose

Turn the runnable local Relay into a five-minute developer artifact and prove its end-to-end behavior against Stripe test-mode webhook delivery without live money movement.

## Acceptance criteria

- The Relay starts through the documented npm command and a reproducible container image with persistent local storage.
- A fresh installation creates an operator-controlled Ed25519 key with private-file permissions and preserves it across restarts.
- Stripe CLI can forward authenticated test-mode refund events to the Relay without modifying the raw request body.
- One walkthrough records an agent claim, progresses through PENDING, and reaches VERIFIED or CONTRADICTED from later Stripe evidence.
- Every revision remains available, links to its immediate predecessor payload digest, and survives a Relay restart.
- The current endpoint and portable packet expose structural status, verdict, reasons, decisive events, and missing evidence.
- Replay, duplicate delivery, invalid signature, stale signature, unknown correlation, and rollback behavior are documented and tested.
- npm ci, all protocol and Relay tests, conformance, site validation, and governance validation pass.

## Explicit non-scope

- Production Stripe credentials or live money movement
- Hosted multi-tenant service
- Enterprise dashboard
- Shopify and additional connector breadth
- Identity, authorization, insurance, or payment processing
- Production, compliance, certification, or legal-validity claims

## Completion procedure

1. Implement only the approved scope.
2. Add tests and acceptance evidence.
3. Review decisions, risks, assumptions, competitors, compatibility, security, privacy, site, business, and operations impacts.
4. Update `governance/project-state.json` when milestone state changes.
5. Run `npm run project:generate`, `npm test`, and `npm run project:validate`.
