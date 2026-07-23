import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const responsesDirectory = resolve(root, 'evidence/market/comprehension-responses');
const outputJson = resolve(root, 'evidence/market/comprehension-report.json');
const outputMarkdown = resolve(root, 'evidence/market/COMPREHENSION_REPORT.md');
const files = (await readdir(responsesDirectory)).filter((name) => name.endsWith('.json')).sort();
const responses = [];
const rejected = [];

for (const file of files) {
  try {
    const value = JSON.parse(await readFile(resolve(responsesDirectory, file), 'utf8'));
    const valid = value.experiment === 'timeproofs-outcome-comprehension-v0.1' &&
      Number.isInteger(value.score) && value.score >= 0 && value.score <= 3 &&
      value.maximum === 3 && value.personal_data_collected === false &&
      value.answers && typeof value.answers === 'object';
    if (!valid) throw new Error('response does not match the anonymous experiment contract');
    const forbidden = ['name', 'email', 'company', 'ip', 'phone', 'address'];
    if (forbidden.some((key) => Object.hasOwn(value, key))) throw new Error('response contains a forbidden personal-data field');
    responses.push({ file, ...value });
  } catch (error) {
    rejected.push({ file, reason: error.message });
  }
}

const scoreCounts = [0, 0, 0, 0];
for (const response of responses) scoreCounts[response.score] += 1;
const perfect = responses.filter((response) => response.score === 3).length;
const passRate = responses.length === 0 ? null : perfect / responses.length;
const status = responses.length < 10 ? 'INSUFFICIENT_SAMPLE' : passRate >= 0.8 ? 'PASS' : 'REFINE';
const report = {
  experiment: 'timeproofs-outcome-comprehension-v0.1',
  generated_at: new Date().toISOString(),
  status,
  accepted_responses: responses.length,
  rejected_responses: rejected.length,
  perfect_scores: perfect,
  perfect_score_rate: passRate,
  target: { minimum_responses: 10, minimum_perfect_score_rate: 0.8 },
  score_distribution: { '0': scoreCounts[0], '1': scoreCounts[1], '2': scoreCounts[2], '3': scoreCounts[3] },
  rejected
};

const rate = passRate === null ? 'not available' : `${Math.round(passRate * 100)}%`;
const markdown = `# Outcome Comprehension Report\n\nGenerated: ${report.generated_at}\n\n- Status: **${status}**\n- Accepted responses: **${responses.length}**\n- Rejected responses: **${rejected.length}**\n- Perfect scores: **${perfect}**\n- Perfect-score rate: **${rate}**\n- Pass target: at least 10 responses and at least 80% scoring 3/3\n\nNo external validation claim may be made while the status is \`INSUFFICIENT_SAMPLE\`.\n`;
await mkdir(resolve(root, 'evidence/market'), { recursive: true });
await writeFile(outputJson, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await writeFile(outputMarkdown, markdown, 'utf8');
console.log(`Comprehension analysis: ${status} (${responses.length} accepted, ${rejected.length} rejected).`);
