export function buildOutcomePacket(bundle, verification, evaluation) {
  const lifecycle = [...bundle.payload.events]
    .sort((left, right) => Date.parse(left.occurred_at) - Date.parse(right.occurred_at) || left.event_id.localeCompare(right.event_id))
    .map((event) => ({
      event_id: event.event_id,
      event_type: event.event_type,
      phase: event.phase,
      status: event.status,
      occurred_at: event.occurred_at,
      source_class: event.source_class,
      issuer_ref: event.issuer_ref,
      signed: verification.valid_proofs.some((proof) => proof.target?.target_type === 'OUTCOME_EVENT' && proof.target?.target_id === event.event_id)
    }));

  const missingEvidence = [];
  if (evaluation.verdict === 'PENDING') missingEvidence.push('A qualifying signed settlement event.');
  if (evaluation.verdict === 'UNPROVABLE') missingEvidence.push('Receiver, system-of-record, or independent settlement evidence.');
  if (verification.status === 'INCOMPLETE') missingEvidence.push('One or more structural completeness elements.');

  return {
    packet_version: '0.1-experimental',
    generated_at: new Date().toISOString(),
    generated_from: {
      action_id: bundle.payload.action_id,
      bundle_id: bundle.payload.bundle_id,
      payload_digest: verification.payload_digest,
      ruleset: evaluation.ruleset
    },
    structural_status: verification.status,
    verdict: evaluation.verdict,
    reasons: evaluation.reasons ?? [],
    decisive_events: evaluation.decisive_events ?? [],
    missing_evidence: missingEvidence,
    evidence_basis: {
      issuers: bundle.payload.issuers.length,
      events: bundle.payload.events.length,
      evidence_items: bundle.payload.evidence.length,
      valid_proofs: verification.valid_proofs.length
    },
    lifecycle,
    limitations: [
      'A valid signature proves integrity and provenance of a claim, not universal factual or legal truth.',
      'Provider authentication is disclosed separately from the Relay signature.',
      'The outcome evaluation can change when later evidence or a new ruleset is applied.'
    ]
  };
}
