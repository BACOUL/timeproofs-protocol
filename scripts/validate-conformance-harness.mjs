import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { parseJsonStrict } from '../packages/core/src/index.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const conformanceDir = resolve(root, 'conformance');
const manifestPath = resolve(conformanceDir, 'manifest-v0.1.json');
const manifestBytes = await readFile(manifestPath);
const manifest = parseJsonStrict(manifestBytes.toString('utf8'));
const sidecar = (await readFile(resolve(conformanceDir, 'manifest-v0.1.sha256'), 'utf8')).trim();
const contract = parseJsonStrict(await readFile(resolve(conformanceDir, 'runner-contract-v0.1.json'), 'utf8'));
const specification = await readFile(resolve(root, 'spec/CONFORMANCE_HARNESS_V0_1.md'), 'utf8');
const implementationPlan = await readFile(resolve(root, 'docs/architecture/SECOND_IMPLEMENTATION_PLAN.md'), 'utf8');

function fail(message) {
  console.error(`Conformance harness validation failed: ${message}`);
  process.exit(1);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function exactKeys(value, expected, label) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) fail(`${label} keys differ: ${actual.join(', ')}`);
}

function assertUnique(items, label) {
  if (new Set(items).size !== items.length) fail(`${label} contains duplicates`);
}

function assertSortedUnique(values, label) {
  assertUnique(values, label);
  const sorted = [...values].sort();
  if (JSON.stringify(values) !== JSON.stringify(sorted)) fail(`${label} is not sorted`);
}

const expectedSidecar = `${sha256(manifestBytes)}  manifest-v0.1.json`;
if (sidecar !== expectedSidecar) fail('manifest integrity sidecar does not match committed manifest bytes');

exactKeys(manifest, ['manifest_version', 'protocol', 'comparison_rules', 'canonicalization_cases', 'signature_input_cases', 'bundle_cases'], 'manifest');
if (manifest.manifest_version !== '0.1') fail('unsupported manifest_version');
if (manifest.protocol.spec_version !== '0.1' || manifest.protocol.profile !== 'TP-JSON-0.1') fail('manifest protocol identity mismatch');
if (contract.contract_version !== '0.1') fail('runner contract version mismatch');
if (contract.protocol.spec_version !== manifest.protocol.spec_version || contract.protocol.profile !== manifest.protocol.profile) fail('runner contract protocol mismatch');

const allIds = [
  ...manifest.canonicalization_cases.map((entry) => `canonicalization:${entry.id}`),
  ...manifest.signature_input_cases.map((entry) => `signature_input:${entry.id}`),
  ...manifest.bundle_cases.map((entry) => `bundle:${entry.id}`)
];
assertUnique(allIds, 'case IDs');
if (manifest.canonicalization_cases.length < 6) fail('insufficient canonicalization coverage');
if (manifest.signature_input_cases.length < 2) fail('insufficient signature-input coverage');

for (const entry of manifest.canonicalization_cases) {
  exactKeys(entry, ['id', 'input', 'expected'], `canonicalization case ${entry.id}`);
  exactKeys(entry.expected, ['canonical_json', 'canonical_utf8_hex', 'canonical_sha256'], `canonicalization expected ${entry.id}`);
  if (!/^[0-9a-f]*$/u.test(entry.expected.canonical_utf8_hex) || entry.expected.canonical_utf8_hex.length % 2 !== 0) fail(`invalid canonical hex for ${entry.id}`);
  if (!/^[0-9a-f]{64}$/u.test(entry.expected.canonical_sha256)) fail(`invalid canonical digest for ${entry.id}`);
}

for (const entry of manifest.signature_input_cases) {
  exactKeys(entry, ['id', 'input', 'expected'], `signature-input case ${entry.id}`);
  exactKeys(entry.input, ['spec_version', 'profile', 'target_type', 'target_digest'], `signature-input input ${entry.id}`);
  exactKeys(entry.expected, ['signing_input_utf8', 'signing_input_utf8_hex', 'signing_input_sha256'], `signature-input expected ${entry.id}`);
  if (!/^[0-9a-f]{64}$/u.test(entry.expected.signing_input_sha256)) fail(`invalid signing-input digest for ${entry.id}`);
}

const listedFixturePaths = new Set();
for (const entry of manifest.bundle_cases) {
  exactKeys(entry, ['id', 'input', 'expected'], `bundle case ${entry.id}`);
  exactKeys(entry.input, ['path', 'sha256'], `bundle input ${entry.id}`);
  exactKeys(entry.expected, ['structural_status', 'payload_digest', 'error_codes', 'warning_codes', 'valid_proofs', 'summary'], `bundle expected ${entry.id}`);
  if (!['VALID', 'INVALID', 'INCOMPLETE'].includes(entry.expected.structural_status)) fail(`invalid structural status for ${entry.id}`);
  if (!/^[0-9a-f]{64}$/u.test(entry.input.sha256)) fail(`invalid input hash for ${entry.id}`);
  if (entry.input.path.startsWith('/') || entry.input.path.split('/').includes('..')) fail(`unsafe fixture path for ${entry.id}`);
  const absolute = resolve(root, entry.input.path);
  if (!absolute.startsWith(`${root}${sep}`)) fail(`fixture path escapes repository for ${entry.id}`);
  const bytes = await readFile(absolute);
  if (sha256(bytes) !== entry.input.sha256) fail(`fixture hash mismatch for ${entry.id}`);
  listedFixturePaths.add(entry.input.path);
  assertSortedUnique(entry.expected.error_codes, `error codes for ${entry.id}`);
  assertSortedUnique(entry.expected.warning_codes, `warning codes for ${entry.id}`);
  const proofIds = entry.expected.valid_proofs.map((proof) => proof.proof_id);
  assertUnique(proofIds, `proof IDs for ${entry.id}`);
  if (JSON.stringify(proofIds) !== JSON.stringify([...proofIds].sort())) fail(`valid proofs are not sorted for ${entry.id}`);
}

const actualFixturePaths = [];
for (const category of ['valid', 'invalid']) {
  const files = (await readdir(resolve(root, 'test-vectors', category)))
    .filter((name) => name.endsWith('.json') && name !== 'manifest.json')
    .sort();
  for (const file of files) actualFixturePaths.push(`test-vectors/${category}/${file}`);
}
if (JSON.stringify([...listedFixturePaths].sort()) !== JSON.stringify(actualFixturePaths.sort())) fail('manifest does not cover exactly every valid and invalid fixture');

for (const requiredText of ['canonical bytes', 'stable error codes', 'JSON Lines', 'fixture']) {
  if (!specification.toLowerCase().includes(requiredText.toLowerCase())) fail(`conformance specification omits ${requiredText}`);
}
for (const requiredText of ['MUST NOT', 'Node.js', 'conformance manifest', 'strict_json.py']) {
  if (!implementationPlan.includes(requiredText)) fail(`second implementation plan omits ${requiredText}`);
}

console.log(`Conformance harness validation passed (${manifest.canonicalization_cases.length} canonicalization, ${manifest.signature_input_cases.length} signature-input, ${manifest.bundle_cases.length} bundle cases).`);
