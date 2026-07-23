import { generateKeyPairSync } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  calculateObjectDigest,
  canonicalize,
  createSignatureProof,
  digestValue,
  verifyBundle
} from '../packages/core/src/index.mjs';
import { evaluateBundle } from '../packages/verdict-engine/src/index.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const keysDirectory = resolve(root, 'test-vectors/keys');

async function ensureKey(name) {
  const privatePath = resolve(keysDirectory, `${name}.private.pem`);
  const publicPath = resolve(keysDirectory, `${name}.public.pem`);
  try {
    return {
      privateKey: await readFile(privatePath, 'utf8'),
      publicKey: await readFile(publicPath, 'utf8')
    };
  } catch {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');
    const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' });
    const publicPem = publicKey.export({ type: 'spki', format: 'pem' });
    await mkdir(keysDirectory, { recursive: true });
    await writeFile(privatePath, privatePem, { mode: 0o600 });
    await writeFile(publicPath, publicPem, 'utf8');
    return { privateKey: privatePem, publicKey: publicPem };
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function finalizeObject(object) {
  const value = clone(object);
  value.object_digest = calculateObjectDigest(value);
  return value;
}

function issuer({ id, displayName, type, domain, publicKey, keyId }) {
  return {
    issuer_id: id,
    display_name: displayName,
    issuer_type: type,
    identifiers: [{ scheme: 'dns', value: domain }],
    keys: [{ key_id: keyId, algorithm: 'Ed25519', format: 'spki-pem', public_key: publicKey }],
    extensions: {}
  };
}

function event({ id, phase, type, status, occurredAt, recordedAt, sourceClass, issuerRef, actor, subject, claim, evidenceRefs = [], parents = [] }) {
  return finalizeObject({
    event_id: id,
    phase,
    event_type: type,
    status,
    occurred_at: occurredAt,
    recorded_at: recordedAt,
    source_class: sourceClass,
    issuer_ref: issuerRef,
    actor,
    subject,
    claim,
    evidence_refs: evidenceRefs,
    parent_event_digests: parents,
    extensions: {}
  });
}

function evidence({ id, type, mediaType, sourceClass, issuerRef, claimScope, content, locatorValue, disclosure = 'RESTRICTED' }) {
  return finalizeObject({
    evidence_id: id,
    evidence_type: type,
    media_type: mediaType,
    source_class: sourceClass,
    issuer_ref: issuerRef,
    claim_scope: claimScope,
    content_digest: digestValue(content),
    locator: {
      scheme: 'opaque',
      value: locatorValue,
      retrieval_policy: 'AUTHORIZED_ONLY'
    },
    disclosure,
    extensions: {}
  });
}

function relationship({ id, type, from, to }) {
  return finalizeObject({
    relationship_id: id,
    relationship_type: type,
    from_ref: from,
    to_ref: to,
    extensions: {}
  });
}

function basePayload(issuers, bundleId) {
  return {
    spec_version: '0.1',
    profile: 'TP-JSON-0.1',
    bundle_id: bundleId,
    action_id: 'tpa_refund_demo_001',
    created_at: '2026-07-23T14:32:08Z',
    issuers,
    events: [],
    evidence: [],
    relationships: [],
    predecessor_bundle_digests: [],
    extensions: {
      'org.timeproofs.demo': {
        scenario: 'refund-outcome-assurance',
        notice: 'Synthetic interoperability fixture. No real payment occurred.'
      }
    }
  };
}

function addProof(bundle, options) {
  bundle.proofs.push(createSignatureProof({ bundle, ...options }));
}

async function writeJson(relativePath, value) {
  const path = resolve(root, relativePath);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

const keys = {
  agent: await ensureKey('TEST_ONLY_agent'),
  gateway: await ensureKey('TEST_ONLY_gateway'),
  merchant: await ensureKey('TEST_ONLY_merchant'),
  psp: await ensureKey('TEST_ONLY_psp')
};

await writeFile(resolve(keysDirectory, 'README.md'), `# Test-only keys\n\nThese private keys exist only to make cryptographic test vectors deterministic. They MUST NOT be used outside tests or demonstrations.\n`, 'utf8');

const issuers = [
  issuer({ id: 'agent.example', displayName: 'Demo Refund Agent', type: 'AI_AGENT', domain: 'agent.example', publicKey: keys.agent.publicKey, keyId: 'agent-test-01' }),
  issuer({ id: 'gateway.example', displayName: 'Demo Action Gateway', type: 'GATEWAY', domain: 'gateway.example', publicKey: keys.gateway.publicKey, keyId: 'gateway-test-01' }),
  issuer({ id: 'merchant.example', displayName: 'Demo Merchant Refund System', type: 'SYSTEM', domain: 'merchant.example', publicKey: keys.merchant.publicKey, keyId: 'merchant-test-01' }),
  issuer({ id: 'psp.example', displayName: 'Demo Payment Settlement Provider', type: 'PAYMENT_PROVIDER', domain: 'psp.example', publicKey: keys.psp.publicKey, keyId: 'psp-test-01' })
];

const actor = { entity_type: 'AI_AGENT', entity_id: 'refund-agent-demo', display_name: 'Refund Agent Demo' };
const subject = { entity_type: 'REFUND', entity_id: 'refund-demo-001', display_name: 'Refund 79.00 EUR' };

function makeCommon(bundleId) {
  const requestEvidence = evidence({
    id: 'tpev_refund_request',
    type: 'AGENT_REQUEST',
    mediaType: 'application/json',
    sourceClass: 'SELF_CLAIMED',
    issuerRef: 'agent.example',
    claimScope: ['commerce.refund.requested'],
    content: { amount: '79.00', currency: 'EUR', order_id: 'ORDER-DEMO-001' },
    locatorValue: 'evref_demo_refund_request',
    disclosure: 'COMMITMENT_ONLY'
  });
  const dispatchEvidence = evidence({
    id: 'tpev_gateway_dispatch',
    type: 'GATEWAY_RECORD',
    mediaType: 'application/json',
    sourceClass: 'GATEWAY_OBSERVED',
    issuerRef: 'gateway.example',
    claimScope: ['commerce.refund.dispatched'],
    content: { request_id: 'REQ-DEMO-001', destination: 'merchant.example' },
    locatorValue: 'evref_demo_gateway_dispatch'
  });
  const createdEvidence = evidence({
    id: 'tpev_refund_created',
    type: 'API_RESPONSE',
    mediaType: 'application/json',
    sourceClass: 'SYSTEM_OF_RECORD',
    issuerRef: 'merchant.example',
    claimScope: ['commerce.refund.created'],
    content: { refund_id: 'REF-DEMO-001', amount: '79.00', currency: 'EUR', status: 'created' },
    locatorValue: 'evref_demo_refund_created'
  });

  const requested = event({
    id: 'tpe_refund_requested',
    phase: 'INTENT',
    type: 'commerce.refund.requested',
    status: 'SUCCEEDED',
    occurredAt: '2026-07-23T14:30:00Z',
    recordedAt: '2026-07-23T14:30:01Z',
    sourceClass: 'SELF_CLAIMED',
    issuerRef: 'agent.example',
    actor,
    subject,
    claim: { amount: '79.00', currency: 'EUR', order_id: 'ORDER-DEMO-001' },
    evidenceRefs: [requestEvidence.evidence_id]
  });
  const dispatched = event({
    id: 'tpe_refund_dispatched',
    phase: 'DISPATCH',
    type: 'commerce.refund.dispatched',
    status: 'SUCCEEDED',
    occurredAt: '2026-07-23T14:30:03Z',
    recordedAt: '2026-07-23T14:30:03Z',
    sourceClass: 'GATEWAY_OBSERVED',
    issuerRef: 'gateway.example',
    actor,
    subject,
    claim: { request_id: 'REQ-DEMO-001', destination: 'merchant.example' },
    evidenceRefs: [dispatchEvidence.evidence_id],
    parents: [requested.object_digest]
  });
  const created = event({
    id: 'tpe_refund_created',
    phase: 'EFFECT',
    type: 'commerce.refund.created',
    status: 'SUCCEEDED',
    occurredAt: '2026-07-23T14:30:05Z',
    recordedAt: '2026-07-23T14:30:06Z',
    sourceClass: 'SYSTEM_OF_RECORD',
    issuerRef: 'merchant.example',
    actor: { entity_type: 'SERVICE', entity_id: 'merchant-refund-api', display_name: 'Merchant Refund API' },
    subject,
    claim: { refund_id: 'REF-DEMO-001', amount: '79.00', currency: 'EUR', state: 'created' },
    evidenceRefs: [createdEvidence.evidence_id],
    parents: [dispatched.object_digest]
  });

  const payload = basePayload(issuers, bundleId);
  payload.events = [requested, dispatched, created];
  payload.evidence = [requestEvidence, dispatchEvidence, createdEvidence];
  payload.relationships = [
    relationship({ id: 'tpr_request_support', type: 'SUPPORTS', from: `evidence:${requestEvidence.evidence_id}`, to: `event:${requested.event_id}` }),
    relationship({ id: 'tpr_dispatch_support', type: 'SUPPORTS', from: `evidence:${dispatchEvidence.evidence_id}`, to: `event:${dispatched.event_id}` }),
    relationship({ id: 'tpr_created_support', type: 'SUPPORTS', from: `evidence:${createdEvidence.evidence_id}`, to: `event:${created.event_id}` })
  ];

  const bundle = { payload, proofs: [] };
  addProof(bundle, {
    target: { target_type: 'OUTCOME_EVENT', target_id: dispatched.event_id },
    issuerRef: 'gateway.example', keyId: 'gateway-test-01', privateKeyPem: keys.gateway.privateKey,
    proofId: 'tpp_dispatch', createdAt: '2026-07-23T14:30:04Z'
  });
  addProof(bundle, {
    target: { target_type: 'OUTCOME_EVENT', target_id: created.event_id },
    issuerRef: 'merchant.example', keyId: 'merchant-test-01', privateKeyPem: keys.merchant.privateKey,
    proofId: 'tpp_created', createdAt: '2026-07-23T14:30:07Z'
  });
  return { bundle, created };
}

const pending = makeCommon('tpb_refund_pending_001').bundle;
addProof(pending, {
  target: { target_type: 'BUNDLE_PAYLOAD' },
  issuerRef: 'gateway.example', keyId: 'gateway-test-01', privateKeyPem: keys.gateway.privateKey,
  proofId: 'tpp_pending_bundle', createdAt: '2026-07-23T14:32:09Z'
});

const verifiedBase = makeCommon('tpb_refund_verified_001');
const settlementEvidence = evidence({
  id: 'tpev_refund_settled',
  type: 'PAYMENT_SETTLEMENT_RECORD',
  mediaType: 'application/json',
  sourceClass: 'INDEPENDENTLY_SETTLED',
  issuerRef: 'psp.example',
  claimScope: ['commerce.refund.settled'],
  content: { refund_id: 'REF-DEMO-001', settlement_id: 'SET-DEMO-001', amount: '79.00', currency: 'EUR', status: 'settled' },
  locatorValue: 'evref_demo_refund_settled'
});
const settled = event({
  id: 'tpe_refund_settled',
  phase: 'SETTLEMENT',
  type: 'commerce.refund.settled',
  status: 'SUCCEEDED',
  occurredAt: '2026-07-23T14:31:54Z',
  recordedAt: '2026-07-23T14:31:55Z',
  sourceClass: 'INDEPENDENTLY_SETTLED',
  issuerRef: 'psp.example',
  actor: { entity_type: 'PAYMENT_PROVIDER', entity_id: 'psp-settlement-demo', display_name: 'Demo PSP' },
  subject,
  claim: { refund_id: 'REF-DEMO-001', settlement_id: 'SET-DEMO-001', amount: '79.00', currency: 'EUR', state: 'settled' },
  evidenceRefs: [settlementEvidence.evidence_id],
  parents: [verifiedBase.created.object_digest]
});
verifiedBase.bundle.payload.events.push(settled);
verifiedBase.bundle.payload.evidence.push(settlementEvidence);
verifiedBase.bundle.payload.relationships.push(
  relationship({ id: 'tpr_settlement_support', type: 'SUPPORTS', from: `evidence:${settlementEvidence.evidence_id}`, to: `event:${settled.event_id}` })
);
addProof(verifiedBase.bundle, {
  target: { target_type: 'OUTCOME_EVENT', target_id: settled.event_id },
  issuerRef: 'psp.example', keyId: 'psp-test-01', privateKeyPem: keys.psp.privateKey,
  proofId: 'tpp_settled', createdAt: '2026-07-23T14:31:56Z'
});
addProof(verifiedBase.bundle, {
  target: { target_type: 'BUNDLE_PAYLOAD' },
  issuerRef: 'gateway.example', keyId: 'gateway-test-01', privateKeyPem: keys.gateway.privateKey,
  proofId: 'tpp_verified_bundle', createdAt: '2026-07-23T14:32:09Z'
});
const verified = verifiedBase.bundle;

const contradicted = clone(verified);
contradicted.payload.bundle_id = 'tpb_refund_contradicted_001';
contradicted.proofs = contradicted.proofs.filter((proof) => proof.target.target_type !== 'BUNDLE_PAYLOAD');
const reversalEvidence = evidence({
  id: 'tpev_refund_reversed',
  type: 'PAYMENT_REVERSAL_RECORD',
  mediaType: 'application/json',
  sourceClass: 'INDEPENDENTLY_SETTLED',
  issuerRef: 'psp.example',
  claimScope: ['commerce.refund.reversed'],
  content: { refund_id: 'REF-DEMO-001', settlement_id: 'SET-DEMO-001', status: 'reversed' },
  locatorValue: 'evref_demo_refund_reversed'
});
const reversal = event({
  id: 'tpe_refund_reversed',
  phase: 'TERMINATION',
  type: 'commerce.refund.reversed',
  status: 'REVERSED',
  occurredAt: '2026-07-23T15:00:00Z',
  recordedAt: '2026-07-23T15:00:01Z',
  sourceClass: 'INDEPENDENTLY_SETTLED',
  issuerRef: 'psp.example',
  actor: { entity_type: 'PAYMENT_PROVIDER', entity_id: 'psp-settlement-demo', display_name: 'Demo PSP' },
  subject,
  claim: { refund_id: 'REF-DEMO-001', settlement_id: 'SET-DEMO-001', state: 'reversed' },
  evidenceRefs: [reversalEvidence.evidence_id],
  parents: [settled.object_digest]
});
contradicted.payload.events.push(reversal);
contradicted.payload.evidence.push(reversalEvidence);
contradicted.payload.relationships.push(
  relationship({ id: 'tpr_reversal_support', type: 'SUPPORTS', from: `evidence:${reversalEvidence.evidence_id}`, to: `event:${reversal.event_id}` }),
  relationship({ id: 'tpr_reversal_relation', type: 'REVERSES', from: `event:${reversal.event_id}`, to: `event:${settled.event_id}` })
);
addProof(contradicted, {
  target: { target_type: 'OUTCOME_EVENT', target_id: reversal.event_id },
  issuerRef: 'psp.example', keyId: 'psp-test-01', privateKeyPem: keys.psp.privateKey,
  proofId: 'tpp_reversed', createdAt: '2026-07-23T15:00:02Z'
});
addProof(contradicted, {
  target: { target_type: 'BUNDLE_PAYLOAD' },
  issuerRef: 'gateway.example', keyId: 'gateway-test-01', privateKeyPem: keys.gateway.privateKey,
  proofId: 'tpp_contradicted_bundle', createdAt: '2026-07-23T15:00:03Z'
});

const unprovablePayload = basePayload(issuers, 'tpb_refund_unprovable_001');
const claimed = event({
  id: 'tpe_refund_claimed_complete',
  phase: 'SETTLEMENT',
  type: 'commerce.refund.settled',
  status: 'SUCCEEDED',
  occurredAt: '2026-07-23T14:31:54Z',
  recordedAt: '2026-07-23T14:31:55Z',
  sourceClass: 'SELF_CLAIMED',
  issuerRef: 'agent.example',
  actor,
  subject,
  claim: { message: 'The refund is complete.' }
});
unprovablePayload.events.push(claimed);
const unprovable = { payload: unprovablePayload, proofs: [] };
addProof(unprovable, {
  target: { target_type: 'OUTCOME_EVENT', target_id: claimed.event_id },
  issuerRef: 'agent.example', keyId: 'agent-test-01', privateKeyPem: keys.agent.privateKey,
  proofId: 'tpp_claimed', createdAt: '2026-07-23T14:31:56Z'
});
addProof(unprovable, {
  target: { target_type: 'BUNDLE_PAYLOAD' },
  issuerRef: 'agent.example', keyId: 'agent-test-01', privateKeyPem: keys.agent.privateKey,
  proofId: 'tpp_unprovable_bundle', createdAt: '2026-07-23T14:32:09Z'
});

await writeJson('test-vectors/valid/refund-pending.bundle.json', pending);
await writeJson('test-vectors/valid/refund-verified.bundle.json', verified);
await writeJson('test-vectors/valid/refund-contradicted.bundle.json', contradicted);
await writeJson('test-vectors/valid/refund-unprovable.bundle.json', unprovable);
await writeJson('examples/refund/refund-pending.bundle.json', pending);
await writeJson('examples/refund/refund-verified.bundle.json', verified);
await writeJson('examples/refund/refund-contradicted.bundle.json', contradicted);

const invalidManifest = {};
async function writeInvalid(fileName, bundleOrText, expectedCode) {
  const relativePath = `test-vectors/invalid/${fileName}`;
  if (typeof bundleOrText === 'string') {
    await writeFile(resolve(root, relativePath), bundleOrText.endsWith('\n') ? bundleOrText : `${bundleOrText}\n`, 'utf8');
  } else {
    await writeJson(relativePath, bundleOrText);
  }
  invalidManifest[fileName] = expectedCode;
}

const digestMismatch = clone(pending);
digestMismatch.payload.events[2].claim.amount = '80.00';
await writeInvalid('digest-mismatch.bundle.json', digestMismatch, 'OBJECT_DIGEST_MISMATCH');

const signatureMismatch = clone(verified);
const firstSignature = signatureMismatch.proofs[0].proof_value;
signatureMismatch.proofs[0].proof_value = `${firstSignature[0] === 'A' ? 'B' : 'A'}${firstSignature.slice(1)}`;
await writeInvalid('signature-mismatch.bundle.json', signatureMismatch, 'SIGNATURE_INVALID');

const unresolvedParent = makeCommon('tpb_refund_bad_parent_001').bundle;
const createdIndex = unresolvedParent.payload.events.findIndex((item) => item.event_id === 'tpe_refund_created');
unresolvedParent.payload.events[createdIndex].parent_event_digests = [{ algorithm: 'sha-256', value: '0'.repeat(64) }];
unresolvedParent.payload.events[createdIndex].object_digest = calculateObjectDigest(unresolvedParent.payload.events[createdIndex]);
unresolvedParent.proofs = unresolvedParent.proofs.filter((proof) => proof.target.target_id !== 'tpe_refund_created');
addProof(unresolvedParent, {
  target: { target_type: 'OUTCOME_EVENT', target_id: 'tpe_refund_created' },
  issuerRef: 'merchant.example', keyId: 'merchant-test-01', privateKeyPem: keys.merchant.privateKey,
  proofId: 'tpp_bad_parent_created', createdAt: '2026-07-23T14:30:07Z'
});
addProof(unresolvedParent, {
  target: { target_type: 'BUNDLE_PAYLOAD' },
  issuerRef: 'gateway.example', keyId: 'gateway-test-01', privateKeyPem: keys.gateway.privateKey,
  proofId: 'tpp_bad_parent_bundle', createdAt: '2026-07-23T14:32:09Z'
});
await writeInvalid('unresolved-parent.bundle.json', unresolvedParent, 'PARENT_EVENT_NOT_FOUND');

await writeInvalid('duplicate-key.json', '{"payload":{"bundle_id":"first","bundle_id":"second"},"proofs":[]}\n', 'DUPLICATE_PROPERTY');
await writeInvalid('extra-top-level-member.json', JSON.stringify({ ...pending, unexpected: true }, null, 2) + '\n', 'TOP_LEVEL_MEMBERS_INVALID');

const eventExtraMember = clone(unprovable);
eventExtraMember.proofs = [];
eventExtraMember.payload.events[0].unexpected = true;
eventExtraMember.payload.events[0].object_digest = calculateObjectDigest(eventExtraMember.payload.events[0]);
await writeInvalid('event-extra-member.bundle.json', eventExtraMember, 'EVENT_MEMBERS_INVALID');

const invalidLocator = clone(pending);
invalidLocator.proofs = invalidLocator.proofs.filter((proof) => proof.target.target_type !== 'BUNDLE_PAYLOAD');
invalidLocator.payload.evidence[0].locator.scheme = 's3';
invalidLocator.payload.evidence[0].object_digest = calculateObjectDigest(invalidLocator.payload.evidence[0]);
await writeInvalid('invalid-locator.bundle.json', invalidLocator, 'LOCATOR_SCHEME_INVALID');

const invalidDisclosure = clone(pending);
invalidDisclosure.proofs = invalidDisclosure.proofs.filter((proof) => proof.target.target_type !== 'BUNDLE_PAYLOAD');
invalidDisclosure.payload.evidence[0].disclosure = 'SECRET';
invalidDisclosure.payload.evidence[0].object_digest = calculateObjectDigest(invalidDisclosure.payload.evidence[0]);
await writeInvalid('invalid-disclosure.bundle.json', invalidDisclosure, 'DISCLOSURE_INVALID');

const relationshipMissing = clone(pending);
relationshipMissing.proofs = relationshipMissing.proofs.filter((proof) => proof.target.target_type !== 'BUNDLE_PAYLOAD');
relationshipMissing.payload.relationships[0].to_ref = 'event:missing-event';
relationshipMissing.payload.relationships[0].object_digest = calculateObjectDigest(relationshipMissing.payload.relationships[0]);
await writeInvalid('relationship-target-missing.bundle.json', relationshipMissing, 'RELATIONSHIP_TO_NOT_FOUND');

const duplicateObjectId = clone(pending);
duplicateObjectId.proofs = duplicateObjectId.proofs.filter((proof) => proof.target.target_type !== 'BUNDLE_PAYLOAD');
duplicateObjectId.payload.relationships[0].relationship_id = duplicateObjectId.payload.events[0].event_id;
duplicateObjectId.payload.relationships[0].object_digest = calculateObjectDigest(duplicateObjectId.payload.relationships[0]);
await writeInvalid('duplicate-object-id.bundle.json', duplicateObjectId, 'DUPLICATE_OBJECT_ID');

const invalidPayloadTimestamp = clone(pending);
invalidPayloadTimestamp.proofs = invalidPayloadTimestamp.proofs.filter((proof) => proof.target.target_type !== 'BUNDLE_PAYLOAD');
invalidPayloadTimestamp.payload.created_at = '2026-02-30T14:32:08Z';
await writeInvalid('invalid-payload-timestamp.bundle.json', invalidPayloadTimestamp, 'CREATED_AT_INVALID');

const proofTargetMismatch = clone(verified);
proofTargetMismatch.proofs[0].target.digest.value = '0'.repeat(64);
await writeInvalid('proof-target-digest-mismatch.bundle.json', proofTargetMismatch, 'PROOF_TARGET_DIGEST_MISMATCH');

const invalidKeyInterval = clone(pending);
invalidKeyInterval.proofs = [];
invalidKeyInterval.payload.issuers[2].keys[0].valid_from = '2026-08-01T00:00:00Z';
invalidKeyInterval.payload.issuers[2].keys[0].valid_until = '2026-07-01T00:00:00Z';
await writeInvalid('invalid-key-interval.bundle.json', invalidKeyInterval, 'KEY_VALIDITY_INTERVAL_INVALID');

await writeJson('test-vectors/invalid/manifest.json', invalidManifest);

const canonicalInput = {
  z: 3,
  a: 'é',
  nested: { beta: true, alpha: null },
  array: [3, 1, { y: 'line\nbreak', x: -0 }]
};
await writeJson('test-vectors/canonicalization/input.json', canonicalInput);
await writeFile(resolve(root, 'test-vectors/canonicalization/expected.txt'), `${canonicalize(canonicalInput)}\n`, 'utf8');

const canonicalVectors = [
  {
    id: 'unicode-preserved-and-utf16-sorted',
    input: { z: 'last', 'é': 'precomposed', 'é': 'decomposed', '😀': 'face', a: 'first' },
    expected: '{"a":"first","é":"decomposed","z":"last","é":"precomposed","😀":"face"}'
  },
  {
    id: 'ecmascript-number-serialization',
    input: [333333333.33333329, 1E30, 4.50, 2e-3, 0.000000000000000000000000001, -0],
    expected: '[333333333.3333333,1e+30,4.5,0.002,1e-27,0]'
  },
  {
    id: 'arrays-nested-objects-and-null',
    input: { z: null, a: [3, { b: true, a: false }], m: { d: null, c: [] } },
    expected: '{"a":[3,{"a":false,"b":true}],"m":{"c":[],"d":null},"z":null}'
  },
  {
    id: 'null-member-is-present',
    input: { a: 1, b: null },
    expected: '{"a":1,"b":null}'
  },
  {
    id: 'member-is-omitted',
    input: { a: 1 },
    expected: '{"a":1}'
  }
];
await writeJson('test-vectors/canonicalization/vectors.json', canonicalVectors);

for (const [name, bundle] of Object.entries({ pending, verified, contradicted, unprovable })) {
  const verification = verifyBundle(bundle);
  const verdict = evaluateBundle(bundle, 'refund-v0.1');
  await writeJson(`site/data/refund-${name}.bundle.json`, bundle);
  await writeJson(`site/data/refund-${name}.verification.json`, verification);
  await writeJson(`site/data/refund-${name}.verdict.json`, verdict);
}

console.log('Generated deterministic test vectors and site data.');
