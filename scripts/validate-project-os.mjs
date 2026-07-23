import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));

const requiredFiles = [
  'AGENTS.md',
  'PROJECT_START_HERE.md',
  'governance/project-state.json',
  'governance/GLOBAL_MASTER_PLAN.md',
  'governance/GLOBAL_ROADMAP.md',
  'governance/CURRENT_STATUS.md',
  'governance/NEXT_ACTION.md',
  'governance/DECISION_LOG.md',
  'governance/CHANGE_CONTROL.md',
  'governance/RISK_REGISTER.md',
  'governance/ASSUMPTIONS_REGISTER.md',
  'governance/RELEASE_GATES.md',
  'governance/DEFINITION_OF_DONE.md',
  'governance/REVIEW_CADENCE.md',
  'strategy/CATEGORY_AND_POSITIONING.md',
  'strategy/BUSINESS_MODEL.md',
  'strategy/MOAT_STRATEGY.md',
  'strategy/COMPETITOR_RADAR.md',
  'strategy/MARKET_WATCH.md',
  'integrations/AGENTIC_COMMERCE_AND_ACTIONS.md',
  'integrations/COMPATIBILITY_MATRIX.md',
  'integrations/MCP.md',
  'integrations/A2A.md',
  'integrations/ACP.md',
  'integrations/UCP.md',
  'integrations/AP2.md',
  'site-strategy/SITE_MASTER_PLAN.md',
  'site-strategy/SEO_GLOBAL_PLAN.md',
  'site-strategy/GEO_AI_FIRST_PLAN.md',
  'site-strategy/CONTENT_ARCHITECTURE.md',
  'site-strategy/INTERNATIONALIZATION.md',
  'site-strategy/BRAND_AND_NAMING.md',
  'security-program/SECURITY_PROGRAM.md',
  'security-program/KEY_LIFECYCLE.md',
  'privacy-legal/PRIVACY_LEGAL_PROGRAM.md',
  'business/REVENUE_AND_PRICING_PLAN.md',
  'business/METRICS_AND_EXPERIMENTS.md',
  'distribution/DISTRIBUTION_AND_ADOPTION.md',
  'operations/OPERATIONS_PLAN.md',
  'operations/RELEASE_AND_INCIDENT_POLICY.md',
  'research/STANDARDS_WATCH.md',
  'research/SOURCE_REGISTER.md',
  'evidence/README.md',
  'conformance/README.md',
  'conformance/manifest-v0.1.json',
  'conformance/manifest-v0.1.sha256',
  'conformance/runner-contract-v0.1.json',
  'spec/CONFORMANCE_HARNESS_V0_1.md',
  'docs/architecture/SECOND_IMPLEMENTATION_PLAN.md',
  '.github/PULL_REQUEST_TEMPLATE.md'
];

for (const rel of requiredFiles) {
  if (!exists(rel)) errors.push(`Missing required file: ${rel}`);
}

let state;
try {
  state = JSON.parse(read('governance/project-state.json'));
} catch (error) {
  errors.push(`Invalid project-state.json: ${error.message}`);
}

if (state) {
  const validWsStatuses = new Set(['ACTIVE', 'PLANNED', 'WATCHING', 'DISCOVERY', 'PAUSED', 'DONE']);
  const validGateStatuses = new Set(['PASS', 'IN_PROGRESS', 'NOT_STARTED', 'BLOCKED', 'FAIL']);
  const ids = state.workstreams?.map((ws) => ws.id) ?? [];
  if (ids.length !== 18) errors.push(`Expected exactly 18 workstreams, found ${ids.length}`);
  if (new Set(ids).size !== ids.length) errors.push('Duplicate workstream IDs');
  for (const ws of state.workstreams ?? []) {
    if (!validWsStatuses.has(ws.status)) errors.push(`Invalid workstream status ${ws.status} for ${ws.id}`);
  }
  for (const gate of state.gates ?? []) {
    if (!validGateStatuses.has(gate.status)) errors.push(`Invalid gate status ${gate.status} for ${gate.id}`);
  }
  if (!state.next_action?.id) errors.push('Missing unique next action');
  if (!ids.includes(state.next_action?.workstream)) errors.push('Next action references unknown workstream');

  const master = exists('governance/GLOBAL_MASTER_PLAN.md') ? read('governance/GLOBAL_MASTER_PLAN.md') : '';
  if (!master.includes('Eighteen governed workstreams')) errors.push('Global master plan does not define the 18-workstream system');

  const next = exists('governance/NEXT_ACTION.md') ? read('governance/NEXT_ACTION.md') : '';
  const rootNext = exists('NEXT_ACTION.md') ? read('NEXT_ACTION.md') : '';
  if (!next.includes(state.next_action.id)) errors.push('Generated governance NEXT_ACTION does not match state');
  if (next !== rootNext) errors.push('Root NEXT_ACTION differs from canonical generated view');

  const status = exists('governance/CURRENT_STATUS.md') ? read('governance/CURRENT_STATUS.md') : '';
  if (!status.includes(state.as_of)) errors.push('CURRENT_STATUS date does not match state');
  if (!status.includes(state.current_phase.id)) errors.push('CURRENT_STATUS phase does not match state');
  for (const ws of state.workstreams ?? []) {
    if (!status.includes(ws.id)) errors.push(`Generated CURRENT_STATUS omits workstream: ${ws.id}`);
  }

  if (!read('AGENTS.md').includes('governance/project-state.json')) errors.push('AGENTS.md does not identify machine-readable source of truth');
  if (!read('ROADMAP.md').includes('governance/GLOBAL_ROADMAP.md')) errors.push('Root ROADMAP is not a canonical pointer');
}

const datedFiles = [
  'strategy/COMPETITOR_RADAR.md',
  'integrations/COMPATIBILITY_MATRIX.md',
  'research/STANDARDS_WATCH.md'
];
for (const rel of datedFiles) {
  if (exists(rel) && !/Last reviewed:\s+\d{4}-\d{2}-\d{2}/.test(read(rel))) {
    errors.push(`Missing Last reviewed date: ${rel}`);
  }
}

const forbiddenPrivateKeyFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/private\.pem$/i.test(entry.name) && !full.includes(`${path.sep}test-vectors${path.sep}keys${path.sep}TEST_ONLY_`)) {
      forbiddenPrivateKeyFiles.push(path.relative(root, full));
    }
  }
}
walk(root);
for (const rel of forbiddenPrivateKeyFiles) errors.push(`Unexpected private key file: ${rel}`);

if (errors.length) {
  console.error('Project operating system validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Project operating system validation passed (${requiredFiles.length} required files, 18 workstreams).`);
