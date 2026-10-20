# Architecture, components, boundaries
## Components
- Web: Next.js + React + Tailwind. Read-only result display and run controls.
- API: Python FastAPI; validation, orchestration, persistence, exports.
- Runner: separate container running curated fixtures and target adapter.
- Target: deterministic synthetic demo assistant (always available); optional approved LLM adapter after MVP.
- Evaluator: deterministic rule checks for canary disclosure, refusal behavior and restricted action invocation; ambiguous output → NEEDS_REVIEW.
- Storage: PostgreSQL (SQLite acceptable as a **temporary local fallback**, but changing agreed stack requires decision log approval).

## Flow
Web → FastAPI `/api/v1/runs` → controller → restricted runner → target adapter → evaluator → PostgreSQL → API results/compare/report → Web.

## Trust boundaries
1. Browser untrusted; validate all API fields and rate limit operations.
2. Runner untrusted; container isolation is defense-in-depth, **not a hard security boundary by itself**.
3. Target prompt/retrieved docs untrusted; never promote them to privileged instructions.
4. DB/report trusted for audit integrity only after input validation and escaping; reports must treat stored model output as untrusted text.

## Isolation minimums
Non-root UID, no Docker socket mounted, no host mounts except read-only fixture volume, container `cap_drop: ALL`, `no-new-privileges`, process limit, memory/CPU cap, controlled tmpfs, read-only filesystem, egress disabled by default. Provider API mode requires separate reviewed egress policy. Timeout per test.

## Data security
Synthetic data only, deterministic canary tokens (not genuine secrets), store sanitized prompts/responses, redact potential API keys from logs, never execute LLM output as shell code. Do not run user-supplied scripts in MVP.

## Known limitations
Docker shares the host kernel and cannot guarantee perfect isolation. No production security certification or claims. Single-developer local instance for MVP, not multi-tenant.

## Deployment
Preferred local demo Docker Compose: `web`, `api`, `db`, `runner`; the runner must not require Docker-in-Docker or access the host Docker socket. A controller can dispatch to a pre-started constrained runner via internal network; no general-purpose shell API.
