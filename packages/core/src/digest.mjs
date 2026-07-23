import { createHash } from 'node:crypto';
import { canonicalizeBytes } from './canonicalize.mjs';

export const SHA256_PATTERN = /^[0-9a-f]{64}$/u;

export function sha256Hex(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

export function digestValue(value) {
  return {
    algorithm: 'sha-256',
    value: sha256Hex(canonicalizeBytes(value))
  };
}

export function withoutMember(value, memberName) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('withoutMember expects an object');
  }
  const copy = Object.create(null);
  for (const key of Object.keys(value)) {
    if (key !== memberName) copy[key] = value[key];
  }
  return copy;
}

export function calculateObjectDigest(value) {
  return digestValue(withoutMember(value, 'object_digest'));
}

export function calculatePayloadDigest(bundleOrPayload) {
  const payload = Object.hasOwn(bundleOrPayload, 'payload') ? bundleOrPayload.payload : bundleOrPayload;
  return digestValue(payload);
}

export function digestEquals(left, right) {
  return Boolean(
    left && right &&
    left.algorithm === right.algorithm &&
    left.value === right.value
  );
}
