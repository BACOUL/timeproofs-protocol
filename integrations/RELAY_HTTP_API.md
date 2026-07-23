# TimeProofs Relay HTTP API v0.1

Status: RUNNABLE LOCAL ALPHA

TimeProofs Relay is a local/VPC reference service. It records an agent claim, ingests authenticated provider observations, writes append-only Evidence Bundle revisions, signs normalized evidence with an operator-controlled Ed25519 key, and exposes the current recalculable outcome.

## Start

```bash
npm ci
STRIPE_WEBHOOK_SECRET=whsec_... npm run relay:start
```

Defaults:

- address: `127.0.0.1:8787`;
- data directory: `.timeproofs-relay/`;
- generated key: `.timeproofs-relay/keys/relay-ed25519.json` with mode `0600`;
- no external database;
- no analytics or outbound network call.

Environment:

| Variable | Purpose |
|---|---|
| `HOST` | Listen address, default `127.0.0.1`; container uses `0.0.0.0` |
| `PORT` | Local listen port, default `8787` |
| `TIMEPROOFS_RELAY_DATA_DIR` | Append-only local storage directory |
| `TIMEPROOFS_RELAY_ISSUER` | Relay issuer URN |
| `STRIPE_WEBHOOK_SECRET` | Stripe test-mode webhook endpoint secret |

## Container quick start

```bash
export STRIPE_WEBHOOK_SECRET=whsec_...
docker compose up --build
```

The container listens on port `8787` and persists the Relay key, action metadata, and append-only bundle revisions in the named `timeproofs-relay-data` volume. Restarting the container reuses the same issuer key and current action history.

No production Stripe API key is accepted or required. The only Stripe secret used by this alpha is the test-mode webhook endpoint secret.

## Endpoints

### `POST /v1/actions`

Creates revision 1 from an agent claim.

```json
{
  "action_id": "refund-action-001",
  "ruleset": "refund-v0.1",
  "actor": {
    "entity_type": "AI_AGENT",
    "entity_id": "agent-demo"
  },
  "subject": {
    "entity_type": "REFUND",
    "entity_id": "re_123"
  },
  "claim": {
    "statement": "Refund requested"
  },
  "correlations": {
    "stripe_refund_id": "re_123"
  }
}
```

The initial claim remains `SELF_CLAIMED`. The Relay signature proves that the Relay recorded the claim; it does not transform it into provider evidence.

### `POST /v1/webhooks/stripe`

Accepts the untouched Stripe request body and `Stripe-Signature` header. The refund ID must already be linked through `correlations.stripe_refund_id`.

The Relay:

1. verifies the Stripe HMAC signature and age;
2. rejects changed or stale payloads;
3. deduplicates the Stripe event ID;
4. normalizes refund lifecycle semantics;
5. appends a new bundle revision linked to the prior payload digest;
6. signs the new evidence and events;
7. recalculates the current outcome.

### Read endpoints

- `GET /healthz`
- `GET /v1/issuer`
- `GET /v1/actions/{action_id}`
- `GET /v1/actions/{action_id}/bundle`
- `GET /v1/actions/{action_id}/packet`
- `GET /v1/actions/{action_id}/revisions`

## Outcome progression

```text
agent claim only                → UNPROVABLE
Stripe refund created/pending   → PENDING
Stripe refund succeeded         → VERIFIED
Stripe refund failed/cancelled  → CONTRADICTED
```

## Security boundary

This alpha is not a production payment service. It does not create refunds or move money. Provider authentication and Relay signing are distinct facts and remain separately disclosed in the bundle extensions.
