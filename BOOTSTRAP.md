# GitHub Bootstrap

The ChatGPT GitHub connector used to prepare this project cannot create a new repository. This directory is therefore prepared as a complete local Git repository.

## Recommended repository

```text
BACOUL/timeproofs-protocol
```

## Create and push with GitHub CLI

From the parent directory:

```bash
gh repo create BACOUL/timeproofs-protocol \
  --public \
  --description "Open evidence protocol and reference verifier for AI action outcomes" \
  --source timeproofs-protocol \
  --remote origin \
  --push
```

## Create through the GitHub website

1. Create a public repository named `timeproofs-protocol` without a generated README, license, or `.gitignore`.
2. Copy the repository URL.
3. Run:

```bash
cd timeproofs-protocol
git remote add origin https://github.com/BACOUL/timeproofs-protocol.git
git push -u origin main
```

## Required repository settings after push

- default branch: `main`;
- require pull requests before merging;
- require the `TimeProofs Protocol CI` check;
- disable force pushes on `main`;
- enable secret scanning and push protection when available;
- keep Discussions disabled until the contribution process is ready;
- do not publish packages or releases during the experimental foundation stage.
