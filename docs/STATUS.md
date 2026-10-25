# Project status — AI Red-Team Arena

Updated: 2026-10-23

## Current phase
Release candidate preparation (Phase 6). Phases 1–5 (foundation, fixtures, run API, persistence, comparison, dashboard) are in the repo.

## Verified in this update (commands actually run, see `docs/HANDOFF_LOG_TASK4.md`)
- Backend tests: 31 passed.
- Frontend typecheck and production build: pass.
- Live API smoke test (`scripts/smoke_test.py`): 7/7 checks pass.

## Implemented
- Run creation, persistence, history, comparison, JSON report; per-case ERROR/timeout isolation.
- Dashboard: suite selection, defense toggle, evidence, totals/failures-by-category, comparison, JSON and CSV export.

## Not verified / not done
- [ ] `docker compose up --build` on a Docker host, PostgreSQL path, fresh-clone boot.
- [ ] Runner restrictions checked on a Docker host (`--network none`, caps, read-only, limits).
- [ ] API dispatch to the runner is NOT implemented; runs are in-process and must not be called sandboxed.
- [ ] Screenshots of the final UI, demo video, git tag, organizer submission form (Q-001, Q-002).

Do not mark checklist items complete without actually running them.
