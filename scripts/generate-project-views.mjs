import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const statePath = path.join(root, 'governance', 'project-state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

const statusCounts = state.workstreams.reduce((acc, item) => {
  acc[item.status] = (acc[item.status] ?? 0) + 1;
  return acc;
}, {});

const gateRows = state.gates
  .map((gate) => `| ${gate.id} | ${gate.name} | ${gate.status} |`)
  .join('\n');

const workstreamRows = state.workstreams
  .map((ws) => `| ${ws.id} | ${ws.name} | ${ws.status} |`)
  .join('\n');

const completed = state.completed_foundation.map((item) => `- ${item}`).join('\n');
const blockers = state.blockers.map((item) => `- ${item}`).join('\n');

const currentStatus = `# Current Status

Generated from \`governance/project-state.json\`. Do not edit manually.

As of: ${state.as_of}

## Project

- Name: **${state.project}**
- Stage: \`${state.stage}\`
- Current phase: **${state.current_phase.id} — ${state.current_phase.name}** (\`${state.current_phase.status}\`)
- Current milestone: **${state.current_milestone.id} — ${state.current_milestone.name}** (\`${state.current_milestone.status}\`)
- Unique next action: **${state.next_action.id} — ${state.next_action.title}**

## Completed foundation

${completed}

## Current blockers

${blockers}

## Workstreams

| ID | Workstream | Status |
|---|---|---|
${workstreamRows}

Status counts: ${Object.entries(statusCounts).map(([key, value]) => `${key}=${value}`).join(', ')}.

## Release gates

| Gate | Name | Status |
|---|---|---|
${gateRows}

## Required reading

Read \`AGENTS.md\` and \`governance/GLOBAL_MASTER_PLAN.md\` before starting work.
`;

const criteria = state.next_action.acceptance_criteria.map((item) => `- ${item}`).join('\n');
const nonScope = state.next_action.non_scope.map((item) => `- ${item}`).join('\n');

const nextAction = `# Next Action

Generated from \`governance/project-state.json\`. Do not edit manually.

## ${state.next_action.id} — ${state.next_action.title}

- Workstream: \`${state.next_action.workstream}\`
- Phase: \`${state.current_phase.id}\`
- Milestone: \`${state.current_milestone.id}\`

## Purpose

${state.next_action.purpose}

## Acceptance criteria

${criteria}

## Explicit non-scope

${nonScope}

## Completion procedure

1. Implement only the approved scope.
2. Add tests and acceptance evidence.
3. Review decisions, risks, assumptions, competitors, compatibility, security, privacy, site, business, and operations impacts.
4. Update \`governance/project-state.json\` when milestone state changes.
5. Run \`npm run project:generate\`, \`npm test\`, and \`npm run project:validate\`.
`;

fs.writeFileSync(path.join(root, 'governance', 'CURRENT_STATUS.md'), currentStatus);
fs.writeFileSync(path.join(root, 'governance', 'NEXT_ACTION.md'), nextAction);
fs.writeFileSync(path.join(root, 'NEXT_ACTION.md'), nextAction);
console.log('Generated CURRENT_STATUS.md and NEXT_ACTION.md views.');
