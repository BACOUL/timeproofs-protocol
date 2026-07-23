export class StrictJsonError extends SyntaxError {
  constructor(code, message, position) {
    super(`${code} at position ${position}: ${message}`);
    this.name = 'StrictJsonError';
    this.code = code;
    this.position = position;
  }
}

export function assertValidUnicode(value, path = '$') {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new TypeError(`UNPAIRED_HIGH_SURROGATE at ${path}`);
      }
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new TypeError(`UNPAIRED_LOW_SURROGATE at ${path}`);
    }
  }
}

export function parseJsonStrict(text) {
  if (typeof text !== 'string') {
    throw new TypeError('JSON input must be a string');
  }

  let position = 0;

  function fail(code, message, at = position) {
    throw new StrictJsonError(code, message, at);
  }

  function skipWhitespace() {
    while (position < text.length && /[\u0009\u000a\u000d\u0020]/u.test(text[position])) {
      position += 1;
    }
  }

  function parseString() {
    if (text[position] !== '"') fail('EXPECTED_STRING', 'Expected opening quote');
    position += 1;
    let output = '';

    while (position < text.length) {
      const character = text[position];
      if (character === '"') {
        position += 1;
        assertValidUnicode(output);
        return output;
      }

      if (character === '\\') {
        position += 1;
        if (position >= text.length) fail('INVALID_ESCAPE', 'Unterminated escape sequence');
        const escape = text[position];
        position += 1;
        const simple = {
          '"': '"',
          '\\': '\\',
          '/': '/',
          b: '\b',
          f: '\f',
          n: '\n',
          r: '\r',
          t: '\t'
        };
        if (Object.hasOwn(simple, escape)) {
          output += simple[escape];
          continue;
        }
        if (escape !== 'u') fail('INVALID_ESCAPE', `Unsupported escape \\${escape}`, position - 2);

        const firstHex = text.slice(position, position + 4);
        if (!/^[0-9a-fA-F]{4}$/u.test(firstHex)) {
          fail('INVALID_UNICODE_ESCAPE', 'Expected four hexadecimal digits', position);
        }
        position += 4;
        const first = Number.parseInt(firstHex, 16);

        if (first >= 0xd800 && first <= 0xdbff) {
          if (text.slice(position, position + 2) !== '\\u') {
            fail('UNPAIRED_HIGH_SURROGATE', 'High surrogate must be followed by a low surrogate escape', position);
          }
          position += 2;
          const secondHex = text.slice(position, position + 4);
          if (!/^[0-9a-fA-F]{4}$/u.test(secondHex)) {
            fail('INVALID_UNICODE_ESCAPE', 'Expected four hexadecimal digits for low surrogate', position);
          }
          position += 4;
          const second = Number.parseInt(secondHex, 16);
          if (!(second >= 0xdc00 && second <= 0xdfff)) {
            fail('UNPAIRED_HIGH_SURROGATE', 'Expected low surrogate escape', position - 4);
          }
          output += String.fromCharCode(first, second);
          continue;
        }

        if (first >= 0xdc00 && first <= 0xdfff) {
          fail('UNPAIRED_LOW_SURROGATE', 'Low surrogate cannot appear without a preceding high surrogate', position - 4);
        }

        output += String.fromCharCode(first);
        continue;
      }

      const code = text.charCodeAt(position);
      if (code < 0x20) fail('UNESCAPED_CONTROL_CHARACTER', 'Control characters must be escaped');
      if (code >= 0xd800 && code <= 0xdbff) {
        const next = text.charCodeAt(position + 1);
        if (!(next >= 0xdc00 && next <= 0xdfff)) {
          fail('UNPAIRED_HIGH_SURROGATE', 'Invalid Unicode scalar value');
        }
        output += text[position] + text[position + 1];
        position += 2;
        continue;
      }
      if (code >= 0xdc00 && code <= 0xdfff) {
        fail('UNPAIRED_LOW_SURROGATE', 'Invalid Unicode scalar value');
      }
      output += character;
      position += 1;
    }

    fail('UNTERMINATED_STRING', 'String was not terminated');
  }

  function parseNumber() {
    const start = position;
    if (text[position] === '-') position += 1;

    if (text[position] === '0') {
      position += 1;
      if (/[0-9]/u.test(text[position] ?? '')) {
        fail('LEADING_ZERO', 'Leading zero is not permitted', position);
      }
    } else if (/[1-9]/u.test(text[position] ?? '')) {
      while (/[0-9]/u.test(text[position] ?? '')) position += 1;
    } else {
      fail('INVALID_NUMBER', 'Expected integer component');
    }

    if (text[position] === '.') {
      position += 1;
      if (!/[0-9]/u.test(text[position] ?? '')) fail('INVALID_NUMBER', 'Expected fraction digit');
      while (/[0-9]/u.test(text[position] ?? '')) position += 1;
    }

    if (text[position] === 'e' || text[position] === 'E') {
      position += 1;
      if (text[position] === '+' || text[position] === '-') position += 1;
      if (!/[0-9]/u.test(text[position] ?? '')) fail('INVALID_NUMBER', 'Expected exponent digit');
      while (/[0-9]/u.test(text[position] ?? '')) position += 1;
    }

    const raw = text.slice(start, position);
    const value = Number(raw);
    if (!Number.isFinite(value)) fail('NON_FINITE_NUMBER', 'Number is outside the supported finite range', start);
    return value;
  }

  function parseArray() {
    position += 1;
    const result = [];
    skipWhitespace();
    if (text[position] === ']') {
      position += 1;
      return result;
    }

    while (true) {
      result.push(parseValue());
      skipWhitespace();
      if (text[position] === ']') {
        position += 1;
        return result;
      }
      if (text[position] !== ',') fail('EXPECTED_COMMA', 'Expected comma between array elements');
      position += 1;
      skipWhitespace();
    }
  }

  function parseObject() {
    position += 1;
    const result = Object.create(null);
    const keys = new Set();
    skipWhitespace();
    if (text[position] === '}') {
      position += 1;
      return result;
    }

    while (true) {
      if (text[position] !== '"') fail('EXPECTED_PROPERTY_NAME', 'Object property names must be strings');
      const keyPosition = position;
      const key = parseString();
      if (keys.has(key)) fail('DUPLICATE_PROPERTY', `Duplicate property name ${JSON.stringify(key)}`, keyPosition);
      keys.add(key);
      skipWhitespace();
      if (text[position] !== ':') fail('EXPECTED_COLON', 'Expected colon after property name');
      position += 1;
      skipWhitespace();
      result[key] = parseValue();
      skipWhitespace();
      if (text[position] === '}') {
        position += 1;
        return result;
      }
      if (text[position] !== ',') fail('EXPECTED_COMMA', 'Expected comma between object members');
      position += 1;
      skipWhitespace();
    }
  }

  function parseKeyword(keyword, value) {
    if (text.slice(position, position + keyword.length) !== keyword) {
      fail('INVALID_LITERAL', `Expected ${keyword}`);
    }
    position += keyword.length;
    return value;
  }

  function parseValue() {
    skipWhitespace();
    const character = text[position];
    if (character === '"') return parseString();
    if (character === '{') return parseObject();
    if (character === '[') return parseArray();
    if (character === 't') return parseKeyword('true', true);
    if (character === 'f') return parseKeyword('false', false);
    if (character === 'n') return parseKeyword('null', null);
    if (character === '-' || /[0-9]/u.test(character ?? '')) return parseNumber();
    fail('UNEXPECTED_TOKEN', `Unexpected token ${JSON.stringify(character)}`);
  }

  const value = parseValue();
  skipWhitespace();
  if (position !== text.length) fail('TRAILING_DATA', 'Unexpected data after JSON value');
  return value;
}
