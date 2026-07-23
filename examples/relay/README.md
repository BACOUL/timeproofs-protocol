# TimeProofs Relay local quick start

Start the local service:

```bash
npm ci
STRIPE_WEBHOOK_SECRET=whsec_test_only npm run relay:start
```

Create an action claim:

```bash
curl -sS http://127.0.0.1:8787/v1/actions \
  -H 'content-type: application/json' \
  --data-binary @examples/relay/create-action.json
```

Read the current outcome:

```bash
curl -sS http://127.0.0.1:8787/v1/actions/refund-action-001
```

For a real Stripe test-mode walkthrough, configure Stripe CLI forwarding to:

```text
http://127.0.0.1:8787/v1/webhooks/stripe
```

Use the webhook signing secret printed by Stripe CLI as `STRIPE_WEBHOOK_SECRET`. No live-money credential is required or supported by this alpha.


## Docker

```bash
export STRIPE_WEBHOOK_SECRET=whsec_test_only
docker compose up --build
```

The named volume preserves the Relay Ed25519 key and all append-only bundle revisions across container restarts.

Check readiness:

```bash
curl -sS http://127.0.0.1:8787/healthz
```
