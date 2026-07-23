import { assertValidUnicode } from './strict-json.mjs';

function compareUtf16(left, right) {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = left.charCodeAt(index) - right.charCodeAt(index);
    if (difference !== 0) return difference;
  }
  return left.length - right.length;
}

export function canonicalize(value, path = '$') {
  if (value === null) return 'null';

  switch (typeof value) {
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number': {
      if (!Number.isFinite(value)) throw new TypeError(`NON_FINITE_NUMBER at ${path}`);
      return JSON.stringify(value);
    }
    case 'string':
      assertValidUnicode(value, path);
      return JSON.stringify(value);
    case 'object': {
      if (Array.isArray(value)) {
        return `[${value.map((item, index) => canonicalize(item, `${path}[${index}]`)).join(',')}]`;
      }
      const keys = Object.keys(value).sort(compareUtf16);
      const members = keys.map((key) => {
        assertValidUnicode(key, `${path} property`);
        const member = value[key];
        if (member === undefined || typeof member === 'function' || typeof member === 'symbol') {
          throw new TypeError(`UNSUPPORTED_JSON_VALUE at ${path}.${key}`);
        }
        return `${JSON.stringify(key)}:${canonicalize(member, `${path}.${key}`)}`;
      });
      return `{${members.join(',')}}`;
    }
    default:
      throw new TypeError(`UNSUPPORTED_JSON_VALUE at ${path}`);
  }
}

export function canonicalizeBytes(value) {
  return Buffer.from(canonicalize(value), 'utf8');
}
