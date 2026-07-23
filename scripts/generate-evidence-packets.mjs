import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { verifyBundle } from '../packages/core/src/index.mjs';
import { evaluateBundle } from '../packages/verdict-engine/src/index.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const outputDirectory = resolve(root, 'site/packets');
const scenarios = ['pending', 'verified', 'contradicted', 'unprovable'];

const labels = {
  pending: {
    title: 'Refund created, settlement not yet proven',
    verdict: 'Verification pending',
    summary: 'The merchant confirms that a refund object exists, but no sufficiently strong settlement evidence is present.'
  },
  verified: {
    title: 'Refund settlement independently confirmed',
    verdict: 'Outcome verified',
    summary: 'A signed settlement event from an independent payment provider confirms that the funds reached the settlement stage.'
  },
  contradicted: {
    title: 'Previously settled refund later reversed',
    verdict: 'Outcome contradicted',
    summary: 'The evidence contains both a successful settlement and a later signed reversal. The earlier completion claim is no longer current.'
  },
  unprovable: {
    title: 'Agent claims completion without external evidence',
    verdict: 'Outcome unprovable',
    summary: 'The agent signed its own completion claim, but no receiver, system of record, or settlement provider supports it.'
  }
};

const eventLabels = {
  'commerce.refund.requested': 'Refund requested',
  'commerce.refund.dispatched': 'Request dispatched',
  'commerce.refund.accepted': 'Request accepted',
  'commerce.refund.created': 'Refund object created',
  'commerce.refund.settled': 'Funds settled',
  'commerce.refund.reversed': 'Refund reversed'
};

const reasonLabels = {
  SETTLEMENT_CONFIRMED_BY_STRONG_SIGNED_SOURCE: 'A signed settlement event was issued by an independently settling system.',
  REFUND_CREATED_WITHOUT_SETTLEMENT: 'The merchant proves that a refund object exists, but no signed settlement event is present.',
  REFUND_ACCEPTED_WITHOUT_SETTLEMENT: 'The receiver accepted the request, but no settlement evidence exists yet.',
  OUTCOME_REVERSED: 'A later signed event reverses the previously established result.',
  CONFLICTING_SETTLEMENT_EVIDENCE: 'Strong signed sources disagree about the settlement result.',
  NO_SUFFICIENT_SIGNED_SYSTEM_EVIDENCE: 'Only a weak or self-claimed completion statement is available.',
  BUNDLE_INVALID: 'The evidence bundle failed structural or cryptographic verification.'
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatSource(value) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/^./u, (letter) => letter.toUpperCase());
}

function buildPacket(scenario, bundle, verification, verdict) {
  const events = [...bundle.payload.events]
    .sort((left, right) => Date.parse(left.occurred_at) - Date.parse(right.occurred_at))
    .map((event) => ({
      event_id: event.event_id,
      label: eventLabels[event.event_type] ?? event.event_type,
      event_type: event.event_type,
      phase: event.phase,
      status: event.status,
      occurred_at: event.occurred_at,
      source_class: event.source_class,
      issuer_ref: event.issuer_ref,
      signed: verification.valid_proofs.some((proof) => proof.target?.target_type === 'OUTCOME_EVENT' && proof.target?.target_id === event.event_id)
    }));

  const missingEvidence = [];
  if (verdict.verdict === 'PENDING') missingEvidence.push('A signed settlement event from a qualifying system.');
  if (verdict.verdict === 'UNPROVABLE') missingEvidence.push('Receiver, system-of-record, or independent settlement evidence.');
  if (verification.status === 'INCOMPLETE') missingEvidence.push('One or more completeness elements required by the structural verifier.');

  return {
    packet_version: '0.1-experimental',
    generated_from: {
      bundle_id: bundle.payload.bundle_id,
      action_id: bundle.payload.action_id,
      payload_digest: verification.payload_digest,
      ruleset: verdict.ruleset
    },
    scenario,
    title: labels[scenario].title,
    plain_language_summary: labels[scenario].summary,
    structural_status: verification.status,
    verdict: verdict.verdict,
    verdict_label: labels[scenario].verdict,
    reasons: (verdict.reasons ?? []).map((reason) => ({ code: reason, explanation: reasonLabels[reason] ?? reason })),
    missing_evidence: missingEvidence,
    evidence_basis: {
      issuers: bundle.payload.issuers.length,
      events: bundle.payload.events.length,
      evidence_items: bundle.payload.evidence.length,
      valid_proofs: verification.valid_proofs.length
    },
    lifecycle: events,
    limitations: [
      'This packet is generated from synthetic test evidence. No real payment occurred.',
      'A valid signature proves integrity and provenance of a claim, not universal factual or legal truth.',
      'The verdict is recalculable and may change when later evidence or a new ruleset is applied.'
    ]
  };
}

