# Change Control

## Purpose

TimeProofs operates in a fast-moving market. New protocols, competitors, laws, and ideas will appear frequently. Change control prevents every new signal from causing a product pivot.

## Change request template

Every material proposed change must record:

1. problem or external signal;
2. evidence and source date;
3. affected workstreams;
4. strategic fit with the mission;
5. user value and buyer urgency;
6. differentiation and competitive effect;
7. implementation and operational cost;
8. privacy, security, legal, and standards impact;
9. revenue or adoption hypothesis;
10. effect on the unique next action;
11. reversible experiment or migration path;
12. decision: ACCEPT, DEFER, REJECT, or WATCH.

## Priority test

A change may replace the current next action only when at least one condition is true:

- a critical security or privacy issue exists;
- an upstream breaking change blocks current work;
- decisive external evidence invalidates a core assumption;
- a time-limited distribution or standards opportunity is materially more valuable;
- the current task can no longer meet its acceptance criteria.

## Anti-drift questions

Before accepting a change, answer:

- Does this improve outcome evidence or assurance?
- Can an existing protocol or provider own this layer better?
- Is it required for the initial wedge or only attractive in theory?
- Does it introduce an enterprise service burden incompatible with the current stage?
- Does it require TimeProofs to become identity, payment, authorization, insurance, or generic observability?
- Is the advantage durable, or a feature competitors can copy immediately?
- What evidence will prove or disprove the change quickly?

## CR-001 — Advance product validation before full Python implementation

Date: 2026-07-23
Decision: **ACCEPT**

1. **Problem or signal:** the technical foundation is strong, while adoption, comprehension, integration demand, and willingness to pay remain almost entirely unvalidated.
2. **Affected workstreams:** WS02, WS03, WS07, WS12, WS16, WS17.
3. **Strategic fit:** directly tests whether Outcome Assurance solves a valuable problem without changing the mission or product boundary.
4. **User value:** validates that people understand request versus real outcome and want the result in an agent workflow.
5. **Differentiation:** tests the system-of-record evidence and recalculable-verdict position rather than competing on receipt syntax alone.
6. **Cost:** limited to a static preview, generated Evidence Packets, anonymous comprehension test, and structured interviews.
7. **Risk impact:** reduces R-004, while G1 remains explicitly incomplete.
8. **Revenue hypothesis:** retention, re-verification, connectors, contradiction alerts, and dispute/audit packets may carry paid value.
9. **Effect on next action:** TP-PROTO-004 is paused, not cancelled. TP-MARKET-001 becomes the unique next action.
10. **Reversible path:** if the packet is unclear or demand is weak, refine or stop before cloud and connector investment.
