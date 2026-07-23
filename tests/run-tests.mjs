import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  SIGNATURE_DOMAIN,
  buildSignatureInput,
  canonicalize,
  calculatePayloadDigest,
  digestValue,
  parseJsonStrict,
  verifyBundle,
  verifySignatureProof,
  OUTCOME_EVENT_VOCABULARY,
  EVENT_TYPE_RULES
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

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

await test('strict parser rejects duplicate object members', async () => {
  const text = await load('test-vectors/invalid/duplicate-key.json');
  assert.throws(() => parseJsonStrict(text), (error) => error.code === 'DUPLICATE_PROPERTY');
});

await test('strict parser rejects unpaired Unicode surrogate', async () => {
  assert.throws(() => parseJsonStrict('{"value":"\\ud800"}'), (error) => error.code === 'UNPAIRED_HIGH_SURROGATE');
});

await test('canonicalization legacy vector matches expected bytes', async () => {
  const input = await loadBundle('test-vectors/canonicalization/input.json');
  const expected = (await load('test-vectors/canonicalization/expected.txt')).trimEnd();
  assert.equal(canonicalize(input), expected);
});

const canonicalVectors = await loadBundle('test-vectors/canonicalization/vectors.json');
for (const vector of canonicalVectors) {
  await test(`canonicalization vector ${vector.id}`, async () => {
    assert.equal(canonicalize(vector.input), vector.expected);
  });
}

await test('null and an omitted member have different canonical bytes and digests', async () => {
  const withNull = { a: 1, b: null };
  const omitted = { a: 1 };
  assert.notEqual(canonicalize(withNull), canonicalize(omitted));
  assert.notDeepEqual(digestValue(withNull), digestValue(omitted));
});

