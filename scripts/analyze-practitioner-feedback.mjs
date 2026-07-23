import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const responsesDirectory = resolve(root, 'evidence/market/practitioner-feedback');
const outputJson = resolve(root, 'evidence/market/practitioner-feedback-report.json');
const outputMarkdown = resolve(root, 'evidence/market/PRACTITIONER_FEEDBACK_REPORT.md');
const files = (await readdir(responsesDirectory)).filter((name) => name.endsWith('.json')).sort();
const responses = [];
const rejected = [];
const allowedRoles = new Set(['DEVELOPER', 'PRODUCT', 'COMPLIANCE', 'OPERATIONS', 'SECURITY', 'OTHER']);
const allowedDomains = new Set(['COMMERCE', 'PAYMENTS', 'MESSAGING', 'CALENDAR', 'DOCUMENTS', 'SUPPORT', 'DEVOPS', 'ADMINISTRATION', 'OTHER']);
const allowedSystems = new Set(['PAYMENT_PROVIDER', 'MERCHANT_BACKEND', 'CRM_ERP', 'EMAIL_PROVIDER', 'CALENDAR_PROVIDER', 'DATABASE', 'WORKFLOW_ENGINE', 'OTHER']);
const allowedIntegrations = new Set(['MIDDLEWARE', 'WEBHOOK_CONNECTOR', 'API', 'MCP', 'PLATFORM_INTEGRATION', 'UNSURE']);
const allowedValueUnits = new Set(['RETENTION', 'REVERIFICATION', 'CONNECTOR', 'CONTRADICTION_ALERT', 'AUDIT_PACKET', 'NONE_YET']);
const allowedBudgets = new Set(['NO_BUDGET', 'NEEDS_PROOF', 'UNDER_100_MONTH', '100_500_MONTH', 'OVER_500_MONTH', 'UNKNOWN']);

for (const file of files) {
  try {
    const value = JSON.parse(await readFile(resolve(responsesDirectory, file), 'utf8'));
    const valid = value.experiment === 'timeproofs-practitioner-feedback-v0.1' &&
      typeof value.recorded_at === 'string' && !Number.isNaN(Date.parse(value.recorded_at)) &&
      allowedRoles.has(value.role_category) &&
      allowedDomains.has(value.workflow_domain) &&
      allowedSystems.has(value.authoritative_system) &&
      allowedIntegrations.has(value.preferred_integration) &&
      typeof value.premature_done_risk === 'boolean' &&
      typeof value.sandbox_interest === 'boolean' &&
      allowedValueUnits.has(value.paid_value_unit) &&
      allowedBudgets.has(value.budget_signal) &&
      value.personal_data_collected === false;
    if (!valid) throw new Error('response does not match the anonymous practitioner contract');
    const forbidden = ['name', 'email', 'company', 'ip', 'phone', 'address', 'notes'];
    if (forbidden.some((key) => Object.hasOwn(value, key))) throw new Error('response contains a forbidden personal-data or free-text field');
    responses.push({ file, ...value });
  } catch (error) {
    rejected.push({ file, reason: error.message });
  }
}

const countBy = (field) => Object.fromEntries(
  [...new Set(responses.map((response) => response[field]))].sort().map((value) => [value, responses.filter((response) => response[field] === value).length])
);
const sandboxCommitments = responses.filter((response) => response.sandbox_interest).length;
const concreteRisks = responses.filter((response) => response.premature_done_risk).length;
const budgetSignals = responses.filter((response) => !['NO_BUDGET', 'UNKNOWN'].includes(response.budget_signal)).length;
const status = responses.length < 5 ? 'INSUFFICIENT_SAMPLE' : sandboxCommitments >= 2 && concreteRisks >= 2 ? 'PASS' : 'REFINE';
const generatedAt = responses.length ? responses.map((response) => response.recorded_at).sort().at(-1) : null;
const report = {
  experiment: 'timeproofs-practitioner-feedback-v0.1',
  generated_at: generatedAt,
  status,
  accepted_responses: responses.length,
  rejected_responses: rejected.length,
  premature_done_risks: concreteRisks,
  sandbox_commitments: sandboxCommitments,
  budget_signals: budgetSignals,
  target: { minimum_responses: 5, minimum_sandbox_commitments: 2 },
  roles: countBy('role_category'),
  workflow_domains: countBy('workflow_domain'),
  authoritative_systems: countBy('authoritative_system'),
  preferred_integrations: countBy('preferred_integration'),
  paid_value_units: countBy('paid_value_unit'),
  budget_ranges: countBy('budget_signal'),
  rejected
};

const markdown = `# Practitioner Feedback Report\n\nGenerated from accepted response timestamps: ${generatedAt ?? 'not available'}\n\n- Status: **${status}**\n- Accepted responses: **${responses.length}**\n- Rejected responses: **${rejected.length}**\n- Workflows with premature-done risk: **${concreteRisks}**\n- Sandbox commitments: **${sandboxCommitments}**\n- Budget signals beyond no-budget/unknown: **${budgetSignals}**\n- Pass target: at least 5 qualified responses and at least 2 sandbox commitments\n\nNo external demand, integration, or willingness-to-pay claim may be made while the status is \`INSUFFICIENT_SAMPLE\`.\n`;
await mkdir(resolve(root, 'evidence/market'), { recursive: true });
await writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await writeFile(outputMarkdown, markdown, 'utf8');
console.log(`Practitioner analysis: ${status} (${responses.length} accepted, ${rejected.length} rejected).`);
