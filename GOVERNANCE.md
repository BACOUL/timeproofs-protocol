# Governance

TimeProofs uses lightweight, evidence-driven governance.

## Normative authority

For a released version, authority is ordered as follows:

1. versioned specification;
2. published schemas;
3. normative test vectors;
4. reference implementation;
5. explanatory documentation.

When these conflict during alpha development, the conflict must be documented and resolved before release.

## Change classes

- **Patch:** editorial corrections and implementation fixes that do not change accepted data.
- **Minor:** backward-compatible fields, event types, or profiles.
- **Major:** incompatible changes to canonical bytes, required fields, digest scope, or verification behavior.

## Pull request requirements

Protocol-changing pull requests must include:

- motivation;
- normative change;
- compatibility impact;
- security and privacy impact;
- valid and invalid test vectors;
- implementation tests.

No implementation behavior becomes normative solely because it exists in code.
