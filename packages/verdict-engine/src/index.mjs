import { verifyBundle } from '../../core/src/index.mjs';

const STRONG_SOURCES = new Set(['SYSTEM_OF_RECORD', 'INDEPENDENTLY_SETTLED']);

function proofCoversEvent(validProofs, event) {
  return validProofs.some((proof) =>
    proof.issuer_ref === event.issuer_ref &&
    proof.target?.target_type === 'OUTCOME_EVENT' &&
    proof.target?.target_id === event.event_id
  );
}

function chronological(events) {
  return [...events].sort((left, right) => {
    const timeDifference = Date.parse(left.occurred_at) - Date.parse(right.occurred_at);
    return timeDifference || left.event_id.localeCompare(right.event_id);
  });
}

export function evaluateRefund(bundle, ruleset = 'refund-v0.1') {
  if (ruleset !== 'refund-v0.1') {
    return { ruleset, verdict: 'UNPROVABLE', reasons: ['RULESET_NOT_SUPPORTED'] };
  }

  const verification = verifyBundle(bundle);
  if (verification.status === 'INVALID') {
    return {
      ruleset,
      verdict: 'UNPROVABLE',
      reasons: ['BUNDLE_INVALID'],
      verification
    };
  }

  const events = chronological(bundle.payload.events).filter((event) => event.event_type.startsWith('commerce.refund.'));
  const qualifying = events.filter((event) => STRONG_SOURCES.has(event.source_class) && proofCoversEvent(verification.valid_proofs, event));
  const settled = qualifying.filter((event) => event.event_type === 'commerce.refund.settled' && event.status === 'SUCCEEDED');
  const reversed = qualifying.filter((event) => ['commerce.refund.reversed', 'commerce.refund.settlement_reversed'].includes(event.event_type) && ['SUCCEEDED', 'REVERSED'].includes(event.status));
  const failedSettlement = qualifying.filter((event) =>
    (event.event_type === 'commerce.refund.settlement_failed' && event.status === 'FAILED') ||
    (event.event_type === 'commerce.refund.settled' && event.status === 'FAILED')
  );
  const pendingSettlement = qualifying.filter((event) => event.event_type === 'commerce.refund.settlement_pending' && event.status === 'PENDING');
  const cancelled = qualifying.filter((event) => event.event_type === 'commerce.refund.cancelled' && event.status === 'CANCELLED');
  const created = qualifying.filter((event) => event.event_type === 'commerce.refund.created' && event.status === 'SUCCEEDED');
  const accepted = events.filter((event) => ['commerce.refund.accepted', 'commerce.refund.created'].includes(event.event_type) && event.status === 'SUCCEEDED');

  if (reversed.length > 0 || cancelled.length > 0 || failedSettlement.length > 0) {
    return {
      ruleset,
      verdict: 'CONTRADICTED',
      reasons: reversed.length > 0
        ? ['OUTCOME_REVERSED']
        : cancelled.length > 0
          ? ['OUTCOME_CANCELLED']
          : ['SETTLEMENT_FAILED'],
      verification,
      decisive_events: [...settled, ...failedSettlement, ...cancelled, ...reversed].map((event) => event.event_id)
    };
  }

  if (settled.length > 0) {
    return {
      ruleset,
      verdict: 'VERIFIED',
      reasons: ['SETTLEMENT_CONFIRMED_BY_STRONG_SIGNED_SOURCE'],
      verification,
      decisive_events: settled.map((event) => event.event_id)
    };
  }

  if (pendingSettlement.length > 0 || created.length > 0 || accepted.length > 0) {
    return {
      ruleset,
      verdict: 'PENDING',
      reasons: pendingSettlement.length > 0
        ? ['SETTLEMENT_PENDING']
        : created.length > 0
          ? ['REFUND_CREATED_WITHOUT_SETTLEMENT']
          : ['REFUND_ACCEPTED_WITHOUT_SETTLEMENT'],
      verification,
      decisive_events: (pendingSettlement.length > 0 ? pendingSettlement : created.length > 0 ? created : accepted).map((event) => event.event_id)
    };
  }

  return {
    ruleset,
    verdict: 'UNPROVABLE',
    reasons: ['NO_SUFFICIENT_SIGNED_SYSTEM_EVIDENCE'],
    verification,
    decisive_events: []
  };
}

export function evaluateBundle(bundle, ruleset) {
  if (ruleset === 'refund-v0.1') return evaluateRefund(bundle, ruleset);
  return { ruleset, verdict: 'UNPROVABLE', reasons: ['RULESET_NOT_SUPPORTED'] };
}
