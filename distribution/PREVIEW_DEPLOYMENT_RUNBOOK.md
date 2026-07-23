# Validation Preview Deployment Runbook

Status: DEPLOYED, VALIDATION IN PROGRESS  
Target repository: `BACOUL/timeproofs-protocol`  
Target surface: GitHub Pages experimental preview

## Purpose

Publish the committed static validation preview without migrating `timeproofs.io`, making production claims, or requiring managed infrastructure.

## Completed deployment

- Repository created: `BACOUL/timeproofs-protocol`
- Complete prepared history imported on `main`
- GitHub Pages source configured to GitHub Actions
- Validation preview deployed successfully

Public preview URL:

```text
https://bacoul.github.io/timeproofs-protocol/
```

## Mandatory pre-deployment checks

```bash
npm ci
npm run packets
npm run site:validate
npm test
git diff --exit-code
```

## Public-claim boundaries

The preview MUST remain labelled experimental. It MUST NOT claim:

- production readiness;
- customers or adoption;
- legal truth or official certification;
- protocol interoperability alpha;
- regulatory compliance;
- final pricing;
- a live managed service.

## Evidence collection

Share the preview with independent participants without explaining the correct answers first.

Participants download anonymous JSON files. Store returned files only with their consent under the appropriate evidence directory and run:

```bash
npm run validation:analyze
```

Do not treat a downloaded form, positive comment, or sandbox interest as a customer or purchase commitment.

## Rollback

Disable the Pages environment or remove the Pages workflow. This does not affect `timeproofs.io` or the historical AgentReady repository.
