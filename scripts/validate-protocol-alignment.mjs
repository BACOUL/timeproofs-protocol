import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseJsonStrict, verifyBundle } from '../packages/core/src/index.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const schema = parseJsonStrict(await readFile(resolve(root, 'schemas/evidence-bundle.schema.json'), 'utf8'));
const fieldRegistry = parseJsonStrict(await readFile(resolve(root, 'spec/field-semantics-v0.1.json'), 'utf8'));
const errorRegistry = parseJsonStrict(await readFile(resolve(root, 'spec/error-codes-v0.1.json'), 'utf8'));
const errorDocument = await readFile(resolve(root, 'spec/ERROR_CODES_V0_1.md'), 'utf8');
const specification = await readFile(resolve(root, 'spec/TIMEPROOFS_EVIDENCE_BUNDLE_SPEC_V0_1.md'), 'utf8');

function fail(message) {
  console.error(`Protocol alignment validation failed: ${message}`);
  process.exit(1);
}

function resolveRef(ref) {
  if (!ref.startsWith('#/$defs/')) fail(`unsupported schema ref ${ref}`);
  const name = ref.slice('#/$defs/'.length);
  const value = schema.$defs[name];
  if (!value) fail(`unresolved schema ref ${ref}`);
  return value;
}

const schemaPaths = new Set();
function walkSchema(node, path, stack = []) {
  if (node.$ref) {
    if (stack.includes(node.$ref)) return;
    walkSchema(resolveRef(node.$ref), path, [...stack, node.$ref]);
    return;
  }
  schemaPaths.add(path);
  if (node.type === 'array') {
    walkSchema(node.items, `${path}[]`, stack);
    return;
  }
  if (node.type === 'object' || node.properties) {
    if (node.additionalProperties === true && !node.properties) return;
    for (const [key, child] of Object.entries(node.properties ?? {})) {
      walkSchema(child, `${path}.${key}`, stack);
    }
  }
}
walkSchema(schema, '$');

const registryEntries = new Map(fieldRegistry.fields.map((entry) => [entry.path, entry]));
for (const path of schemaPaths) {
  if (!registryEntries.has(path)) fail(`schema path has no normative semantics: ${path}`);
}
for (const path of registryEntries.keys()) {
  if (!schemaPaths.has(path)) fail(`field registry path is not accepted by the schema: ${path}`);
}

const openPrefixes = fieldRegistry.fields.filter((entry) => entry.open_children).map((entry) => `${entry.path}.`);
function normalizePath(parts) {
  let value = '$';
  for (const part of parts) value += typeof part === 'number' ? '[]' : `.${part}`;
  return value;
}
function walkValue(value, parts = []) {
  const path = normalizePath(parts);
  const documented = registryEntries.has(path) || openPrefixes.some((prefix) => path.startsWith(prefix));
  if (!documented) fail(`valid fixture contains undocumented field path: ${path}`);
  if (Array.isArray(value)) value.forEach((item, index) => walkValue(item, [...parts, index]));
  else if (value && typeof value === 'object') Object.entries(value).forEach(([key, child]) => walkValue(child, [...parts, key]));
}

for (const fileName of (await readdir(resolve(root, 'test-vectors/valid'))).filter((name) => name.endsWith('.json'))) {
  const bundle = parseJsonStrict(await readFile(resolve(root, 'test-vectors/valid', fileName), 'utf8'));
  walkValue(bundle);
}

const registeredCodes = new Set(errorRegistry.codes.map((entry) => entry.code));
if (registeredCodes.size !== errorRegistry.codes.length) fail('error code registry contains duplicate codes');
for (const entry of errorRegistry.codes) {
  if (!errorDocument.includes(`\`${entry.code}\``)) fail(`error code missing from generated Markdown: ${entry.code}`);
}

const sourceFiles = ['strict-json.mjs', 'verify-bundle.mjs', 'proofs.mjs'];
for (const sourceFile of sourceFiles) {
  const source = await readFile(resolve(root, 'packages/core/src', sourceFile), 'utf8');
  const patterns = [
    /addIssue\([^\n]*?'([A-Z][A-Z0-9_]+)'/gu,
    /fail\('([A-Z][A-Z0-9_]+)'/gu,
    /code:\s*'([A-Z][A-Z0-9_]+)'/gu
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (!registeredCodes.has(match[1])) fail(`${sourceFile} emits unregistered error code ${match[1]}`);
    }
  }
}

const invalidManifest = parseJsonStrict(await readFile(resolve(root, 'test-vectors/invalid/manifest.json'), 'utf8'));
for (const [fileName, expectedCode] of Object.entries(invalidManifest)) {
  if (!registeredCodes.has(expectedCode)) fail(`invalid fixture ${fileName} expects unregistered code ${expectedCode}`);
  const raw = await readFile(resolve(root, 'test-vectors/invalid', fileName), 'utf8');
  const result = verifyBundle(raw);
  if (result.status !== 'INVALID') fail(`invalid fixture ${fileName} returned ${result.status}`);
  if (!result.errors.some((error) => error.code === expectedCode)) fail(`invalid fixture ${fileName} did not emit ${expectedCode}`);
}

for (const entry of fieldRegistry.fields) {
  if (!specification.includes(`\`${entry.path}\``)) fail(`normative specification does not explicitly name ${entry.path}`);
}

console.log(`Protocol alignment passed (${schemaPaths.size} schema paths, ${registeredCodes.size} stable codes, ${Object.keys(invalidManifest).length} invalid fixtures).`);
