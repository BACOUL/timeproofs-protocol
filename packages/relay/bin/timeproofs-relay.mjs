#!/usr/bin/env node
import { resolve } from 'node:path';
import { createRelayHttpServer, createRelayService } from '../src/index.mjs';

const port = Number(process.env.PORT ?? '8787');
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be an integer between 1 and 65535.');
  process.exit(1);
}

const host = process.env.HOST ?? '127.0.0.1';
const dataDirectory = resolve(process.env.TIMEPROOFS_RELAY_DATA_DIR ?? '.timeproofs-relay');
const service = await createRelayService({
  dataDirectory,
  issuerId: process.env.TIMEPROOFS_RELAY_ISSUER ?? 'urn:timeproofs:relay:local',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? null
});
const server = createRelayHttpServer({ service });
server.listen(port, host, () => {
  console.log(`TimeProofs Relay listening on http://${host}:${port}`);
  console.log(`Data directory: ${dataDirectory}`);
  console.log(`Issuer: ${service.issuer.issuer_id}#${service.issuer.key_id}`);
});
