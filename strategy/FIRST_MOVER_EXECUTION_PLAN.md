# TimeProofs Build-First Execution Plan

Status: ACTIVE
Date: 2026-07-23

## Strategic reality

The broad category of agent outcome verification is already emerging. TimeProofs must not claim to be the first generic product that checks whether an agent action completed.

The defensible position is narrower:

> An open, portable, multi-issuer evidence protocol where immutable evidence and recalculable outcome evaluations remain separate.

TimeProofs competes by becoming the interoperability layer and reference implementation, not by copying a closed completion-control dashboard.

## First shippable product

**TimeProofs Relay** — an open-source local/VPC service that turns agent claims and authenticated system-of-record events into versioned Evidence Bundles and current outcome evaluations.

### Inputs

- agent action claim;
- generic HTTP response or webhook;
- provider-authenticated webhook;
- later reversal, cancellation, failure, or settlement event.

### Outputs

- immutable Evidence Bundle revision;
- structural verification result;
- separately versioned outcome evaluation;
- current action state;
- missing-evidence explanation;
- portable machine and human Evidence Packet.

## First wedge

Stripe refund lifecycle in test mode.

The wedge is not “another Stripe status checker.” It demonstrates:

- asynchronous finality;
- provider-authenticated evidence;
- pending versus settled;
- later failure or cancellation;
- append-only evidence revisions;
- verdict recalculation without rewriting prior evidence.

## Build sequence

1. Stripe webhook signature verification and event normalization.
2. Generic bundle builder and relay signing path.
3. Local file-backed append-only action store.
4. HTTP API for claims, webhooks, current outcome, bundle, and packet.
5. Docker/local five-minute quick start.
6. Hosted sandbox with test keys only.
7. MCP write-action wrapper that checks current outcome before an agent says “done.”

## Deliberate non-scope

- enterprise dashboard;
- broad connector catalog;
- production payment credentials;
- identity, authorization, insurance, or payment processing;
- unsupported compliance or legal claims;
- large-scale sales motion before the relay is runnable.

## Speed rule

External feedback remains useful but no longer blocks implementation. Every build milestone must produce a runnable artifact, tests, and a public demonstration.
