# Outcome Event Vocabulary v0.1

Status: EXPERIMENTAL SKELETON

## 1. Universal lifecycle phases

| Phase | Meaning |
|---|---|
| `INTENT` | A requested objective or desired effect was recorded. |
| `AUTHORIZATION` | Permission, mandate, or policy approval was recorded. |
| `DISPATCH` | A request was sent toward a receiving system. |
| `ACCEPTANCE` | A receiver accepted or rejected responsibility for processing. |
| `EFFECT` | A business object or externally observable effect was created or changed. |
| `SETTLEMENT` | A result requiring finalization, transfer, or clearing was completed or failed. |
| `TERMINATION` | The action reached cancellation, expiry, reversal, or another terminal state. |

Phases do not imply success.

## 2. Event statuses

- `PENDING`
- `SUCCEEDED`
- `FAILED`
- `PARTIAL`
- `CANCELLED`
- `REVERSED`
- `EXPIRED`

## 3. Source classes

- `SELF_CLAIMED`
- `GATEWAY_OBSERVED`
- `RECEIVER_ATTESTED`
- `SYSTEM_OF_RECORD`
- `INDEPENDENTLY_SETTLED`

## 4. Event type naming

Event types MUST use lower-case namespaced tokens.

Recommended form:

```text
<domain>.<resource>.<event>
```

Examples:

```text
commerce.refund.requested
commerce.refund.accepted
commerce.refund.created
commerce.refund.settled
commerce.refund.reversed
messaging.email.accepted
calendar.event.created
```

Event types describe observations, not verdicts.

## 5. Initial refund vocabulary

| Event type | Typical phase | Meaning |
|---|---|---|
| `commerce.refund.requested` | `INTENT` | A refund request was recorded. |
| `commerce.refund.dispatched` | `DISPATCH` | A refund request was sent to a receiver. |
| `commerce.refund.accepted` | `ACCEPTANCE` | A receiver accepted the request for processing. |
| `commerce.refund.created` | `EFFECT` | A refund object was created in a system of record. |
| `commerce.refund.settled` | `SETTLEMENT` | Funds were confirmed as settled by an appropriate system. |
| `commerce.refund.reversed` | `TERMINATION` | A previously created or settled refund was reversed. |

A `commerce.refund.created` event MUST NOT be interpreted as settlement.
