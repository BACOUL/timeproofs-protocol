const scenarioLabels = {
  pending: { title: 'Refund created, settlement not yet proven', badge: 'Verification pending', className: 'pending' },
  verified: { title: 'Refund settlement independently confirmed', badge: 'Outcome verified', className: 'verified' },
  contradicted: { title: 'Previously settled refund later reversed', badge: 'Outcome contradicted', className: 'contradicted' },
  unprovable: { title: 'Agent claims completion without external evidence', badge: 'Outcome unprovable', className: 'unprovable' }
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
  OUTCOME_REVERSED: 'A later signed event reverses the previously established outcome.',
  NO_SUFFICIENT_SIGNED_SYSTEM_EVIDENCE: 'The available claim comes only from the agent and is not supported by a system-of-record or settlement source.'
};

const cache = new Map();

async function loadScenario(name) {
  if (cache.has(name)) return cache.get(name);
  const [bundle, verification, verdict] = await Promise.all([
    fetch(`data/refund-${name}.bundle.json`).then((response) => response.json()),
    fetch(`data/refund-${name}.verification.json`).then((response) => response.json()),
    fetch(`data/refund-${name}.verdict.json`).then((response) => response.json())
  ]);
  const value = { bundle, verification, verdict };
  cache.set(name, value);
  return value;
}

function renderTimeline(bundle) {
  const timeline = document.querySelector('#timeline');
  timeline.replaceChildren();
  const events = [...bundle.payload.events].sort((left, right) => Date.parse(left.occurred_at) - Date.parse(right.occurred_at));
  for (const event of events) {
    const item = document.createElement('li');
    const marker = document.createElement('span');
    marker.className = 'timeline-marker';
    const content = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'timeline-title';
    title.textContent = eventLabels[event.event_type] ?? event.event_type;
    const meta = document.createElement('div');
    meta.className = 'timeline-meta';
    meta.textContent = `${event.source_class.replaceAll('_', ' ')} · ${event.issuer_ref} · ${event.occurred_at}`;
    content.append(title, meta);
    const status = document.createElement('span');
    status.className = 'timeline-status';
    status.textContent = event.status;
    item.append(marker, content, status);
    timeline.append(item);
  }
}

function renderBasis(bundle, verification) {
  const definitionList = document.querySelector('#verification-basis');
  definitionList.replaceChildren();
  const values = [
    ['Events', bundle.payload.events.length],
    ['Evidence items', bundle.payload.evidence.length],
    ['Valid proofs', verification.valid_proofs?.length ?? 0],
    ['Issuers', bundle.payload.issuers.length]
  ];
  for (const [term, value] of values) {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = term;
    dd.textContent = value;
    row.append(dt, dd);
    definitionList.append(row);
  }
}

function renderReasons(verdict) {
  const list = document.querySelector('#verdict-reasons');
  list.replaceChildren();
  for (const reason of verdict.reasons ?? []) {
    const item = document.createElement('li');
    item.textContent = reasonLabels[reason] ?? reason.replaceAll('_', ' ').toLowerCase();
    list.append(item);
  }
}

async function renderScenario(name) {
  const { bundle, verification, verdict } = await loadScenario(name);
  const label = scenarioLabels[name];
  document.querySelector('#packet-title').textContent = label.title;
  const badge = document.querySelector('#verdict-badge');
  badge.className = `large-badge ${label.className}`;
  badge.textContent = label.badge;
  document.querySelector('#action-id').textContent = bundle.payload.action_id;
  document.querySelector('#bundle-id').textContent = bundle.payload.bundle_id;
  document.querySelector('#structural-status').textContent = verification.status;
  document.querySelector('#ruleset').textContent = verdict.ruleset;
  renderTimeline(bundle);
  renderBasis(bundle, verification);
  renderReasons(verdict);
  document.querySelector('#machine-report').textContent = JSON.stringify({ verification, verdict }, null, 2);
}

for (const button of document.querySelectorAll('.scenario-tab')) {
  button.addEventListener('click', async () => {
    for (const tab of document.querySelectorAll('.scenario-tab')) {
      const active = tab === button;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    }
    await renderScenario(button.dataset.scenario);
  });
}

renderScenario('pending').catch((error) => {
  document.querySelector('#packet-title').textContent = 'Demo data could not be loaded';
  document.querySelector('#machine-report').textContent = error.stack ?? error.message;
});
