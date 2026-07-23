# TimeProofs Verdict Rules v0.1

Status: EXPERIMENTAL AND NON-NORMATIVE FOR THE CORE PROTOCOL

## 1. Verdicts

- `VERIFIED`
- `PENDING`
- `CONTRADICTED`
- `UNPROVABLE`

Verdicts are generated outputs and are not stored as immutable bundle facts.

## 2. Refund ruleset `refund-v0.1`

### VERIFIED

A refund is `VERIFIED` when:

- a `commerce.refund.settled` event has status `SUCCEEDED`;
- its source class is `SYSTEM_OF_RECORD` or `INDEPENDENTLY_SETTLED`;
- a valid proof from that event issuer covers the event;
- no qualifying reversal or contradictory settlement failure is present.

### PENDING

A refund is `PENDING` when a qualifying signed source establishes `commerce.refund.created`, but no qualifying settlement event exists.

A receiver acceptance without settlement may also produce `PENDING`, but it is weaker than a created refund object.

### CONTRADICTED

A refund is `CONTRADICTED` when:

- a qualifying reversal follows creation or settlement; or
- qualifying strong sources contain both successful and failed settlement assertions without a supersession rule resolving them.

### UNPROVABLE

A refund is `UNPROVABLE` when:

- the bundle is invalid;
- no sufficient strong signed source exists;
- only self-claimed or gateway-observed assertions exist;
- the ruleset is unsupported.
