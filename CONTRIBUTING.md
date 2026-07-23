# Contributing

Contributions are welcome during the experimental phase.

## Before proposing a protocol change

1. State the concrete interoperability or security problem.
2. Identify the affected invariant.
3. Explain whether existing bundles remain valid.
4. Add or update test vectors.
5. Avoid introducing protocol-specific assumptions into the abstract model.

## Development

```bash
npm test
```

The repository intentionally uses no production dependency for canonicalization or signature verification in the initial reference implementation.

## Commit style

Use focused commits such as:

```text
spec(bundle): define evidence locator privacy rules
test(verifier): reject unresolved causal parent
feat(cli): add machine-readable verification report
```
