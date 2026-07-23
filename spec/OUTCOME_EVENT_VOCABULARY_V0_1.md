# TimeProofs Outcome Event Vocabulary v0.1

Status: EXPERIMENTAL NORMATIVE REGISTRY VIEW
Profile: `TP-JSON-0.1`
Generated from: `spec/outcome-event-vocabulary-v0.1.json`

The JSON registry is the machine-readable authority. This document defines structural event semantics, not business verdict sufficiency. The key words **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are normative when uppercase.

## Core invariants

1. An Outcome Event records one observation or claim. It is not an overall action verdict.
2. `phase`, `event_type`, and `status` are separate dimensions and MUST NOT be collapsed.
3. A source class describes provenance. It does not automatically establish truth or sufficiency.
4. A self-claimed external outcome MAY be represented and signed. Domain rules MUST NOT treat it as verified solely because it is structurally valid.
5. Registered event types MUST use their registered phase and allowed status set.
6. Later cancellation, failure, expiry, reversal, or contradiction MUST be represented as new events.

## Universal lifecycle phases

| Phase | Normative meaning | Structurally allowed statuses |
|---|---|---|
| `INTENT` | A requested objective or desired effect was recorded. It does not prove dispatch or execution. | `PENDING`, `SUCCEEDED`, `FAILED` |
| `AUTHORIZATION` | A mandate, permission, or policy decision relevant to the action was recorded. It does not prove dispatch or execution. | `PENDING`, `SUCCEEDED`, `FAILED` |
| `DISPATCH` | A request was submitted toward a receiving system. It does not prove receiver acceptance or business effect. | `PENDING`, `SUCCEEDED`, `FAILED` |
| `ACCEPTANCE` | A receiver accepted, rejected, or partially accepted responsibility for processing. It does not prove the requested business effect. | `PENDING`, `SUCCEEDED`, `FAILED`, `PARTIAL` |
| `EFFECT` | A business object or externally observable system effect was created, changed, or failed. It does not necessarily prove final settlement. | `PENDING`, `SUCCEEDED`, `FAILED`, `PARTIAL` |
| `SETTLEMENT` | A result requiring finalization, delivery, clearing, or equivalent completion was observed. | `PENDING`, `SUCCEEDED`, `FAILED`, `PARTIAL` |
| `TERMINATION` | A lifecycle ended through cancellation, reversal, expiry, terminal success, or terminal failure. | `SUCCEEDED`, `FAILED`, `CANCELLED`, `REVERSED`, `EXPIRED` |

## Event statuses

The status applies only to the event-specific observation. `SUCCEEDED` MUST NOT be interpreted as success of the complete action lifecycle.

| Status | Normative meaning | Terminal status class |
|---|---|---|
| `PENDING` | The event-specific operation has started or is awaiting a later state. | no |
| `SUCCEEDED` | The event-specific observation occurred successfully. It does not make the complete action successful. | no |
| `FAILED` | The event-specific operation failed or was rejected. | no |
| `PARTIAL` | Only part of the event-specific operation succeeded or was accepted. | no |
| `CANCELLED` | The action or relevant business object was cancelled. | yes |
| `REVERSED` | A previously observed effect or settlement was reversed. | yes |
| `EXPIRED` | The action, mandate, request, or business object expired before completion. | yes |

## Evidence source classes

`qualifying_source_classes` in a registered event entry describes sources that a domain ruleset may accept as sufficient. It is not a structural allow-list. In particular, `SELF_CLAIMED` remains representable for any phase so that unsupported claims can be preserved and evaluated as insufficient.

| Source class | Normative meaning | Structurally meaningful phases |
|---|---|---|
| `SELF_CLAIMED` | The acting agent or originating application states the claim. It cannot alone establish an external effect. | `INTENT`, `AUTHORIZATION`, `DISPATCH`, `ACCEPTANCE`, `EFFECT`, `SETTLEMENT`, `TERMINATION` |
| `GATEWAY_OBSERVED` | A middleware, proxy, or transport component observed the request or response crossing its boundary. | `INTENT`, `AUTHORIZATION`, `DISPATCH`, `ACCEPTANCE`, `EFFECT`, `SETTLEMENT`, `TERMINATION` |
| `RECEIVER_ATTESTED` | The receiving service attests what it accepted, rejected, or observed at its boundary. | `AUTHORIZATION`, `DISPATCH`, `ACCEPTANCE`, `EFFECT`, `SETTLEMENT`, `TERMINATION` |
| `SYSTEM_OF_RECORD` | A system treated by the applicable ruleset as authoritative for the specific business claim. | `AUTHORIZATION`, `ACCEPTANCE`, `EFFECT`, `SETTLEMENT`, `TERMINATION` |
| `INDEPENDENTLY_SETTLED` | An independent finalization, clearing, delivery, or settlement system attests the result. | `SETTLEMENT`, `TERMINATION` |

