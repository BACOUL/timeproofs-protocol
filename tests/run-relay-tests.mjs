import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { calculatePayloadDigest, verifyBundle } from '../packages/core/src/index.mjs';
import { createRelayHttpServer, createRelayService } from '../packages/relay/src/index.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
let passed = 0;

async function test(name, callback) {
  try {
    await callback();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

async function fixture(name) {
  return readFile(join(root, 'examples', 'stripe', name), 'utf8');
}

function stripeSignature(rawBody, secret, timestamp) {
  const value = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`, 'utf8').digest('hex');
  return `t=${timestamp},v1=${value}`;
}

async function createTestRelay() {
  const directory = await mkdtemp(join(tmpdir(), 'timeproofs-relay-'));
  let now = new Date('2026-07-23T18:00:00.000Z');
  const secret = 'whsec_relay_test_only';
  const service = await createRelayService({
    dataDirectory: directory,
    issuerId: 'urn:timeproofs:relay:test',
    stripeWebhookSecret: secret,
    clock: () => new Date(now)
  });
  return {
    directory,
    secret,
    service,
    setNow(value) { now = new Date(value); },
    cleanup: () => rm(directory, { recursive: true, force: true })
  };
}

const actionBody = {
  action_id: 'refund-action-001',
  ruleset: 'refund-v0.1',
  actor: { entity_type: 'AI_AGENT', entity_id: 'agent-demo', display_name: 'Demo agent' },
  subject: { entity_type: 'REFUND', entity_id: 're_pending_001', display_name: 'Demo Stripe refund' },
  claim: { requested_amount: '7900', currency: 'eur', statement: 'Refund requested' },
  correlations: { stripe_refund_id: 're_pending_001' }
};

await test('Relay creates a signed self-claimed first revision without upgrading it to proof of completion', async () => {
  const relay = await createTestRelay();
  try {
    const created = await relay.service.createAction(actionBody);
    assert.equal(created.metadata.revision, 1);
    assert.equal(created.current.verdict, 'UNPROVABLE');
    assert.equal(created.bundle.payload.predecessor_bundle_digests.length, 0);
    assert.equal(created.bundle.payload.events[0].source_class, 'SELF_CLAIMED');
    assert.equal(verifyBundle(created.bundle).status, 'VALID');
    assert.equal(created.packet.verdict, 'UNPROVABLE');
  } finally {
    await relay.cleanup();
  }
});

await test('Relay appends authenticated Stripe evidence with a predecessor digest and idempotency', async () => {
  const relay = await createTestRelay();
  try {
    const first = await relay.service.createAction(actionBody);
    const rawPending = await fixture('refund-created-pending.json');
    const pendingEvent = JSON.parse(rawPending);
    relay.setNow(new Date(pendingEvent.created * 1000));
    const pending = await relay.service.ingestStripeWebhook({
      rawBody: rawPending,
      signatureHeader: stripeSignature(rawPending, relay.secret, pendingEvent.created)
    });
    assert.equal(pending.metadata.revision, 2);
    assert.equal(pending.current.verdict, 'PENDING');
    assert.deepEqual(pending.bundle.payload.predecessor_bundle_digests, [calculatePayloadDigest(first.bundle)]);
    assert.equal(verifyBundle(pending.bundle).status, 'VALID');

    const duplicate = await relay.service.ingestStripeWebhook({
      rawBody: rawPending,
      signatureHeader: stripeSignature(rawPending, relay.secret, pendingEvent.created)
    });
    assert.equal(duplicate.duplicate, true);
    assert.equal(duplicate.metadata.revision, 2);

    const rawSucceeded = await fixture('refund-updated-succeeded.json');
    const succeededEvent = JSON.parse(rawSucceeded);
    relay.setNow(new Date(succeededEvent.created * 1000));
    const succeeded = await relay.service.ingestStripeWebhook({
      rawBody: rawSucceeded,
      signatureHeader: stripeSignature(rawSucceeded, relay.secret, succeededEvent.created)
    });
    assert.equal(succeeded.metadata.revision, 3);
    assert.equal(succeeded.current.verdict, 'VERIFIED');
    assert.equal(verifyBundle(succeeded.bundle).status, 'VALID');
    assert.equal((await relay.service.listRevisions(actionBody.action_id)).length, 3);
  } finally {
    await relay.cleanup();
  }
});

await test('Relay rejects stale Stripe signatures without creating a revision', async () => {
  const relay = await createTestRelay();
  try {
    await relay.service.createAction(actionBody);
    const rawPending = await fixture('refund-created-pending.json');
    const pendingEvent = JSON.parse(rawPending);
    relay.setNow(new Date((pendingEvent.created + 301) * 1000));
    await assert.rejects(
      relay.service.ingestStripeWebhook({
        rawBody: rawPending,
        signatureHeader: stripeSignature(rawPending, relay.secret, pendingEvent.created)
      }),
      (error) => error.code === 'STRIPE_SIGNATURE_TOO_OLD' && error.statusCode === 400
    );
    assert.equal((await relay.service.getAction(actionBody.action_id)).metadata.revision, 1);
  } finally {
    await relay.cleanup();
  }
});

await test('Relay exposes health, action, bundle, packet, revisions, and Stripe webhook HTTP endpoints', async () => {
  const relay = await createTestRelay();
  const server = createRelayHttpServer({ service: relay.service });
  try {
    await new Promise((resolvePromise) => server.listen(0, '127.0.0.1', resolvePromise));
    const { port } = server.address();
    const base = `http://127.0.0.1:${port}`;

    assert.equal((await fetch(`${base}/healthz`)).status, 200);
    const invalidJson = await fetch(`${base}/v1/actions`, { method: 'POST', body: '{' });
    assert.equal(invalidJson.status, 400);
    assert.equal((await invalidJson.json()).error.code, 'JSON_INVALID');
    const createResponse = await fetch(`${base}/v1/actions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(actionBody)
    });
    assert.equal(createResponse.status, 201);
    assert.equal((await createResponse.json()).current.verdict, 'UNPROVABLE');

    const rawPending = await fixture('refund-created-pending.json');
    const pendingEvent = JSON.parse(rawPending);
    relay.setNow(new Date(pendingEvent.created * 1000));
    const webhookResponse = await fetch(`${base}/v1/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': stripeSignature(rawPending, relay.secret, pendingEvent.created)
      },
      body: rawPending
    });
    assert.equal(webhookResponse.status, 202);
    assert.equal((await webhookResponse.json()).current.verdict, 'PENDING');

    const encoded = encodeURIComponent(actionBody.action_id);
    assert.equal((await fetch(`${base}/v1/actions/${encoded}`)).status, 200);
    assert.equal((await fetch(`${base}/v1/actions/${encoded}/bundle`)).status, 200);
    assert.equal((await fetch(`${base}/v1/actions/${encoded}/packet`)).status, 200);
    const revisions = await (await fetch(`${base}/v1/actions/${encoded}/revisions`)).json();
    assert.equal(revisions.revisions.length, 2);
  } finally {
    await new Promise((resolvePromise) => server.close(resolvePromise));
    await relay.cleanup();
  }
});


