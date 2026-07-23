# TimeProofs Structural Error Codes v0.1

Status: EXPERIMENTAL NORMATIVE REGISTRY VIEW  
Profile: `TP-JSON-0.1`  
Generated from: `spec/error-codes-v0.1.json`

The JSON registry is the machine-readable authority for stable v0.1 structural result codes. Human-readable messages and JSON paths are diagnostic and MAY vary. Codes and their structural classification MUST remain stable within the v0.1 profile.

| Code | Category | Outcome | Normative meaning |
|---|---|---|---|
| `INPUT_NOT_STRING` | PARSING | `INVALID` | Input to the strict JSON parser is not a string. |
| `EXPECTED_STRING` | PARSING | `INVALID` | A JSON string opening quote was expected. |
| `INVALID_ESCAPE` | PARSING | `INVALID` | A JSON string contains an invalid escape sequence. |
| `INVALID_UNICODE_ESCAPE` | PARSING | `INVALID` | A Unicode escape is malformed. |
| `UNPAIRED_HIGH_SURROGATE` | PARSING | `INVALID` | A high surrogate is not paired with a low surrogate. |
| `UNPAIRED_LOW_SURROGATE` | PARSING | `INVALID` | A low surrogate appears without a preceding high surrogate. |
| `UNESCAPED_CONTROL_CHARACTER` | PARSING | `INVALID` | A JSON string contains an unescaped control character. |
| `UNTERMINATED_STRING` | PARSING | `INVALID` | A JSON string is not terminated. |
| `LEADING_ZERO` | PARSING | `INVALID` | A JSON number contains a forbidden leading zero. |
| `INVALID_NUMBER` | PARSING | `INVALID` | A JSON number is malformed. |
| `NON_FINITE_NUMBER` | PARSING | `INVALID` | A JSON number cannot be represented as a supported finite number. |
| `EXPECTED_COMMA` | PARSING | `INVALID` | A comma was expected between JSON members or elements. |
| `EXPECTED_PROPERTY_NAME` | PARSING | `INVALID` | A JSON object property name was expected. |
| `DUPLICATE_PROPERTY` | PARSING | `INVALID` | A JSON object contains a duplicate property name. |
| `EXPECTED_COLON` | PARSING | `INVALID` | A colon was expected after a JSON property name. |
| `INVALID_LITERAL` | PARSING | `INVALID` | A JSON literal is malformed. |
| `UNEXPECTED_TOKEN` | PARSING | `INVALID` | An unexpected JSON token was encountered. |
| `TRAILING_DATA` | PARSING | `INVALID` | Data appears after the complete JSON value. |
| `JSON_PARSE_ERROR` | PARSING | `INVALID` | An unclassified JSON parsing failure occurred. |
| `BUNDLE_NOT_OBJECT` | ENVELOPE | `INVALID` | The bundle root is not a JSON object. |
| `TOP_LEVEL_MEMBERS_INVALID` | ENVELOPE | `INVALID` | The root members are not exactly payload and proofs. |
| `PAYLOAD_NOT_OBJECT` | ENVELOPE | `INVALID` | The payload member is not an object. |
| `PROOFS_NOT_ARRAY` | ENVELOPE | `INVALID` | The proofs member is not an array. |
| `PAYLOAD_MEMBERS_INVALID` | PAYLOAD | `INVALID` | Payload members do not exactly match TP-JSON-0.1. |
| `SPEC_VERSION_UNSUPPORTED` | PAYLOAD | `INVALID` | The specification version is unsupported. |
| `PROFILE_UNSUPPORTED` | PAYLOAD | `INVALID` | The serialization profile is unsupported. |
| `BUNDLE_ID_INVALID` | PAYLOAD | `INVALID` | bundle_id is not a non-empty opaque string. |
| `ACTION_ID_INVALID` | PAYLOAD | `INVALID` | action_id is not a non-empty opaque string. |
| `CREATED_AT_INVALID` | PAYLOAD | `INVALID` | created_at is not a valid TP-JSON-0.1 UTC timestamp. |
| `PAYLOAD_ARRAY_INVALID` | PAYLOAD | `INVALID` | A required payload collection is not an array. |
| `PAYLOAD_EXTENSIONS_INVALID` | PAYLOAD | `INVALID` | payload.extensions is not an object. |
| `PREDECESSOR_DIGEST_INVALID` | PAYLOAD | `INVALID` | A predecessor payload digest is malformed. |
| `DUPLICATE_PREDECESSOR_DIGEST` | PAYLOAD | `INVALID` | A predecessor payload digest is repeated. |
| `ISSUER_NOT_OBJECT` | ISSUER | `INVALID` | An issuer entry is not an object. |
| `ISSUER_MEMBERS_INVALID` | ISSUER | `INVALID` | Issuer members do not exactly match TP-JSON-0.1. |
| `ISSUER_ID_INVALID` | ISSUER | `INVALID` | issuer_id is not a non-empty string. |
| `ISSUER_DISPLAY_NAME_INVALID` | ISSUER | `INVALID` | display_name is not a non-empty string. |
| `ISSUER_TYPE_INVALID` | ISSUER | `INVALID` | issuer_type is unsupported. |
| `ISSUER_IDENTIFIERS_INVALID` | ISSUER | `INVALID` | identifiers is not an array. |
| `ISSUER_KEYS_INVALID` | ISSUER | `INVALID` | keys is not an array. |
| `ISSUER_EXTENSIONS_INVALID` | ISSUER | `INVALID` | issuer.extensions is not an object. |
| `IDENTIFIER_NOT_OBJECT` | ISSUER | `INVALID` | An issuer identifier is not an object. |
| `IDENTIFIER_MEMBERS_INVALID` | ISSUER | `INVALID` | Identifier members are not exactly scheme and value. |
| `IDENTIFIER_SCHEME_INVALID` | ISSUER | `INVALID` | Identifier scheme is not a non-empty string. |
| `IDENTIFIER_VALUE_INVALID` | ISSUER | `INVALID` | Identifier value is not a non-empty string. |
| `DUPLICATE_ISSUER_IDENTIFIER` | ISSUER | `INVALID` | An issuer repeats the same scheme and value identifier. |
| `KEY_NOT_OBJECT` | KEY | `INVALID` | A key entry is not an object. |
| `KEY_MEMBERS_INVALID` | KEY | `INVALID` | Key members are outside the TP-JSON-0.1 key model. |
| `KEY_ID_INVALID` | KEY | `INVALID` | key_id is not a non-empty string. |
| `DUPLICATE_KEY_ID` | KEY | `INVALID` | key_id is repeated within an issuer. |
| `KEY_ALGORITHM_UNSUPPORTED` | KEY | `INVALID` | The key algorithm is unsupported. |
| `KEY_FORMAT_UNSUPPORTED` | KEY | `INVALID` | The public key format is unsupported. |
| `PUBLIC_KEY_INVALID` | KEY | `INVALID` | The public key is not a usable SPKI PEM Ed25519 key. |
| `KEY_VALID_FROM_INVALID` | KEY | `INVALID` | valid_from is not a valid UTC timestamp. |
| `KEY_VALID_UNTIL_INVALID` | KEY | `INVALID` | valid_until is not a valid UTC timestamp. |
| `KEY_VALIDITY_INTERVAL_INVALID` | KEY | `INVALID` | valid_until is not later than valid_from. |
| `KEY_REVOCATION_REF_INVALID` | KEY | `INVALID` | revocation_ref is present but not a non-empty string. |
| `DUPLICATE_ISSUER_ID` | REFERENCE | `INVALID` | issuer_id is repeated in the issuer collection. |
| `DUPLICATE_OBJECT_ID` | REFERENCE | `INVALID` | An addressable payload object identifier is repeated. |
| `EVENT_NOT_OBJECT` | EVENT | `INVALID` | An Outcome Event is not an object. |
| `EVENT_MEMBERS_INVALID` | EVENT | `INVALID` | Outcome Event members do not exactly match TP-JSON-0.1. |
| `EVENT_REQUIRED_MEMBER_INVALID` | EVENT | `INVALID` | A required Outcome Event string member is invalid. |
| `EVENT_PHASE_INVALID` | EVENT | `INVALID` | The lifecycle phase is unsupported. |
| `EVENT_TYPE_INVALID` | EVENT | `INVALID` | event_type is not a lower-case namespaced token. |
| `EVENT_STATUS_INVALID` | EVENT | `INVALID` | The event status is unsupported. |
| `SOURCE_CLASS_INVALID` | EVENT | `INVALID` | The evidence source class is unsupported. |
| `EVENT_OCCURRED_AT_INVALID` | EVENT | `INVALID` | occurred_at is not a valid UTC timestamp. |
| `EVENT_RECORDED_AT_INVALID` | EVENT | `INVALID` | recorded_at is not a valid UTC timestamp. |
| `EVENT_RECORDED_BEFORE_OCCURRED` | EVENT | `INVALID` | recorded_at precedes occurred_at. |
| `EVENT_ISSUER_NOT_FOUND` | REFERENCE | `INVALID` | An event issuer_ref does not resolve. |
| `EVENT_PARENTS_INVALID` | EVENT | `INVALID` | parent_event_digests is not an array. |
| `DUPLICATE_PARENT_DIGEST` | EVENT | `INVALID` | An event repeats a parent digest. |
| `EVENT_EVIDENCE_REFS_INVALID` | EVENT | `INVALID` | evidence_refs is not an array. |
| `DUPLICATE_EVENT_EVIDENCE_REF` | EVENT | `INVALID` | An event repeats an evidence reference. |
| `EVENT_ACTOR_INVALID` | EVENT | `INVALID` | actor is not a conforming Entity Reference. |
| `EVENT_SUBJECT_INVALID` | EVENT | `INVALID` | subject is not a conforming Entity Reference. |
| `ENTITY_REF_MEMBERS_INVALID` | EVENT | `INVALID` | Entity Reference members are outside the TP-JSON-0.1 model. |
| `ENTITY_TYPE_INVALID` | EVENT | `INVALID` | entity_type is not a non-empty string. |
| `ENTITY_ID_INVALID` | EVENT | `INVALID` | entity_id is not a non-empty string. |
| `ENTITY_DISPLAY_NAME_INVALID` | EVENT | `INVALID` | display_name is present but not a string. |
| `EVENT_CLAIM_INVALID` | EVENT | `INVALID` | claim is not a JSON object. |
| `EVENT_EXTENSIONS_INVALID` | EVENT | `INVALID` | event.extensions is not an object. |
| `OBJECT_DIGEST_INVALID` | DIGEST | `INVALID` | object_digest is missing or malformed. |
| `OBJECT_DIGEST_MISMATCH` | DIGEST | `INVALID` | object_digest does not match the canonical object content. |
| `OBJECT_DIGEST_CALCULATION_FAILED` | DIGEST | `INVALID` | The verifier could not calculate an object digest. |
| `PARENT_DIGEST_INVALID` | GRAPH | `INVALID` | A parent event digest is malformed. |
| `PARENT_EVENT_NOT_FOUND` | GRAPH | `INVALID` | A parent event digest does not resolve in the current bundle. |
| `EVENT_SELF_PARENT` | GRAPH | `INVALID` | An event references its own digest as a parent. |
| `EVENT_EVIDENCE_NOT_FOUND` | REFERENCE | `INVALID` | An event evidence reference does not resolve. |
| `EVIDENCE_NOT_OBJECT` | EVIDENCE | `INVALID` | An Evidence Item is not an object. |
| `EVIDENCE_MEMBERS_INVALID` | EVIDENCE | `INVALID` | Evidence Item members do not exactly match TP-JSON-0.1. |
| `EVIDENCE_REQUIRED_MEMBER_INVALID` | EVIDENCE | `INVALID` | A required Evidence Item string member is invalid. |
| `EVIDENCE_TYPE_INVALID` | EVIDENCE | `INVALID` | evidence_type is not a namespaced upper-case token. |
| `MEDIA_TYPE_INVALID` | EVIDENCE | `INVALID` | media_type is not a syntactically valid media type. |
| `EVIDENCE_ISSUER_NOT_FOUND` | REFERENCE | `INVALID` | An evidence issuer_ref does not resolve. |
| `CONTENT_DIGEST_INVALID` | EVIDENCE | `INVALID` | content_digest is malformed. |
| `EVIDENCE_LOCATOR_INVALID` | EVIDENCE | `INVALID` | locator is not a conforming Evidence Locator. |
| `LOCATOR_MEMBERS_INVALID` | EVIDENCE | `INVALID` | Locator members do not exactly match TP-JSON-0.1. |
| `LOCATOR_SCHEME_INVALID` | EVIDENCE | `INVALID` | The locator scheme is unsupported. |
| `LOCATOR_VALUE_INVALID` | EVIDENCE | `INVALID` | The locator value is not a non-empty string. |
| `LOCATOR_RETRIEVAL_POLICY_INVALID` | EVIDENCE | `INVALID` | The retrieval policy is unsupported. |
| `LOCATOR_POLICY_CONFLICT` | EVIDENCE | `INVALID` | The locator scheme and retrieval policy are inconsistent. |
| `CLAIM_SCOPE_INVALID` | EVIDENCE | `INVALID` | claim_scope is not a non-empty array of event type strings. |
| `DUPLICATE_CLAIM_SCOPE` | EVIDENCE | `INVALID` | claim_scope repeats an entry. |
| `DISCLOSURE_INVALID` | EVIDENCE | `INVALID` | The disclosure class is unsupported. |
| `EVIDENCE_EXTENSIONS_INVALID` | EVIDENCE | `INVALID` | evidence.extensions is not an object. |
| `RELATIONSHIP_NOT_OBJECT` | RELATIONSHIP | `INVALID` | A Relationship is not an object. |
| `RELATIONSHIP_MEMBERS_INVALID` | RELATIONSHIP | `INVALID` | Relationship members do not exactly match TP-JSON-0.1. |
| `RELATIONSHIP_REQUIRED_MEMBER_INVALID` | RELATIONSHIP | `INVALID` | A required Relationship string member is invalid. |
| `RELATIONSHIP_TYPE_INVALID` | RELATIONSHIP | `INVALID` | The relationship type is unsupported. |
| `RELATIONSHIP_REF_INVALID` | RELATIONSHIP | `INVALID` | A relationship endpoint is not a supported typed reference. |
| `RELATIONSHIP_SELF_REFERENCE` | RELATIONSHIP | `INVALID` | A relationship points from and to the same reference. |
| `RELATIONSHIP_EXTENSIONS_INVALID` | RELATIONSHIP | `INVALID` | relationship.extensions is not an object. |
| `RELATIONSHIP_FROM_NOT_FOUND` | REFERENCE | `INVALID` | A relationship from_ref does not resolve. |
| `RELATIONSHIP_TO_NOT_FOUND` | REFERENCE | `INVALID` | A relationship to_ref does not resolve. |
| `PROOF_NOT_OBJECT` | PROOF | `INVALID` | A Proof is not an object. |
| `PROOF_MEMBERS_INVALID` | PROOF | `INVALID` | Proof members do not exactly match TP-JSON-0.1. |
| `PROOF_ID_INVALID` | PROOF | `INVALID` | proof_id is not a non-empty string. |
| `DUPLICATE_PROOF_ID` | PROOF | `INVALID` | proof_id is repeated. |
| `PROOF_TYPE_UNSUPPORTED` | PROOF | `INVALID` | The proof type is unsupported. |
| `PROOF_TARGET_INVALID` | PROOF | `INVALID` | target is not a conforming Proof Target. |
| `PROOF_TARGET_MEMBERS_INVALID` | PROOF | `INVALID` | Proof Target members do not match the target type. |
| `PROOF_TARGET_TYPE_INVALID` | PROOF | `INVALID` | The proof target type is unsupported. |
| `PROOF_TARGET_ID_REQUIRED` | PROOF | `INVALID` | target_id is required for a non-payload target. |
| `PROOF_TARGET_ID_FORBIDDEN` | PROOF | `INVALID` | target_id is forbidden for BUNDLE_PAYLOAD. |
| `PROOF_TARGET_DIGEST_INVALID` | PROOF | `INVALID` | The declared proof target digest is malformed. |
| `PROOF_CREATED_AT_INVALID` | PROOF | `INVALID` | Proof created_at is not a valid UTC timestamp. |
| `PROOF_ISSUER_NOT_FOUND` | REFERENCE | `INVALID` | A proof issuer_ref does not resolve. |
| `VERIFICATION_METHOD_INVALID` | PROOF | `INVALID` | verification_method is not a conforming issuer#key reference. |
| `PROOF_ALGORITHM_UNSUPPORTED` | PROOF | `INVALID` | The proof algorithm is unsupported. |
| `PROOF_VALUE_INVALID` | PROOF | `INVALID` | proof_value is not canonical unpadded base64url. |
| `PROOF_TARGET_NOT_FOUND` | PROOF | `INVALID` | The proof target does not resolve. |
| `PROOF_TARGET_DIGEST_MISMATCH` | PROOF | `INVALID` | The declared proof target digest differs from the resolved target digest. |
| `INVALID_VERIFICATION_METHOD` | PROOF | `INVALID` | The verification method cannot be parsed. |
| `PROOF_ISSUER_MISMATCH` | PROOF | `INVALID` | Proof issuer fields do not identify the same issuer. |
| `VERIFICATION_KEY_NOT_FOUND` | PROOF | `INVALID` | The verification key does not resolve under the issuer. |
| `UNSUPPORTED_SIGNATURE_ALGORITHM` | PROOF | `INVALID` | The proof or key signature algorithm is unsupported. |
| `UNSUPPORTED_PUBLIC_KEY_FORMAT` | PROOF | `INVALID` | The public key format is unsupported. |
| `SIGNATURE_VALID` | PROOF | `VALID` | The signature is valid. |
| `SIGNATURE_INVALID` | PROOF | `INVALID` | The Ed25519 signature is invalid. |
| `SIGNATURE_PROCESSING_ERROR` | PROOF | `INVALID` | Signature processing failed. |
| `PROOF_CREATED_BEFORE_KEY_VALIDITY` | PROOF | `INVALID` | The proof predates the declared key validity interval. |
| `PROOF_CREATED_AFTER_KEY_VALIDITY` | PROOF | `INVALID` | The proof is later than the declared key validity interval. |
| `PAYLOAD_DIGEST_CALCULATION_FAILED` | DIGEST | `INVALID` | The verifier could not calculate the payload digest. |
| `NO_EVENTS` | COMPLETENESS | `INCOMPLETE` | The bundle contains no Outcome Events. |
| `NO_EVIDENCE` | COMPLETENESS | `INCOMPLETE` | The bundle contains no Evidence Items. |
| `NO_PROOFS` | COMPLETENESS | `INCOMPLETE` | The bundle contains no Proofs. |
