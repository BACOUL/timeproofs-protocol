import { readFileSync } from 'node:fs';

const registryUrl = new URL('../../../spec/error-codes-v0.1.json', import.meta.url);
const document = JSON.parse(readFileSync(registryUrl, 'utf8'));

export const ERROR_CODE_REGISTRY = Object.freeze(
  Object.fromEntries(document.codes.map((entry) => [entry.code, Object.freeze(entry)]))
);

export function isKnownErrorCode(code) {
  return Object.hasOwn(ERROR_CODE_REGISTRY, code);
}

export function assertKnownErrorCode(code) {
  if (!isKnownErrorCode(code)) {
    throw new TypeError(`UNREGISTERED_ERROR_CODE: ${code}`);
  }
  return code;
}
