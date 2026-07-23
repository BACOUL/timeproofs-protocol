# A2A Compatibility Watch

Last reviewed: 2026-07-23

Official source: https://a2a-protocol.org/latest/specification/

A2A standardizes interoperability between independent agents, including discovery, messages, tasks, artifacts, and task state.

TimeProofs target:

- preserve delegation and task correlation identifiers;
- identify which agent asserted which event;
- distinguish task completion from external business completion;
- map artifacts and receiver evidence without exposing internal memory;
- handle task cancellation and later contradiction.

Boundary: an A2A task marked completed may still require system-of-record evidence for the claimed real-world outcome.
