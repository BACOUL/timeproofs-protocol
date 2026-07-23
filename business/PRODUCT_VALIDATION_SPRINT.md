# Product Validation Sprint — Outcome Evidence Packet

Status: ACTIVE  
Owner: TimeProofs  
Version: 0.1  
Date: 2026-07-23

## Objective

Validate that TimeProofs solves a problem people understand and value before expanding the protocol or managed infrastructure.

The sprint tests three separate questions:

1. **Comprehension:** can a non-technical person distinguish PENDING, VERIFIED, CONTRADICTED, and UNPROVABLE?
2. **Integration value:** does a developer or product owner want the packet or verdict in their agent workflow?
3. **Commercial value:** would an organization pay for retention, re-verification, connectors, or dispute-ready packets?

## Assets

- interactive refund demonstration under `site/`;
- four machine-derived printable packets under `site/packets/`;
- anonymous local comprehension test in `site/index.html#validate`;
- result analyzer under `scripts/analyze-comprehension-results.mjs`;
- machine evidence and verdicts shared by the demo and packets.

## Experiment V-001 — Comprehension

Target: 10 independent participants who have not received a technical explanation first.

Pass signal:

- at least 8 of 10 score 3/3;
- no participant interprets a valid signature as universal truth;
- participants can explain why a created refund is not a settled refund.

Failure response:

- revise labels, timeline, missing-evidence copy, or packet hierarchy;
- do not weaken the underlying verdict semantics merely to improve the score.

## Experiment V-002 — Integration demand

Target: 5 developers, product owners, compliance practitioners, or operators of agentic workflows.

Ask only:

1. Where could an AI currently say “done” before the result is final?
2. What system is authoritative for the final result?
3. Would a machine verdict plus human packet reduce support, audit, dispute, or trust cost?
4. Would you install middleware, consume a webhook connector, or rely on a platform integration?
5. What would block a sandbox trial?

Pass signal:

- at least 2 participants identify a concrete workflow and agree to evaluate a sandbox integration;
- the desired integration can become a reusable connector, not bespoke consulting.

## Experiment V-003 — Willingness to pay

Test paid value, not protocol syntax.

Present three value units without publishing final prices:

- retained and re-verifiable evidence;
- system-of-record connectors and contradiction alerts;
- dispute/audit-ready Evidence Packets.

Pass signal:

- at least 2 qualified participants assign budget or an explicit price range;
- at least one value unit is considered materially more valuable than ordinary logs.

## Evidence rules

- do not invent participants, customers, logos, testimonials, or scores;
- store only anonymous result JSON unless explicit consent exists;
- record negative feedback and failed experiments;
- distinguish interest from trial commitment and trial commitment from payment;
- update assumptions, risks, positioning, and roadmap after the sprint.

## Decision after the sprint

Choose exactly one:

- **PROCEED:** build the first real Stripe or equivalent sandbox connector;
- **REFINE:** revise the packet or wedge and rerun the test;
- **NARROW:** focus on a more urgent action domain;
- **STOP:** evidence does not support continued investment.