function packetHtml(packet) {
  const lifecycle = packet.lifecycle.map((event) => `
    <li>
      <span class="event-marker" aria-hidden="true"></span>
      <div>
        <strong>${escapeHtml(event.label)}</strong>
        <span>${escapeHtml(formatSource(event.source_class))} · ${escapeHtml(event.issuer_ref)} · ${escapeHtml(event.occurred_at)}</span>
      </div>
      <div class="event-result">
        <b>${escapeHtml(event.status)}</b>
        <small>${event.signed ? 'Signed evidence' : 'No event proof'}</small>
      </div>
    </li>`).join('');

  const reasons = packet.reasons.map((reason) => `<li><strong>${escapeHtml(reason.code)}</strong><span>${escapeHtml(reason.explanation)}</span></li>`).join('');
  const missing = packet.missing_evidence.length
    ? packet.missing_evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
    : '<li>No decisive evidence is currently missing for this ruleset.</li>';
  const limitations = packet.limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${escapeHtml(packet.title)} — TimeProofs Outcome Evidence Packet</title>
  <link rel="stylesheet" href="../packet-styles.css">
</head>
<body class="verdict-${escapeHtml(packet.verdict.toLowerCase())}">
  <main class="packet-page">
    <header class="packet-identity">
      <a href="../index.html#demo" class="brand">TimeProofs</a>
      <span>Outcome Evidence Packet · experimental v0.1</span>
    </header>

    <section class="outcome-head">
      <div>
        <p class="eyebrow">AI action outcome</p>
        <h1>${escapeHtml(packet.title)}</h1>
        <p class="summary">${escapeHtml(packet.plain_language_summary)}</p>
      </div>
      <div class="verdict-card">
        <span>Current verdict</span>
        <strong>${escapeHtml(packet.verdict_label)}</strong>
        <small>${escapeHtml(packet.verdict)}</small>
      </div>
    </section>

    <section class="identity-grid">
      <div><span>Action ID</span><code>${escapeHtml(packet.generated_from.action_id)}</code></div>
      <div><span>Bundle ID</span><code>${escapeHtml(packet.generated_from.bundle_id)}</code></div>
      <div><span>Structural status</span><strong>${escapeHtml(packet.structural_status)}</strong></div>
      <div><span>Ruleset</span><code>${escapeHtml(packet.generated_from.ruleset)}</code></div>
      <div class="digest"><span>Payload digest</span><code>${escapeHtml(packet.generated_from.payload_digest?.value ?? 'not available')}</code></div>
    </section>

    <section class="content-grid">
      <div>
        <h2>Lifecycle evidence</h2>
        <ol class="event-list">${lifecycle}</ol>
      </div>
      <aside>
        <h2>Evidence basis</h2>
        <dl>
          <div><dt>Issuers</dt><dd>${packet.evidence_basis.issuers}</dd></div>
          <div><dt>Events</dt><dd>${packet.evidence_basis.events}</dd></div>
          <div><dt>Evidence items</dt><dd>${packet.evidence_basis.evidence_items}</dd></div>
          <div><dt>Valid proofs</dt><dd>${packet.evidence_basis.valid_proofs}</dd></div>
        </dl>
        <h2>Why this verdict?</h2>
        <ul class="reason-list">${reasons}</ul>
        <h2>Missing evidence</h2>
        <ul>${missing}</ul>
      </aside>
    </section>

    <section class="limitations">
      <h2>What this packet does not claim</h2>
      <ul>${limitations}</ul>
    </section>

    <footer>
      <span>Generated deterministically from the machine Evidence Bundle and verdict output.</span>
      <a href="refund-${escapeHtml(packet.scenario)}.packet.json">Inspect packet JSON</a>
    </footer>
  </main>
</body>
</html>\n`;
}

await mkdir(outputDirectory, { recursive: true });
const index = [];
for (const scenario of scenarios) {
  const bundle = JSON.parse(await readFile(resolve(root, `site/data/refund-${scenario}.bundle.json`), 'utf8'));
  const verification = verifyBundle(bundle);
  const verdict = evaluateBundle(bundle, 'refund-v0.1');
  const packet = buildPacket(scenario, bundle, verification, verdict);
  await writeFile(resolve(outputDirectory, `refund-${scenario}.packet.json`), `${JSON.stringify(packet, null, 2)}\n`, 'utf8');
  await writeFile(resolve(outputDirectory, `refund-${scenario}.html`), packetHtml(packet), 'utf8');
  index.push({ scenario, verdict: packet.verdict, path: `packets/refund-${scenario}.html`, digest: packet.generated_from.payload_digest });
}
await writeFile(resolve(outputDirectory, 'index.json'), `${JSON.stringify({ packet_version: '0.1-experimental', packets: index }, null, 2)}\n`, 'utf8');
console.log(`Generated ${scenarios.length} Outcome Evidence Packets.`);
