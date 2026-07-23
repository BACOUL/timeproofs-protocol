# Operations and Reliability Plan

## Stages

### Local/open-source stage

- deterministic builds and tests;
- dependency updates;
- release provenance;
- issue and vulnerability handling;
- no hosted availability claims.

### Managed alpha

- environment separation;
- secrets management;
- service monitoring;
- incident runbooks;
- backup and restore tests;
- cost and quota controls;
- support hours and severity definitions;
- data deletion and export workflows.

### Public service

- status page;
- SLO and error-budget policy;
- regional and data-residency decisions;
- on-call or managed incident coverage appropriate to commitments;
- capacity and abuse protection;
- disaster recovery objectives;
- vendor and subprocessor management;
- operational security review.

## Failure semantics

Service unavailability must not convert missing evidence into VERIFIED. SDKs and connectors must expose local action results independently from managed anchoring or retention failure.

## Cost controls

Track per operation:

- signature and key cost;
- ingestion and verification compute;
- storage by retention tier;
- external evidence retrieval;
- egress and packet generation;
- support and incident cost.
