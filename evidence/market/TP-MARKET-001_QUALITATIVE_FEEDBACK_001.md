# TP-MARKET-001 — First unstructured qualitative feedback

Date: 2026-07-23  
Status: RECORDED, NOT COUNTED TOWARD ACCEPTANCE SAMPLE

## Evidence boundary

Two external readers supplied free-form reviews of the deployed preview. They did not return the structured anonymous JSON contracts, so they are not counted among the required comprehension or practitioner samples and do not establish demand, sandbox commitment, or willingness to pay.

## Review A — category misclassification

Observed interpretation:

- understood TimeProofs primarily as distributed timestamping or proof of existence;
- inferred propagation, ordering, blockchain, consensus, and RFC 3161 requirements that are not the current product model;
- nevertheless recognized a broad need for auditability and portable evidence;
- correctly identified the need for a documented threat model and stronger security review.

Product implication:

The initial category signal was insufficiently explicit for a reader who associated “proof” with timestamping. The public preview must state prominently that TimeProofs is not a timestamping protocol and explain that its purpose is outcome correlation across independent evidence issuers.

## Review B — correct product interpretation

Observed interpretation:

- correctly distinguished an agent claim from evidence of actual execution;
- correctly understood structural validity versus business verdict;
- correctly understood immutable evidence versus versioned interpretation rules;
- correctly understood the open-protocol and managed-assurance split;
- recommended stronger visual identification of who attested each event;
- predicted that manual JSON download and return may reduce response rate.

Product implication:

The lifecycle should display explicit provenance badges for agent claims, gateway observations, systems of record, and independent settlement. Return friction should be reduced without adding an unvalidated backend or third-party processor.

## Changes authorized from this evidence

1. Add a prominent non-timestamping category guard.
2. Add explicit source-provenance badges to each lifecycle event and a legend.
3. Add clipboard-copy return buttons while retaining deterministic JSON download.
4. Do not add a collection backend until actual completion/return data demonstrates material friction.

## Current market conclusion

- Problem recognition: qualitative positive signal from both reviews.
- Correct product comprehension: one of two free-form reviews.
- Structured comprehension result: zero accepted files.
- Qualified workflow evidence: zero accepted files.
- Sandbox commitment: zero.
- Willingness-to-pay evidence: zero.

Decision: `CONTINUE_AND_REFINE`, while keeping TP-MARKET-001 open.
