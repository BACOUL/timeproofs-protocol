import { canonicalizeBytes } from './canonicalize.mjs';

export const SIGNATURE_DOMAIN = 'org.timeproofs.signature.v0.1';

export function buildSignatureInput({ specVersion, profile, targetType, targetDigest }) {
  return canonicalizeBytes({
    domain: SIGNATURE_DOMAIN,
    profile,
    spec_version: specVersion,
    target_digest: targetDigest,
    target_type: targetType
  });
}
