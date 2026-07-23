import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const registry = JSON.parse(await readFile(resolve(root, 'spec/error-codes-v0.1.json'), 'utf8'));
const rows = registry.codes.map((entry) => `| \`${entry.code}\` | ${entry.category} | \`${entry.structural_outcome}\` | ${entry.meaning} |`);
const content = `# TimeProofs Structural Error Codes v0.1\n\nStatus: EXPERIMENTAL NORMATIVE REGISTRY VIEW  \nProfile: \`TP-JSON-0.1\`  \nGenerated from: \`spec/error-codes-v0.1.json\`\n\nThe JSON registry is the machine-readable authority for stable v0.1 structural result codes. Human-readable messages and JSON paths are diagnostic and MAY vary. Codes and their structural classification MUST remain stable within the v0.1 profile.\n\n| Code | Category | Outcome | Normative meaning |\n|---|---|---|---|\n${rows.join('\n')}\n`;
await writeFile(resolve(root, 'spec/ERROR_CODES_V0_1.md'), content, 'utf8');
console.log('Generated protocol registry views.');