## Event type registration and extensions

TimeProofs base event types MUST use lower-case dot-separated tokens in the form:

`<domain>.<resource>.<event>`

The namespaces `commerce.refund`, `messaging.email`, `calendar.appointment`, `org.timeproofs` are reserved. An unregistered type MUST NOT appear within a reserved namespace.

Third-party types MUST use a collision-resistant extension form beginning with `x.`, for example:

`x.com.example.workflow.task.completed`

An extension event remains subject to universal phase, status, source-phase, digest, signature, and relationship rules. Registration does not imply that TimeProofs endorses the issuer or considers the event sufficient for a verdict.

## Relationship semantics

Relationship direction is normative.

| Relationship | Allowed source kinds | Allowed target kinds | Meaning |
|---|---|---|---|
| `SUPPORTS` | `evidence`, `event` | `event` | The source object supplies evidence supporting the target event. |
| `CONTRADICTS` | `evidence`, `event` | `evidence`, `event` | The source object presents a claim incompatible with the target object. |
| `SUPERSEDES` | `event` | `event` | The source event replaces the target event without erasing it. |
| `REVERSES` | `event` | `event` | The source event reverses an effect represented by the target event. |
| `CORRESPONDS_TO` | `event`, `evidence`, `issuer` | `event`, `evidence`, `issuer` | The objects refer to the same external business entity or transaction without asserting support or causality. |

## Refund profile

| Event type | Phase | Allowed statuses | Sources that may qualify under domain rules | Meaning |
|---|---|---|---|---|
| `commerce.refund.requested` | `INTENT` | `SUCCEEDED` | `SELF_CLAIMED`, `GATEWAY_OBSERVED` | A refund request was recorded. |
| `commerce.refund.authorized` | `AUTHORIZATION` | `SUCCEEDED` | `GATEWAY_OBSERVED`, `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | A refund mandate or authorization was approved. |
| `commerce.refund.authorization_failed` | `AUTHORIZATION` | `FAILED` | `GATEWAY_OBSERVED`, `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | Refund authorization failed or was denied. |
| `commerce.refund.dispatched` | `DISPATCH` | `SUCCEEDED` | `GATEWAY_OBSERVED`, `RECEIVER_ATTESTED` | A refund request was sent toward the receiver. |
| `commerce.refund.dispatch_failed` | `DISPATCH` | `FAILED` | `GATEWAY_OBSERVED`, `RECEIVER_ATTESTED` | Dispatch of the refund request failed. |
| `commerce.refund.accepted` | `ACCEPTANCE` | `SUCCEEDED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | The receiver accepted responsibility for processing the refund. |
| `commerce.refund.rejected` | `ACCEPTANCE` | `FAILED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | The receiver rejected the refund request. |
| `commerce.refund.created` | `EFFECT` | `SUCCEEDED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | A refund business object was created. This is not settlement. |
| `commerce.refund.creation_failed` | `EFFECT` | `FAILED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | Creation of the refund business object failed. |
| `commerce.refund.settlement_pending` | `SETTLEMENT` | `PENDING` | `SYSTEM_OF_RECORD`, `INDEPENDENTLY_SETTLED` | Settlement has been initiated but is not final. |
| `commerce.refund.settled` | `SETTLEMENT` | `SUCCEEDED` | `SYSTEM_OF_RECORD`, `INDEPENDENTLY_SETTLED` | Refund settlement was confirmed by an appropriate source. |
| `commerce.refund.settlement_failed` | `SETTLEMENT` | `FAILED` | `SYSTEM_OF_RECORD`, `INDEPENDENTLY_SETTLED` | Refund settlement failed. |
| `commerce.refund.cancelled` | `TERMINATION` | `CANCELLED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | The refund lifecycle was cancelled before final settlement. |
| `commerce.refund.expired` | `TERMINATION` | `EXPIRED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | The refund request or authorization expired. |
| `commerce.refund.reversed` | `TERMINATION` | `REVERSED` | `SYSTEM_OF_RECORD`, `INDEPENDENTLY_SETTLED` | A previously created or settled refund was reversed. |

## Email profile

