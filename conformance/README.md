# TimeProofs Conformance Harness

The conformance harness is the implementation-independent interoperability contract for `TP-JSON-0.1`.

It is deliberately separate from the reference CLI. An implementation conforms by reproducing the machine-readable expected outputs in `manifest-v0.1.json`, not by matching human text printed by the Node.js tools.

## Authorities

- `manifest-v0.1.json` — committed expected results;
- `manifest-v0.1.sha256` — integrity sidecar for the committed manifest bytes;
- `runner-contract-v0.1.json` — language-neutral JSON Lines adapter contract;
- `../spec/CONFORMANCE_HARNESS_V0_1.md` — normative comparison and execution rules;
- `../docs/architecture/SECOND_IMPLEMENTATION_PLAN.md` — independence boundaries for the Python implementation.

## Reference execution

```bash
npm run conformance
```

The reference runner checks:

1. fixture byte hashes;
2. canonical JSON, UTF-8 bytes, and SHA-256 values;
3. domain-separated signature input bytes;
4. structural status;
5. exact stable error and warning code sets;
6. payload digests;
7. exact valid proof sets;
8. summary counts.

Diagnostic messages, paths, and ordering are intentionally non-normative.

## External implementation mode

A second implementation exposes the JSON Lines operations defined in `runner-contract-v0.1.json`. A future adapter driver will send manifest cases to that process and compare its responses to the same committed manifest.

The external implementation MUST treat fixture files as immutable inputs and MUST verify each input SHA-256 before processing it.
