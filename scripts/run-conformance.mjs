import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  buildSignatureInput,
  canonicalize,
  parseJsonStrict,
  sha256Hex,
  verifyBundle
} from '../packages/core/src/index.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const manifest = parseJsonStrict(await readFile(resolve(root, 'conformance/manifest-v0.1.json'), 'utf8'));
const jsonOutput = process.argv.includes('--json');

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function sortedCodes(items = []) {
  return [...new Set(items.map((item) => item.code))].sort();
}

function normalizeProofs(proofs = []) {
  return proofs.map((proof) => ({
    proof_id: proof.proof_id,
    issuer_ref: proof.issuer_ref,
    target_type: proof.target.target_type,
    target_id: proof.target.target_id ?? null,
    target_digest: proof.target.digest ? { algorithm: proof.target.digest.algorithm, value: proof.target.digest.value } : null
  })).sort((left, right) => left.proof_id.localeCompare(right.proof_id));
}

function normalizeVerification(result) {
  return {
    structural_status: result.status,
    payload_digest: result.payload_digest ? { algorithm: result.payload_digest.algorithm, value: result.payload_digest.value } : null,
    error_codes: sortedCodes(result.errors),
    warning_codes: sortedCodes(result.warnings),
    valid_proofs: normalizeProofs(result.valid_proofs),
    summary: result.summary ? { ...result.summary } : null
  };
}

const fixtureBytes = new Map();
for (const entry of manifest.bundle_cases) {
  fixtureBytes.set(entry.input.path, await readFile(resolve(root, entry.input.path)));
}

const failures = [];
let passed = 0;

function check(caseClass, caseId, callback) {
  try {
    callback();
    passed += 1;
    if (!jsonOutput) console.log(`PASS ${caseClass} ${caseId}`);
  } catch (error) {
    failures.push({ case_class: caseClass, case_id: caseId, error: error.message });
    if (!jsonOutput) console.error(`FAIL ${caseClass} ${caseId}: ${error.message}`);
  }
}

for (const entry of manifest.canonicalization_cases) {
  check('canonicalization', entry.id, () => {
    const canonical = canonicalize(entry.input);
    assert.equal(canonical, entry.expected.canonical_json);
    assert.equal(Buffer.from(canonical, 'utf8').toString('hex'), entry.expected.canonical_utf8_hex);
    assert.equal(sha256(Buffer.from(canonical, 'utf8')), entry.expected.canonical_sha256);
  });
}

for (const entry of manifest.signature_input_cases) {
  check('signature_input', entry.id, () => {
    const bytes = buildSignatureInput({
      specVersion: entry.input.spec_version,
      profile: entry.input.profile,
      targetType: entry.input.target_type,
      targetDigest: entry.input.target_digest
    });
    assert.equal(bytes.toString('utf8'), entry.expected.signing_input_utf8);
    assert.equal(bytes.toString('hex'), entry.expected.signing_input_utf8_hex);
    assert.equal(sha256Hex(bytes), entry.expected.signing_input_sha256);
  });
}

for (const entry of manifest.bundle_cases) {
  check('bundle', entry.id, () => {
    const bytes = fixtureBytes.get(entry.input.path);
    assert.ok(bytes, `fixture not loaded: ${entry.input.path}`);
    assert.equal(sha256(bytes), entry.input.sha256, 'fixture byte hash mismatch');
    const actual = normalizeVerification(verifyBundle(bytes.toString('utf8')));
    assert.deepEqual(actual, JSON.parse(JSON.stringify(entry.expected)));
  });
}

const result = {
  manifest_version: manifest.manifest_version,
  protocol: manifest.protocol,
  passed,
  failed: failures.length,
  total: passed + failures.length,
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  failures
};

if (jsonOutput) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
else console.log(`\nConformance ${result.status}: ${passed}/${result.total} cases passed.`);

if (failures.length) process.exitCode = 1;
