# Phase 6 — Evaluation hardening, R04/R05 gaps, smoke test

- Date: 2026-10-23
- Owner: AI Evaluation & Red-Team Engine
- Scope: per-case error/timeout isolation, evaluator coverage tests, run summary + CSV export in the dashboard, scripted smoke test.
- Files changed: `backend/app/main.py`, `backend/tests/test_phase6_evaluation.py` (new), `frontend/src/app/page.tsx`, `frontend/src/app/globals.css`, `scripts/smoke_test.py` (new), `docs/STATUS.md`, `docs/07_DECISIONS_AND_CHANGELOG.md`, `README.md`.
- Implemented:
  - `_run_case`: each case runs under `CASE_TIMEOUT_SECONDS` (default 2s, env-overridable). A crash or timeout yields verdict `ERROR` for that case only; the run still completes and ERROR is excluded from ASR (checklist item "Kill/timeout one test").
  - Tests: every fixture FAILs with defense off and PASSes with defense on; a canary in any response always FAILs; crash and timeout paths become ERROR and are excluded from ASR.
  - Dashboard: verdict totals and failures-by-category (R04), CSV export with formula-injection neutralisation (R05 optional). Both derive from existing API fields; no contract change.
  - `scripts/smoke_test.py`: end-to-end check against a running API.
- Commands run and results (this session, local sandbox):
  - `cd backend && python -m pytest -q` → 31 passed (21 existing + 10 new).
  - `cd frontend && npm run typecheck` → no errors; `npm run build` → compiled successfully.
  - `uvicorn app.main:app` + `python scripts/smoke_test.py` → all 7 checks PASS; baseline ASR 1.0, defended ASR 0.0, 0 excluded (4 deterministic synthetic cases).
- NOT verified: Docker (not available here): `docker compose up --build`, the runner restrictions, PostgreSQL path, fresh-clone boot, hosted Render/Vercel deployment, browser/screenshot check of the new UI, demo video.
- Known limitations (unchanged): execution is in-process and synchronous; the runner container is not wired to the API, so runs must not be described as sandboxed. The timeout bounds waiting on a case, but a Python thread cannot be force-killed; real isolation needs the runner.
- Contract changes: none.
- Next owner actions: run the Docker checks in `docs/06_TESTING_RELEASE_CHECKLIST.md` on a Docker host and tick only what you ran; capture screenshots; record the demo; tag the release; confirm submission requirements (Q-001, Q-002) before 24 Oct 11:59 PM IST.
