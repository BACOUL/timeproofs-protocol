import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const site = resolve(root, 'site');
const failures = [];
const requiredFiles = [
  'index.html',
  'styles.css',
  'packet-styles.css',
  'app.js',
  '.nojekyll',
  'packets/refund-pending.html',
  'packets/refund-verified.html',
  'packets/refund-contradicted.html',
  'packets/refund-unprovable.html',
  'data/refund-pending.bundle.json',
  'data/refund-verified.bundle.json',
  'data/refund-contradicted.bundle.json',
  'data/refund-unprovable.bundle.json'
];

for (const file of requiredFiles) {
  try { await access(resolve(site, file)); }
  catch { failures.push(`missing site file: ${file}`); }
}

const html = await readFile(resolve(site, 'index.html'), 'utf8');
const app = await readFile(resolve(site, 'app.js'), 'utf8');
const requiredCopy = [
  'Experimental preview',
  'A valid signature proves provenance and integrity, not universal factual truth.',
  'Product comprehension test',
  'Practitioner workflow test',
  'TimeProofs is not a timestamping protocol.',
  'AI agent claim',
  'System-of-record evidence',
  'Copy anonymous result'
];
for (const text of requiredCopy) {
  if (!html.includes(text)) failures.push(`required limitation or validation copy missing: ${text}`);
}

const forbiddenClaims = [
  /industry standard/i,
  /official certification/i,
  /guarantees? (the )?truth/i,
  /trusted by/i,
  /customers? include/i,
  /production-ready/i
];
for (const pattern of forbiddenClaims) {
  if (pattern.test(html)) failures.push(`unsupported public claim matched ${pattern}`);
}

for (const field of ['name', 'email', 'company', 'phone', 'address']) {
  const pattern = new RegExp(`name=["']${field}["']`, 'i');
  if (pattern.test(html)) failures.push(`personal-data form field is not allowed in preview: ${field}`);
}

for (const contract of [
  'timeproofs-outcome-comprehension-v0.1',
  'timeproofs-practitioner-feedback-v0.1'
]) {
  if (!app.includes(contract)) failures.push(`client export contract missing: ${contract}`);
}

if (!html.includes('href="packets/refund-pending.html"')) failures.push('default packet link missing');
if (!app.includes('personal_data_collected: false')) failures.push('anonymous export declaration missing');
if (!app.includes('copyAnonymousResult')) failures.push('anonymous clipboard return path missing');
for (const sourceClass of ['SELF_CLAIMED', 'GATEWAY_OBSERVED', 'SYSTEM_OF_RECORD', 'INDEPENDENTLY_SETTLED']) {
  if (!app.includes(sourceClass)) failures.push(`source provenance badge mapping missing: ${sourceClass}`);
}

if (failures.length) {
  console.error('Site preview validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`Site preview validation passed (${requiredFiles.length} required files).`);
