import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);

async function read(relativePath) {
  return readFile(resolve(root, relativePath), 'utf8');
}

const requiredFiles = [
  'Dockerfile',
  '.dockerignore',
  'compose.yaml',
  'packages/relay/bin/timeproofs-relay.mjs',
  'integrations/RELAY_HTTP_API.md',
  'examples/relay/README.md'
];

for (const file of requiredFiles) await read(file);

const dockerfile = await read('Dockerfile');
assert.match(dockerfile, /FROM node:22-alpine/u);
assert.match(dockerfile, /USER node/u);
assert.match(dockerfile, /TIMEPROOFS_RELAY_DATA_DIR=\/data/u);
assert.match(dockerfile, /HEALTHCHECK/u);
assert.match(dockerfile, /packages\/relay\/bin\/timeproofs-relay\.mjs/u);

const compose = await read('compose.yaml');
assert.match(compose, /8787:8787/u);
assert.match(compose, /timeproofs-relay-data:\/data/u);
assert.match(compose, /STRIPE_WEBHOOK_SECRET/u);

const launcher = await read('packages/relay/bin/timeproofs-relay.mjs');
assert.match(launcher, /process\.env\.HOST/u);
assert.match(launcher, /process\.env\.TIMEPROOFS_RELAY_DATA_DIR/u);
assert.match(launcher, /process\.env\.STRIPE_WEBHOOK_SECRET/u);

const packageJson = JSON.parse(await read('package.json'));
assert.equal(packageJson.scripts['relay:start'], 'node packages/relay/bin/timeproofs-relay.mjs');
assert.equal(packageJson.scripts['relay:validate'], 'node scripts/validate-relay-packaging.mjs');

const apiDoc = await read('integrations/RELAY_HTTP_API.md');
assert.match(apiDoc, /docker compose up --build/u);
assert.match(apiDoc, /append-only/u);
assert.match(apiDoc, /Restarting the container reuses the same issuer key/u);

console.log(`Relay packaging validation passed (${requiredFiles.length} required files).`);