await test('Relay preserves its signing key, current bundle, and revision history across restart', async () => {
  const relay = await createTestRelay();
  try {
    await relay.service.createAction(actionBody);
    const rawPending = await fixture('refund-created-pending.json');
    const pendingEvent = JSON.parse(rawPending);
    relay.setNow(new Date(pendingEvent.created * 1000));
    await relay.service.ingestStripeWebhook({
      rawBody: rawPending,
      signatureHeader: stripeSignature(rawPending, relay.secret, pendingEvent.created)
    });

    const originalIssuer = relay.service.issuer;
    let restartedNow = new Date((pendingEvent.created + 60) * 1000);
    const restarted = await createRelayService({
      dataDirectory: relay.directory,
      issuerId: 'urn:timeproofs:relay:test',
      stripeWebhookSecret: relay.secret,
      clock: () => new Date(restartedNow)
    });
    const restored = await restarted.getAction(actionBody.action_id);
    assert.equal(restarted.issuer.public_key_pem, originalIssuer.public_key_pem);
    assert.equal(restored.metadata.revision, 2);
    assert.equal(restored.current.verdict, 'PENDING');
    assert.equal(verifyBundle(restored.bundle).status, 'VALID');
    assert.equal((await restarted.listRevisions(actionBody.action_id)).length, 2);

    const rawSucceeded = await fixture('refund-updated-succeeded.json');
    const succeededEvent = JSON.parse(rawSucceeded);
    restartedNow = new Date(succeededEvent.created * 1000);
    const succeeded = await restarted.ingestStripeWebhook({
      rawBody: rawSucceeded,
      signatureHeader: stripeSignature(rawSucceeded, relay.secret, succeededEvent.created)
    });
    assert.equal(succeeded.metadata.revision, 3);
    assert.equal(succeeded.current.verdict, 'VERIFIED');
  } finally {
    await relay.cleanup();
  }
});

await test('Relay rejects a valid Stripe event that is not correlated to an action', async () => {
  const relay = await createTestRelay();
  try {
    await relay.service.createAction(actionBody);
    const unlinkedEvent = JSON.parse(await fixture('refund-created-pending.json'));
    unlinkedEvent.id = 'evt_unlinked_001';
    unlinkedEvent.data.object.id = 're_unlinked_001';
    const rawBody = JSON.stringify(unlinkedEvent);
    relay.setNow(new Date(unlinkedEvent.created * 1000));
    await assert.rejects(
      relay.service.ingestStripeWebhook({
        rawBody,
        signatureHeader: stripeSignature(rawBody, relay.secret, unlinkedEvent.created)
      }),
      (error) => error.code === 'STRIPE_REFUND_NOT_LINKED' && error.statusCode === 404
    );
    assert.equal((await relay.service.getAction(actionBody.action_id)).metadata.revision, 1);
  } finally {
    await relay.cleanup();
  }
});

await test('Relay maps a canceled Stripe refund to a CONTRADICTED outcome', async () => {
  const relay = await createTestRelay();
  try {
    await relay.service.createAction(actionBody);
    const rawCanceled = await fixture('refund-updated-canceled.json');
    const canceledEvent = JSON.parse(rawCanceled);
    relay.setNow(new Date(canceledEvent.created * 1000));
    const canceled = await relay.service.ingestStripeWebhook({
      rawBody: rawCanceled,
      signatureHeader: stripeSignature(rawCanceled, relay.secret, canceledEvent.created)
    });
    assert.equal(canceled.metadata.revision, 2);
    assert.equal(canceled.current.verdict, 'CONTRADICTED');
    assert.deepEqual(canceled.current.reasons, ['OUTCOME_CANCELLED']);
    assert.equal(verifyBundle(canceled.bundle).status, 'VALID');
  } finally {
    await relay.cleanup();
  }
});

console.log(`\n${passed} Relay tests passed.`);
