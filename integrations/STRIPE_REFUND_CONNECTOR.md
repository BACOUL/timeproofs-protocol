# Stripe Refund Connector v0.1

Status: IMPLEMENTED FOUNDATION — TEST FIXTURES ONLY

## Product role

The Stripe connector is the first real system-of-record adapter for TimeProofs Relay. It converts authenticated Stripe refund webhook events into portable TimeProofs Outcome Events and Evidence Items.

It does not create refunds, move money, or replace Stripe. It observes Stripe refund lifecycle events and preserves exactly what the provider event supports.

## Supported upstream events

- `refund.created`
- `refund.updated`
- `refund.failed`

## Status mapping

| Stripe event / refund status | TimeProofs events |
|---|---|
| `refund.created` + `pending` or `requires_action` | `commerce.refund.created` + `commerce.refund.settlement_pending` |
| `refund.updated` + `pending` or `requires_action` | `commerce.refund.settlement_pending` |
| `refund.created` or `refund.updated` + `succeeded` | `commerce.refund.created` when applicable + `commerce.refund.settled` |
| `refund.failed` or status `failed` | `commerce.refund.settlement_failed` |
| status `canceled` | `commerce.refund.cancelled` |

The connector never maps object creation alone to final settlement.

## Trust boundary

Stripe webhook authenticity is checked against the raw request body, the `Stripe-Signature` header, and the endpoint secret. The normalized TimeProofs event is then intended to be signed by the operator-controlled TimeProofs Relay key.

This creates two distinct claims:

1. the relay verified an authenticated Stripe webhook delivery;
2. the relay normalized that delivery into registered TimeProofs outcome semantics.

The connector does not claim that Stripe signed the normalized TimeProofs event with a publicly verifiable Stripe key.

## Current package

```text
@timeproofs/stripe-connector
```

Exports:

- `parseStripeSignatureHeader()`
- `verifyStripeWebhookSignature()`
- `normalizeStripeRefundEvent()`
- `StripeConnectorError`

## Example

```js
import {
  normalizeStripeRefundEvent,
  verifyStripeWebhookSignature
} from '@timeproofs/stripe-connector';

const verification = verifyStripeWebhookSignature({
  rawBody,
  signatureHeader: request.headers['stripe-signature'],
  endpointSecret: process.env.STRIPE_WEBHOOK_SECRET
});

const stripeEvent = JSON.parse(rawBody);
const observation = normalizeStripeRefundEvent(stripeEvent, {
  relayIssuerRef: 'relay.example',
  signatureVerification: verification
});
```

`observation.events`, `observation.evidence`, and `observation.relationships` can be inserted into an Evidence Bundle and signed by the relay.

## Implemented acceptance evidence

- valid Stripe HMAC webhook signature accepted;
- changed raw payload rejected;
- pending refund maps to a structurally valid `PENDING` bundle;
- succeeded refund maps to a structurally valid `VERIFIED` bundle;
- failed refund maps to a structurally valid `CONTRADICTED` bundle.

## Next implementation step

Build TimeProofs Relay as a runnable local/VPC HTTP service that:

1. receives an agent completion claim;
2. receives authenticated provider webhooks;
3. appends evidence as bundle revisions;
4. signs normalized observations;
5. returns the current recalculable verdict and portable Evidence Packet.
