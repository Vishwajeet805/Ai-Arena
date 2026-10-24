# Optional real-target adapter (Phase 7A)

The API retains `demo_assistant` (deterministic synthetic fixture) and offers `openai_compatible` for a real model endpoint that you are authorized to test.

Configure these **backend-only** environment variables (never `NEXT_PUBLIC_*`):
- `ARENA_LLM_BASE_URL`: HTTPS base URL for an OpenAI-compatible API, e.g. `https://api.openai.com/v1`
- `ARENA_LLM_MODEL`: provider model identifier
- `ARENA_LLM_API_KEY`: secret API key
- `ARENA_LLM_TIMEOUT_SECONDS`: provider request timeout (default 8)

Start a run with API JSON `{"target_id":"openai_compatible","suite_id":"baseline","defense_mode":"off"}` (or `on`). Responses are scored by the current deterministic fixture evaluator. Semantically ambiguous responses become `NEEDS_REVIEW`; this is not a validated general-purpose LLM security benchmark. The adapter only sends the curated synthetic case prompt and synthetic retrieved fixture. Use only your own/explicitly authorized test endpoint; do not send personal, customer, or production secrets.

The API currently runs cases in-process; the restricted runner is not integrated. Do not claim these runs are sandboxed. Configure secrets in the hosting provider's backend environment settings; never commit real credentials. Adapter CI tests mock network responses and require no provider key.
