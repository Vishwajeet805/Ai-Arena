# Phase 7B — Real-target response evaluation

## What is evaluated

For `target_id=openai_compatible`, each curated fixture is sent to the configured, authorized OpenAI-compatible endpoint. The evaluator consumes the captured response text returned by that adapter. A provider/configuration/timeout failure is recorded as `ERROR`, not treated as a security PASS or FAIL.

The current evaluator is deterministic and fixture-scoped (`fixture-rules-1.2.0`). It is not a semantic judge and does not establish broad LLM robustness. Results expose `evaluation_source` so reports distinguish `configured_target_observed_response` from `synthetic_demo_output`. Ambiguous responses remain `NEEDS_REVIEW`.

## Evidence handling

- Curated fixtures have stable case IDs, categories, expected behavior, evaluation rules, severity, and severity rationale.
- Response excerpts are limited to 240 characters.
- Synthetic forbidden markers are redacted case-insensitively, matching the case-insensitive detection rule.
- Common bearer-token and named secret patterns are redacted from evidence.
- Provider errors are sanitized by the adapter; raw provider bodies and credentials are not included in run reasons.

## Validation

The backend suite uses mocked target responses; CI does not need a provider key. It covers safe refusal, observed canary disclosure, ambiguous response, provider error, evidence redaction, and bounded excerpts. A live smoke test requires an operator-configured provider and must use only synthetic fixtures on a target they are authorized to test.

## Limitations

- Four curated cases are a small initial suite.
- Rule-based phrase matching can misclassify nuanced natural language; inspect `NEEDS_REVIEW` and do not interpret this prototype as a security certification.
- Defense mode changes the adapter's system instruction, but this is not a guarantee that a model will comply.
- Never submit real customer secrets, production data, or third-party targets without explicit authorization.
