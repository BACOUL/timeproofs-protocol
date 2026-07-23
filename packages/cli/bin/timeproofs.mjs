#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  calculatePayloadDigest,
  canonicalize,
  createSignatureProof,
  parseJsonStrict,
  verifyBundle
} from '../../core/src/index.mjs';
import { evaluateBundle } from '../../verdict-engine/src/index.mjs';

function usage() {
  console.log(`TimeProofs Protocol CLI

Usage:
  timeproofs canonicalize <json-file>
  timeproofs digest <bundle-file>
  timeproofs verify <bundle-file> [--json]
  timeproofs verdict <bundle-file> --ruleset refund-v0.1 [--json]
  timeproofs sign <bundle-file> --private-key <pem> --issuer <issuer-id> --key <key-id> --proof-id <id> [--target-type TYPE] [--target-id ID] --out <file>
`);
}

function parseArguments(argumentsList) {
  const positional = [];
  const options = Object.create(null);
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (!argument.startsWith('--')) {
      positional.push(argument);
      continue;
    }
    const key = argument.slice(2);
    const next = argumentsList[index + 1];
    if (next === undefined || next.startsWith('--')) options[key] = true;
    else {
      options[key] = next;
      index += 1;
    }
  }
  return { positional, options };
}

function printVerification(result, jsonMode) {
  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(`Status: ${result.status}`);
  if (result.payload_digest) console.log(`Payload digest: ${result.payload_digest.value}`);
  if (result.summary) console.log(`Events: ${result.summary.events} | Evidence: ${result.summary.evidence} | Proofs: ${result.summary.proofs}`);
  for (const error of result.errors ?? []) console.error(`ERROR ${error.code}: ${error.message} (${error.path})`);
  for (const warning of result.warnings ?? []) console.warn(`WARN ${warning.code}: ${warning.message}`);
}

async function loadJson(filePath) {
  const text = await readFile(resolve(filePath), 'utf8');
  return { text, value: parseJsonStrict(text) };
}

async function main() {
  const { positional, options } = parseArguments(process.argv.slice(2));
  const [command, filePath] = positional;
  if (!command || command === 'help' || options.help) {
    usage();
    return;
  }
  if (!filePath) throw new Error('A file path is required.');

  if (command === 'canonicalize') {
    const { value } = await loadJson(filePath);
    process.stdout.write(`${canonicalize(value)}\n`);
    return;
  }

  if (command === 'digest') {
    const { value } = await loadJson(filePath);
    console.log(calculatePayloadDigest(value).value);
    return;
  }

  if (command === 'verify') {
    const { text } = await loadJson(filePath);
    const result = verifyBundle(text);
    printVerification(result, Boolean(options.json));
    process.exitCode = result.status === 'INVALID' ? 1 : 0;
    return;
  }

  if (command === 'verdict') {
    const { value } = await loadJson(filePath);
    const ruleset = options.ruleset;
    if (typeof ruleset !== 'string') throw new Error('--ruleset is required.');
    const result = evaluateBundle(value, ruleset);
    if (options.json) console.log(JSON.stringify(result, null, 2));
    else {
      console.log(`Verdict: ${result.verdict}`);
      console.log(`Ruleset: ${result.ruleset}`);
      console.log(`Reasons: ${(result.reasons ?? []).join(', ')}`);
    }
    process.exitCode = result.verdict === 'UNPROVABLE' ? 2 : 0;
    return;
  }

  if (command === 'sign') {
    const required = ['private-key', 'issuer', 'key', 'proof-id', 'out'];
    for (const option of required) {
      if (typeof options[option] !== 'string') throw new Error(`--${option} is required.`);
    }
    const { value: bundle } = await loadJson(filePath);
    const privateKeyPem = await readFile(resolve(options['private-key']), 'utf8');
    const targetType = typeof options['target-type'] === 'string' ? options['target-type'] : 'BUNDLE_PAYLOAD';
    const target = { target_type: targetType };
    if (typeof options['target-id'] === 'string') target.target_id = options['target-id'];
    const proof = createSignatureProof({
      bundle,
      target,
      issuerRef: options.issuer,
      keyId: options.key,
      privateKeyPem,
      proofId: options['proof-id'],
      createdAt: new Date().toISOString()
    });
    bundle.proofs.push(proof);
    await writeFile(resolve(options.out), `${JSON.stringify(bundle, null, 2)}\n`, 'utf8');
    console.log(`Wrote signed bundle to ${options.out}`);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`timeproofs: ${error.message}`);
  process.exitCode = 1;
});
