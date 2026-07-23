import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const registry = JSON.parse(await readFile(resolve(root, 'spec/error-codes-v0.1.json'), 'utf8'));
const rows = registry.codes.map((entry) => `| \`${entry.code}\` | ${entry.category} | \`${entry.structural_outcome}\` | ${entry.meaning} |`);
const content = `# TimeProofs Structural Error Codes v0.1\n\nStatus: EXPERIMENTAL NORMATIVE REGISTRY VIEW\nProfile: \`TP-JSON-0.1\`\nGenerated from: \`spec/error-codes-v0.1.json\`\n\nThe JSON registry is the machine-readable authority for stable v0.1 structural result codes. Human-readable messages and JSON paths are diagnostic and MAY vary. Codes and their structural classification MUST remain stable within the v0.1 profile.\n\n| Code | Category | Outcome | Normative meaning |\n|---|---|---|---|\n${rows.join('\n')}\n`;
await writeFile(resolve(root, 'spec/ERROR_CODES_V0_1.md'), content, 'utf8');
console.log('Generated protocol registry views.');


const vocabulary = JSON.parse(await readFile(resolve(root, 'spec/outcome-event-vocabulary-v0.1.json'), 'utf8'));
const phaseRows = Object.entries(vocabulary.phases).map(([name, item]) => `| \`${name}\` | ${item.meaning} | ${item.allowed_statuses.map((value) => `\`${value}\``).join(', ')} |`);
const statusRows = Object.entries(vocabulary.statuses).map(([name, item]) => `| \`${name}\` | ${item.meaning} | ${item.terminal ? 'yes' : 'no'} |`);
const sourceRows = Object.entries(vocabulary.source_classes).map(([name, item]) => `| \`${name}\` | ${item.meaning} | ${vocabulary.source_phase_rules[name].map((value) => `\`${value}\``).join(', ')} |`);
const relationshipRows = Object.entries(vocabulary.relationship_semantics).map(([name, item]) => `| \`${name}\` | ${item.allowed_from.map((value) => `\`${value}\``).join(', ')} | ${item.allowed_to.map((value) => `\`${value}\``).join(', ')} | ${item.meaning} |`);
const domainOrder = [
  ['commerce.refund', 'Refund profile'],
  ['messaging.email', 'Email profile'],
  ['calendar.appointment', 'Appointment profile']
];
const domainSections = domainOrder.map(([prefix, title]) => {
  const entries = vocabulary.event_types.filter((item) => item.event_type.startsWith(`${prefix}.`));
  const rows = entries.map((item) => `| \`${item.event_type}\` | \`${item.phase}\` | ${item.allowed_statuses.map((value) => `\`${value}\``).join(', ')} | ${item.qualifying_source_classes.map((value) => `\`${value}\``).join(', ')} | ${item.meaning} |`);
  return `## ${title}\n\n| Event type | Phase | Allowed statuses | Sources that may qualify under domain rules | Meaning |\n|---|---|---|---|---|\n${rows.join('\n')}`;
});
const vocabularyContent = `# TimeProofs Outcome Event Vocabulary v0.1

Status: EXPERIMENTAL NORMATIVE REGISTRY VIEW
Profile: \`TP-JSON-0.1\`
Generated from: \`spec/outcome-event-vocabulary-v0.1.json\`

The JSON registry is the machine-readable authority. This document defines structural event semantics, not business verdict sufficiency. The key words **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are normative when uppercase.

## Core invariants

1. An Outcome Event records one observation or claim. It is not an overall action verdict.
2. \`phase\`, \`event_type\`, and \`status\` are separate dimensions and MUST NOT be collapsed.
3. A source class describes provenance. It does not automatically establish truth or sufficiency.
4. A self-claimed external outcome MAY be represented and signed. Domain rules MUST NOT treat it as verified solely because it is structurally valid.
5. Registered event types MUST use their registered phase and allowed status set.
6. Later cancellation, failure, expiry, reversal, or contradiction MUST be represented as new events.

## Universal lifecycle phases

| Phase | Normative meaning | Structurally allowed statuses |
|---|---|---|
${phaseRows.join('\n')}

## Event statuses

The status applies only to the event-specific observation. \`SUCCEEDED\` MUST NOT be interpreted as success of the complete action lifecycle.

| Status | Normative meaning | Terminal status class |
|---|---|---|
${statusRows.join('\n')}

## Evidence source classes

\`qualifying_source_classes\` in a registered event entry describes sources that a domain ruleset may accept as sufficient. It is not a structural allow-list. In particular, \`SELF_CLAIMED\` remains representable for any phase so that unsupported claims can be preserved and evaluated as insufficient.

| Source class | Normative meaning | Structurally meaningful phases |
|---|---|---|
${sourceRows.join('\n')}

## Event type registration and extensions

TimeProofs base event types MUST use lower-case dot-separated tokens in the form:

\`<domain>.<resource>.<event>\`

The namespaces ${vocabulary.reserved_namespaces.map((value) => `\`${value}\``).join(', ')} are reserved. An unregistered type MUST NOT appear within a reserved namespace.

