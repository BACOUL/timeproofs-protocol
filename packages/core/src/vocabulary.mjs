import { readFileSync } from 'node:fs';

const registryUrl = new URL('../../../spec/outcome-event-vocabulary-v0.1.json', import.meta.url);
const document = JSON.parse(readFileSync(registryUrl, 'utf8'));

export const OUTCOME_EVENT_VOCABULARY = Object.freeze(document);
export const EVENT_TYPE_RULES = Object.freeze(
  Object.fromEntries(document.event_types.map((entry) => [entry.event_type, Object.freeze(entry)]))
);
export const RESERVED_EVENT_NAMESPACES = Object.freeze([...document.reserved_namespaces]);
export const EXTENSION_EVENT_TYPE_PATTERN = new RegExp(document.extension_event_type_pattern, 'u');

function startsWithReservedNamespace(eventType) {
  return RESERVED_EVENT_NAMESPACES.some((namespace) => eventType === namespace || eventType.startsWith(`${namespace}.`));
}

export function validateEventVocabulary(event) {
  const issues = [];
  const phase = document.phases[event.phase];
  if (phase && !phase.allowed_statuses.includes(event.status)) {
    issues.push({
      code: 'EVENT_PHASE_STATUS_INVALID',
      message: `${event.status} is not permitted for lifecycle phase ${event.phase}.`,
      member: 'status'
    });
  }

  const allowedSourcePhases = document.source_phase_rules[event.source_class];
  if (allowedSourcePhases && !allowedSourcePhases.includes(event.phase)) {
    issues.push({
      code: 'EVENT_SOURCE_PHASE_INVALID',
      message: `${event.source_class} is not meaningful for lifecycle phase ${event.phase}.`,
      member: 'source_class'
    });
  }

  const rule = EVENT_TYPE_RULES[event.event_type];
  if (rule) {
    if (event.phase !== rule.phase) {
      issues.push({
        code: 'EVENT_TYPE_PHASE_MISMATCH',
        message: `${event.event_type} requires phase ${rule.phase}.`,
        member: 'phase'
      });
    }
    if (!rule.allowed_statuses.includes(event.status)) {
      issues.push({
        code: 'EVENT_TYPE_STATUS_MISMATCH',
        message: `${event.event_type} does not permit status ${event.status}.`,
        member: 'status'
      });
    }
    return issues;
  }

  if (startsWithReservedNamespace(event.event_type)) {
    issues.push({
      code: 'EVENT_TYPE_RESERVED_UNREGISTERED',
      message: `${event.event_type} uses a reserved namespace but is not registered.`,
      member: 'event_type'
    });
    return issues;
  }

  if (!EXTENSION_EVENT_TYPE_PATTERN.test(event.event_type)) {
    issues.push({
      code: 'EVENT_TYPE_UNREGISTERED',
      message: 'Unregistered event types must use the x.<reverse-dns>.<domain>.<resource>.<event> extension form.',
      member: 'event_type'
    });
  }
  return issues;
}

export function validateRelationshipVocabulary(relationship) {
  const semantic = document.relationship_semantics[relationship.relationship_type];
  if (!semantic) return [];
  const fromKind = typeof relationship.from_ref === 'string' ? relationship.from_ref.split(':', 1)[0] : '';
  const toKind = typeof relationship.to_ref === 'string' ? relationship.to_ref.split(':', 1)[0] : '';
  if (!semantic.allowed_from.includes(fromKind) || !semantic.allowed_to.includes(toKind)) {
    return [{
      code: 'RELATIONSHIP_ENDPOINT_TYPES_INVALID',
      message: `${relationship.relationship_type} does not permit ${fromKind || 'unknown'} -> ${toKind || 'unknown'} endpoints.`,
      member: null
    }];
  }
  return [];
}