| Event type | Phase | Allowed statuses | Sources that may qualify under domain rules | Meaning |
|---|---|---|---|---|
| `messaging.email.requested` | `INTENT` | `SUCCEEDED` | `SELF_CLAIMED`, `GATEWAY_OBSERVED` | An instruction to send an email was recorded. |
| `messaging.email.dispatched` | `DISPATCH` | `SUCCEEDED` | `GATEWAY_OBSERVED`, `RECEIVER_ATTESTED` | The email submission was sent toward a receiving mail service. |
| `messaging.email.dispatch_failed` | `DISPATCH` | `FAILED` | `GATEWAY_OBSERVED`, `RECEIVER_ATTESTED` | Email dispatch failed. |
| `messaging.email.accepted` | `ACCEPTANCE` | `SUCCEEDED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | A receiving mail service accepted the message for processing. |
| `messaging.email.rejected` | `ACCEPTANCE` | `FAILED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | A receiving mail service rejected the message. |
| `messaging.email.recorded` | `EFFECT` | `SUCCEEDED` | `SYSTEM_OF_RECORD` | The message was recorded in the sender or provider system of record. |
| `messaging.email.delivery_pending` | `SETTLEMENT` | `PENDING` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | Final delivery is pending. |
| `messaging.email.delivered` | `SETTLEMENT` | `SUCCEEDED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | Delivery was confirmed by an appropriate mail system. |
| `messaging.email.delivery_failed` | `SETTLEMENT` | `FAILED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | Final delivery failed. |
| `messaging.email.cancelled` | `TERMINATION` | `CANCELLED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | The send operation was cancelled before completion. |
| `messaging.email.recalled` | `TERMINATION` | `REVERSED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | A previously recorded or delivered email was recalled or reversed where supported. |

## Appointment profile

| Event type | Phase | Allowed statuses | Sources that may qualify under domain rules | Meaning |
|---|---|---|---|---|
| `calendar.appointment.requested` | `INTENT` | `SUCCEEDED` | `SELF_CLAIMED`, `GATEWAY_OBSERVED` | An instruction to create an appointment was recorded. |
| `calendar.appointment.dispatched` | `DISPATCH` | `SUCCEEDED` | `GATEWAY_OBSERVED`, `RECEIVER_ATTESTED` | The appointment request was sent toward a calendar or booking service. |
| `calendar.appointment.dispatch_failed` | `DISPATCH` | `FAILED` | `GATEWAY_OBSERVED`, `RECEIVER_ATTESTED` | Appointment request dispatch failed. |
| `calendar.appointment.accepted` | `ACCEPTANCE` | `SUCCEEDED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | The receiving calendar or booking service accepted processing responsibility. |
| `calendar.appointment.rejected` | `ACCEPTANCE` | `FAILED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | The receiving service rejected the appointment request. |
| `calendar.appointment.created` | `EFFECT` | `SUCCEEDED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | An appointment object was created in a system of record. |
| `calendar.appointment.creation_failed` | `EFFECT` | `FAILED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | Appointment creation failed. |
| `calendar.appointment.confirmation_pending` | `SETTLEMENT` | `PENDING` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | Final appointment confirmation is pending. |
| `calendar.appointment.confirmed` | `SETTLEMENT` | `SUCCEEDED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | The appointment was confirmed by an appropriate system. |
| `calendar.appointment.cancelled` | `TERMINATION` | `CANCELLED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | The appointment was cancelled. |
| `calendar.appointment.expired` | `TERMINATION` | `EXPIRED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | The appointment hold or request expired. |
| `calendar.appointment.rescheduled` | `EFFECT` | `SUCCEEDED` | `RECEIVER_ATTESTED`, `SYSTEM_OF_RECORD` | The appointment time or resource was changed in the system of record. |

## Invalid semantic combinations

A verifier MUST reject at least the following:

- a non-terminal phase using `CANCELLED`, `REVERSED`, or `EXPIRED`;
- a registered type with a different phase;
- a registered type with a status outside its registered status set;
- `INDEPENDENTLY_SETTLED` used outside `SETTLEMENT` or `TERMINATION`;
- an unknown type under a reserved namespace;
- an unregistered third-party type without the `x.<reverse-dns>...` form;
- a relationship whose endpoint kinds violate the registered relationship direction.

## Important domain distinction

`commerce.refund.created` records creation of a refund business object. It MUST NOT be interpreted as `commerce.refund.settled`. Likewise, mail acceptance is not delivery, and appointment creation is not necessarily final confirmation.
