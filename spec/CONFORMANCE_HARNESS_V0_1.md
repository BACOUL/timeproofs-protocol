# TimeProofs Conformance Harness v0.1

Status: EXPERIMENTAL NORMATIVE DRAFT  
Profile: `TP-JSON-0.1`

## 1. Purpose

The TimeProofs conformance harness defines a language-neutral contract for demonstrating that independent implementations agree on the protocol outputs that affect interoperability.

Conformance is determined by machine-readable expected results, not by CLI text, source-code structure, internal function names, diagnostic prose, or repository file enumeration order.

## 2. Conformance authorities

The following files jointly define the v0.1 harness:

- `conformance/manifest-v0.1.json`;
- `conformance/manifest-v0.1.sha256`;
- `conformance/runner-contract-v0.1.json`;
- the protocol specifications and registries referenced by the manifest.

The manifest is immutable for a released conformance version. Any expected-output change requires a reviewed manifest revision and a new recorded manifest digest.

## 3. Case classes

### 3.1 Canonicalization cases

Each case defines:

- an input JSON value;
- expected canonical JSON text;
- expected UTF-8 bytes encoded as lowercase hexadecimal;
- expected SHA-256 of those UTF-8 bytes.

An implementation MUST match all three expected outputs exactly.

### 3.2 Signature-input cases

Each case defines the protocol version, profile, target type, and target digest used to construct a domain-separated signing input.

An implementation MUST reproduce:

- the exact UTF-8 signing-input text;
- the exact lowercase hexadecimal byte representation;
- the exact SHA-256 of the signing input.

These cases test construction of the signed context. They do not replace signature verification cases contained in Evidence Bundles.

### 3.3 Bundle cases

Each bundle case identifies the original repository-relative input path and the SHA-256 of the original file bytes.

An implementation MUST verify the byte hash before parsing. It MUST NOT silently substitute a reserialized fixture.

For every bundle case, implementations compare:

- structural status;
- payload digest or `null`;
- exact set of stable error codes;
- exact set of stable warning codes;
- exact set of valid proofs, normalized and sorted by `proof_id`;
- summary counts or `null`.

## 4. Normative normalization

Before comparison:

1. error codes are deduplicated and sorted lexicographically;
2. warning codes are deduplicated and sorted lexicographically;
3. valid proofs are normalized to `proof_id`, `issuer_ref`, target type, optional target ID, and target digest;
4. normalized valid proofs are sorted lexicographically by `proof_id`;
5. JSON object member order is ignored;
6. array order remains significant except for fields explicitly normalized as sets above.

Human-readable diagnostic messages and paths are non-normative.

## 5. Runner contract

An external implementation MUST support the operations defined in `conformance/runner-contract-v0.1.json` or provide an adapter producing equivalent responses.

The transport is JSON Lines over standard input and standard output:

- one request per line;
- one response per line;
- response order matches request order;
- standard error is non-normative;
- process failure or malformed responses fail conformance.

## 6. Fixture integrity

The SHA-256 in each bundle case binds the original input bytes, including insignificant whitespace and duplicate members where present.

This is necessary because strict parsing behavior cannot be tested from a reconstructed JSON object.

A mismatched input digest is a harness failure, not a protocol verdict.

## 7. Pass criteria

An implementation passes v0.1 only when all committed cases match exactly under the normalization rules.

Partial passes MAY be reported by category, but MUST NOT be described as full conformance.

The reference implementation passing the harness demonstrates internal consistency only. Interoperability alpha requires a second implementation developed under the independence boundaries in `docs/architecture/SECOND_IMPLEMENTATION_PLAN.md`.

## 8. Change control

The following require an intentional conformance manifest revision:

- changed canonical bytes;
- changed digest output;
- changed signature-input bytes;
- changed structural status;
- added, removed, or repurposed stable codes;
- changed valid-proof classification;
- fixture byte changes.

Editorial diagnostic text changes do not require a manifest revision when normalized outputs remain unchanged.

## 9. Security considerations

A conformance pass does not establish issuer trust, factual truth, legal validity, resistance to all parser differentials, or implementation security.

Implementations still require independent security review, negative testing, dependency review, and operational hardening.