Third-party types MUST use a collision-resistant extension form beginning with \`x.\`, for example:

\`x.com.example.workflow.task.completed\`

An extension event remains subject to universal phase, status, source-phase, digest, signature, and relationship rules. Registration does not imply that TimeProofs endorses the issuer or considers the event sufficient for a verdict.

## Relationship semantics

Relationship direction is normative.

| Relationship | Allowed source kinds | Allowed target kinds | Meaning |
|---|---|---|---|
${relationshipRows.join('\n')}

${domainSections.join('\n\n')}

## Invalid semantic combinations

A verifier MUST reject at least the following:

- a non-terminal phase using \`CANCELLED\`, \`REVERSED\`, or \`EXPIRED\`;
- a registered type with a different phase;
- a registered type with a status outside its registered status set;
- \`INDEPENDENTLY_SETTLED\` used outside \`SETTLEMENT\` or \`TERMINATION\`;
- an unknown type under a reserved namespace;
- an unregistered third-party type without the \`x.<reverse-dns>...\` form;
- a relationship whose endpoint kinds violate the registered relationship direction.

## Important domain distinction

\`commerce.refund.created\` records creation of a refund business object. It MUST NOT be interpreted as \`commerce.refund.settled\`. Likewise, mail acceptance is not delivery, and appointment creation is not necessarily final confirmation.
`;
await writeFile(resolve(root, 'spec/OUTCOME_EVENT_VOCABULARY_V0_1.md'), vocabularyContent, 'utf8');

const fieldRegistry = JSON.parse(await readFile(resolve(root, 'spec/field-semantics-v0.1.json'), 'utf8'));
const evidenceSpecPath = resolve(root, 'spec/TIMEPROOFS_EVIDENCE_BUNDLE_SPEC_V0_1.md');
const appendixStart = '<!-- FIELD-PATH-APPENDIX:START -->';
const appendixEnd = '<!-- FIELD-PATH-APPENDIX:END -->';
const fieldRows = fieldRegistry.fields.map((entry) => `| \`${entry.path}\` | ${entry.normative_section} | ${entry.required} | ${entry.semantics} |`);
const appendix = `${appendixStart}\n\n## Appendix A — Normative field path registry\n\nThe following paths form the complete field surface accepted by the v0.1 schema. The machine-readable authority is \`spec/field-semantics-v0.1.json\`. Open extension descendants are permitted only where the registry marks the parent as open.\n\n| Path | Section | Required | Semantics |\n|---|---:|---|---|\n${fieldRows.join('\n')}\n\n${appendixEnd}`;
let evidenceSpec = await readFile(evidenceSpecPath, 'utf8');
const startIndex = evidenceSpec.indexOf(appendixStart);
const endIndex = evidenceSpec.indexOf(appendixEnd);
if (startIndex >= 0 && endIndex >= startIndex) {
  evidenceSpec = `${evidenceSpec.slice(0, startIndex).trimEnd()}\n\n${appendix}\n`;
} else {
  evidenceSpec = `${evidenceSpec.trimEnd()}\n\n${appendix}\n`;
}
await writeFile(evidenceSpecPath, evidenceSpec, 'utf8');
console.log(`Generated normative field path appendix (${fieldRows.length} paths).`);