const expectedStructural = {
  'refund-pending.bundle.json': 'VALID',
  'refund-verified.bundle.json': 'VALID',
  'refund-contradicted.bundle.json': 'VALID',
  'refund-unprovable.bundle.json': 'INCOMPLETE',
  'email-recorded.bundle.json': 'VALID',
  'appointment-created.bundle.json': 'VALID',
  'extension-event.bundle.json': 'INCOMPLETE'
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

const invalidManifest = await loadBundle('test-vectors/invalid/manifest.json');
for (const [fileName, expectedCode] of Object.entries(invalidManifest)) {
  await test(`${fileName} is rejected with ${expectedCode}`, async () => {
    const result = verifyBundle(await load(`test-vectors/invalid/${fileName}`));
    assert.equal(result.status, 'INVALID');
    assert.ok(result.errors.some((error) => error.code === expectedCode), JSON.stringify(result.errors, null, 2));
  });
}

await test('Outcome Event vocabulary registry is internally coherent', async () => {
  assert.equal(OUTCOME_EVENT_VOCABULARY.spec_version, '0.1');
  assert.equal(Object.keys(EVENT_TYPE_RULES).length, 38);
  assert.deepEqual(Object.keys(OUTCOME_EVENT_VOCABULARY.phases).sort(), ['ACCEPTANCE', 'AUTHORIZATION', 'DISPATCH', 'EFFECT', 'INTENT', 'SETTLEMENT', 'TERMINATION']);
  assert.ok(EVENT_TYPE_RULES['commerce.refund.created']);
  assert.ok(EVENT_TYPE_RULES['messaging.email.recorded']);
  assert.ok(EVENT_TYPE_RULES['calendar.appointment.created']);
});

await test('self-claimed settlement remains structurally representable but not sufficient', async () => {
  const bundle = await loadBundle('test-vectors/valid/refund-unprovable.bundle.json');
  const verification = verifyBundle(bundle);
  assert.equal(verification.status, 'INCOMPLETE');
  assert.equal(verification.errors.length, 0);
  assert.equal(evaluateBundle(bundle, 'refund-v0.1').verdict, 'UNPROVABLE');
});

await test('collision-resistant extension event namespace remains accepted', async () => {
  const bundle = await loadBundle('test-vectors/valid/extension-event.bundle.json');
  const result = verifyBundle(bundle);
  assert.equal(result.status, 'INCOMPLETE');
  assert.equal(result.errors.length, 0);
});

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

await test('changing profile invalidates the signed context', async () => {
  const bundle = await loadBundle('test-vectors/valid/refund-verified.bundle.json');
  bundle.payload.profile = 'TP-JSON-0.2';
  const result = verifyBundle(bundle);
  assert.equal(result.status, 'INVALID');
  assert.ok(result.errors.some((error) => error.code === 'PROFILE_UNSUPPORTED'));
  const proof = bundle.proofs.find((candidate) => candidate.target.target_type === 'OUTCOME_EVENT');
  const issuer = bundle.payload.issuers.find((candidate) => candidate.issuer_id === proof.issuer_ref);
  assert.equal(verifySignatureProof(bundle, proof, issuer).code, 'SIGNATURE_INVALID');
});

await test('changing spec version invalidates the signed context', async () => {
  const bundle = await loadBundle('test-vectors/valid/refund-verified.bundle.json');
  bundle.payload.spec_version = '0.2';
  const result = verifyBundle(bundle);
  assert.equal(result.status, 'INVALID');
  assert.ok(result.errors.some((error) => error.code === 'SPEC_VERSION_UNSUPPORTED'));
  const proof = bundle.proofs.find((candidate) => candidate.target.target_type === 'OUTCOME_EVENT');
  const issuer = bundle.payload.issuers.find((candidate) => candidate.issuer_id === proof.issuer_ref);
  assert.equal(verifySignatureProof(bundle, proof, issuer).code, 'SIGNATURE_INVALID');
});

await test('signature input binds domain, profile, version, target type, algorithm and digest value', async () => {
  const digest = { algorithm: 'sha-256', value: '1'.repeat(64) };
  const base = buildSignatureInput({ specVersion: '0.1', profile: 'TP-JSON-0.1', targetType: 'OUTCOME_EVENT', targetDigest: digest });
  assert.equal(SIGNATURE_DOMAIN, 'org.timeproofs.signature.v0.1');
  for (const changed of [
    { specVersion: '0.2', profile: 'TP-JSON-0.1', targetType: 'OUTCOME_EVENT', targetDigest: digest },
    { specVersion: '0.1', profile: 'TP-JSON-0.2', targetType: 'OUTCOME_EVENT', targetDigest: digest },
    { specVersion: '0.1', profile: 'TP-JSON-0.1', targetType: 'EVIDENCE_ITEM', targetDigest: digest },
    { specVersion: '0.1', profile: 'TP-JSON-0.1', targetType: 'OUTCOME_EVENT', targetDigest: { algorithm: 'sha-512', value: '1'.repeat(64) } },
    { specVersion: '0.1', profile: 'TP-JSON-0.1', targetType: 'OUTCOME_EVENT', targetDigest: { algorithm: 'sha-256', value: '2'.repeat(64) } }
  ]) {
    assert.notDeepEqual(buildSignatureInput(changed), base);
  }
});

await test('nested extra members are rejected consistently with schemas', async () => {
  const bundle = await loadBundle('test-vectors/valid/refund-unprovable.bundle.json');
  bundle.proofs = [];
  bundle.payload.events[0].unexpected = true;
  const result = verifyBundle(bundle);
  assert.equal(result.status, 'INVALID');
  assert.ok(result.errors.some((error) => error.code === 'EVENT_MEMBERS_INVALID'));
});

await test('schemas and machine-readable registries are valid JSON documents', async () => {
  const files = [
    ...(await readdir(resolve(root, 'schemas'))).filter((name) => name.endsWith('.json')).map((name) => `schemas/${name}`),
    'spec/field-semantics-v0.1.json',
    'spec/error-codes-v0.1.json',
    'test-vectors/invalid/manifest.json',
    'test-vectors/canonicalization/vectors.json'
  ];
  for (const file of files) parseJsonStrict(await load(file));
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
