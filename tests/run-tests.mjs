import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  canonicalize,
  calculatePayloadDigest,
  parseJsonStrict,
  verifyBundle
} from '../packages/core/src/index.mjs';
import { evaluateBundle } from '../packages/verdict-engine/src/index.mjs';

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

async function load(relativePath) {
  return readFile(resolve(root, relativePath), 'utf8');
}

async function loadBundle(relativePath) {
  return parseJsonStrict(await load(relativePath));
}

await test('strict parser rejects duplicate object members', async () => {
  const text = await load('test-vectors/invalid/duplicate-key.json');
  assert.throws(() => parseJsonStrict(text), (error) => error.code === 'DUPLICATE_PROPERTY');
});

await test('strict parser rejects unpaired Unicode surrogate', async () => {
  assert.throws(() => parseJsonStrict('{"value":"\\ud800"}'), (error) => error.code === 'UNPAIRED_HIGH_SURROGATE');
});

await test('canonicalization vector matches expected bytes', async () => {
  const input = await loadBundle('test-vectors/canonicalization/input.json');
  const expected = (await load('test-vectors/canonicalization/expected.txt')).trimEnd();
  assert.equal(canonicalize(input), expected);
});

await test('canonicalization normalizes negative zero through JSON number serialization', async () => {
  assert.equal(canonicalize({ value: -0 }), '{"value":0}');
});

const expectedStructural = {
  'refund-pending.bundle.json': 'VALID',
  'refund-verified.bundle.json': 'VALID',
  'refund-contradicted.bundle.json': 'VALID',
  'refund-unprovable.bundle.json': 'INCOMPLETE'
};

for (const [fileName, expectedStatus] of Object.entries(expectedStructural)) {
  await test(`${fileName} has structural status ${expectedStatus}`, async () => {
    const text = await load(`test-vectors/valid/${fileName}`);
    const result = verifyBundle(text);
    assert.equal(result.status, expectedStatus);
    assert.equal(result.errors.length, 0);
    assert.match(result.payload_digest.value, /^[0-9a-f]{64}$/u);
  });
}

const expectedVerdicts = {
  'refund-pending.bundle.json': 'PENDING',
  'refund-verified.bundle.json': 'VERIFIED',
  'refund-contradicted.bundle.json': 'CONTRADICTED',
  'refund-unprovable.bundle.json': 'UNPROVABLE'
};

for (const [fileName, expectedVerdict] of Object.entries(expectedVerdicts)) {
  await test(`${fileName} produces ${expectedVerdict}`, async () => {
    const bundle = await loadBundle(`test-vectors/valid/${fileName}`);
    const result = evaluateBundle(bundle, 'refund-v0.1');
    assert.equal(result.verdict, expectedVerdict);
  });
}

const expectedInvalidCodes = {
  'digest-mismatch.bundle.json': 'OBJECT_DIGEST_MISMATCH',
  'signature-mismatch.bundle.json': 'SIGNATURE_INVALID',
  'unresolved-parent.bundle.json': 'PARENT_EVENT_NOT_FOUND',
  'extra-top-level-member.json': 'TOP_LEVEL_MEMBERS_INVALID'
};

for (const [fileName, expectedCode] of Object.entries(expectedInvalidCodes)) {
  await test(`${fileName} is rejected with ${expectedCode}`, async () => {
    const result = verifyBundle(await load(`test-vectors/invalid/${fileName}`));
    assert.equal(result.status, 'INVALID');
    assert.ok(result.errors.some((error) => error.code === expectedCode));
  });
}

await test('payload digest is unaffected by adding a proof', async () => {
  const bundle = await loadBundle('test-vectors/valid/refund-verified.bundle.json');
  const before = calculatePayloadDigest(bundle);
  bundle.proofs.push({ proof_id: 'ignored-for-payload-digest' });
  const after = calculatePayloadDigest(bundle);
  assert.deepEqual(after, before);
});

await test('changing proof target type invalidates domain-separated signature', async () => {
  const bundle = await loadBundle('test-vectors/valid/refund-verified.bundle.json');
  const proof = bundle.proofs.find((candidate) => candidate.target.target_type === 'OUTCOME_EVENT');
  proof.target.target_type = 'EVIDENCE_ITEM';
  const result = verifyBundle(bundle);
  assert.equal(result.status, 'INVALID');
  assert.ok(result.errors.some((error) => ['PROOF_TARGET_NOT_FOUND', 'SIGNATURE_INVALID'].includes(error.code)));
});

await test('schemas are valid JSON documents', async () => {
  const files = await readdir(resolve(root, 'schemas'));
  for (const file of files.filter((name) => name.endsWith('.json'))) {
    parseJsonStrict(await load(`schemas/${file}`));
  }
});

await test('generated site reports match reference verifier outputs', async () => {
  for (const scenario of ['pending', 'verified', 'contradicted', 'unprovable']) {
    const bundle = await loadBundle(`site/data/refund-${scenario}.bundle.json`);
    const storedVerification = await loadBundle(`site/data/refund-${scenario}.verification.json`);
    const storedVerdict = await loadBundle(`site/data/refund-${scenario}.verdict.json`);
    assert.equal(JSON.stringify(verifyBundle(bundle)), JSON.stringify(storedVerification));
    assert.equal(JSON.stringify(evaluateBundle(bundle, 'refund-v0.1')), JSON.stringify(storedVerdict));
  }
});

await test('CLI returns a machine-readable VERIFIED verdict', async () => {
  const result = spawnSync(
    process.execPath,
    [
      resolve(root, 'packages/cli/bin/timeproofs.mjs'),
      'verdict',
      resolve(root, 'test-vectors/valid/refund-verified.bundle.json'),
      '--ruleset',
      'refund-v0.1',
      '--json'
    ],
    { encoding: 'utf8' }
  );
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).verdict, 'VERIFIED');
});

console.log(`\n${passed} tests passed.`);
