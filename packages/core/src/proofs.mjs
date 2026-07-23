import { createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { buildSignatureInput } from './signature-input.mjs';
import { calculatePayloadDigest, digestEquals } from './digest.mjs';

function base64urlEncode(bytes) {
  return Buffer.from(bytes).toString('base64url');
}

function base64urlDecode(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/u.test(value)) {
    throw new TypeError('INVALID_BASE64URL');
  }
  return Buffer.from(value, 'base64url');
}

export function resolveTarget(bundle, target) {
  if (!target || typeof target !== 'object') return null;
  if (target.target_type === 'BUNDLE_PAYLOAD') {
    return {
      id: bundle.payload.bundle_id,
      digest: calculatePayloadDigest(bundle),
      value: bundle.payload
    };
  }

  const mapping = {
    OUTCOME_EVENT: ['events', 'event_id'],
    EVIDENCE_ITEM: ['evidence', 'evidence_id'],
    RELATIONSHIP: ['relationships', 'relationship_id']
  };
  const definition = mapping[target.target_type];
  if (!definition) return null;
  const [collectionName, idField] = definition;
  const object = bundle.payload[collectionName]?.find((item) => item[idField] === target.target_id);
  if (!object) return null;
  return {
    id: object[idField],
    digest: object.object_digest,
    value: object
  };
}

export function createSignatureProof({
  bundle,
  target,
  issuerRef,
  keyId,
  privateKeyPem,
  proofId,
  createdAt
}) {
  const resolved = resolveTarget(bundle, target);
  if (!resolved?.digest) throw new TypeError('UNRESOLVED_PROOF_TARGET');
  const input = buildSignatureInput({
    specVersion: bundle.payload.spec_version,
    profile: bundle.payload.profile,
    targetType: target.target_type,
    targetDigest: resolved.digest
  });
  const privateKey = createPrivateKey(privateKeyPem);
  const signature = sign(null, input, privateKey);
  return {
    proof_id: proofId,
    proof_type: 'SIGNATURE',
    target: {
      ...target,
      digest: resolved.digest
    },
    issuer_ref: issuerRef,
    verification_method: `${issuerRef}#${keyId}`,
    created_at: createdAt,
    algorithm: 'Ed25519',
    proof_value: base64urlEncode(signature)
  };
}

export function verifySignatureProof(bundle, proof, issuer) {
  const resolved = resolveTarget(bundle, proof.target);
  if (!resolved) {
    return { valid: false, code: 'PROOF_TARGET_NOT_FOUND' };
  }
  if (!digestEquals(resolved.digest, proof.target.digest)) {
    return { valid: false, code: 'PROOF_TARGET_DIGEST_MISMATCH' };
  }
  const separator = proof.verification_method.lastIndexOf('#');
  if (separator <= 0) return { valid: false, code: 'INVALID_VERIFICATION_METHOD' };
  const issuerId = proof.verification_method.slice(0, separator);
  const keyId = proof.verification_method.slice(separator + 1);
  if (issuerId !== proof.issuer_ref || issuer?.issuer_id !== issuerId) {
    return { valid: false, code: 'PROOF_ISSUER_MISMATCH' };
  }
  const key = issuer.keys?.find((candidate) => candidate.key_id === keyId);
  if (!key) return { valid: false, code: 'VERIFICATION_KEY_NOT_FOUND' };
  if (proof.algorithm !== 'Ed25519' || key.algorithm !== 'Ed25519') {
    return { valid: false, code: 'UNSUPPORTED_SIGNATURE_ALGORITHM' };
  }
  if (key.format !== 'spki-pem') return { valid: false, code: 'UNSUPPORTED_PUBLIC_KEY_FORMAT' };

  try {
    const input = buildSignatureInput({
      specVersion: bundle.payload.spec_version,
      profile: bundle.payload.profile,
      targetType: proof.target.target_type,
      targetDigest: proof.target.digest
    });
    const publicKey = createPublicKey(key.public_key);
    const signature = base64urlDecode(proof.proof_value);
    const valid = verify(null, input, publicKey, signature);
    return valid ? { valid: true, code: 'SIGNATURE_VALID' } : { valid: false, code: 'SIGNATURE_INVALID' };
  } catch (error) {
    return { valid: false, code: 'SIGNATURE_PROCESSING_ERROR', detail: error.message };
  }
}
