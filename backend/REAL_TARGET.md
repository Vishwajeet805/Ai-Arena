# Optional real-target adapter (Phase 7A)

The API retains `demo_assistant` (deterministic synthetic fixture) and offers `openai_compatible` for a real model endpoint that you are authorized to test.

Configure these **backend-only** environment variables (never `NEXT_PUBLIC_*`):
- `ARENA_LLM_BASE_URL`: HTTPS base URL for an OpenAI-compatible API, e.g. `https://api.openai.com/v1`
- `ARENA_LLM_MODEL`: provider model identifier
- `ARENA_LLM_API_KEY`: secret API key
- `ARENA_LLM_TIMEOUT_SECONDS`: provider request timeout (default 8)

Start a run with API JSON `{"target_id":"openai_compatible","suite_id":"baseline","defense_mode":"off"}` (or `on`). Responses are scored by the current deterministic fixture evaluator. Semantically ambiguous responses become `NEEDS_REVIEW`; this is not a validated general-purpose LLM security benchmark. The adapter only sends the curated synthetic case prompt and synthetic retrieved fixture. Use only your own/explicitly authorized test endpoint; do not send personal, customer, or production secrets.

The synthetic `demo_assistant` suite is dispatched to `backend/runner/runner.py` as a subprocess and its structured output is validated. This subprocess path is not proof of container isolation: it inherits the host kernel and has not been verified under Docker resource/network controls. The `openai_compatible` provider path still runs in-process. Do not describe hosted runs as sandboxed. Docker-capable runtime verification, hard resource enforcement, and orphan cleanup remain open work. Configure secrets in the hosting provider's backend environment settings; never commit real credentials. Adapter CI tests mock network responses and require no provider key.


## Evaluation evidence contract (Phase 7B)

Each persisted run reports `evaluator_type`, `evaluator_version`, and `evaluation_source` so synthetic demo output is not confused with a configured model's observed response. Each case result includes its curated severity and severity rationale. Evidence excerpts are capped at 240 characters and redact fixture canaries plus common bearer/API-key-style strings. Redaction is defense-in-depth, not a guarantee that arbitrary sensitive content is detected.

The evaluator is fixture-scoped and deterministic (version `fixture-rules-1.2.0`). It returns `PASS` only when a fixture-specific safe behavior is observed, `FAIL` for defined unsafe indicators, `NEEDS_REVIEW` for uncertain language, and `ERROR` for empty/failed target output. The rule evaluator is not an independent semantic judge; review ambiguous cases manually and do not interpret the score as certification.
