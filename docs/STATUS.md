# Project status — AI Red-Team Arena

Updated: 2026-10-20

## Current phase
Phase 1 — repository and runnable starter foundation.

## Included on feature/phase-1-bootstrap
- Next.js/TypeScript landing dashboard shell.
- FastAPI application with `GET /api/v1/health`.
- Initial health endpoint test.
- PostgreSQL Compose service.
- Dockerfiles and local Compose config.
- GitHub Actions backend/frontend checks.
- Root README and safe environment template.

## Not implemented yet
- Test-run API and persistence.
- Demo assistant and attack fixtures.
- Evaluation engine.
- Restricted test runner.
- Defense comparison and audit report UI.

## Verify next
- [ ] Review/open PR from `feature/phase-1-bootstrap`.
- [ ] Ensure CI passes in GitHub Actions.
- [ ] Run `docker compose up --build` locally.
- [ ] Verify dashboard at localhost:3000.
- [ ] Verify API health at localhost:8000/api/v1/health.
- [ ] Review build output, CORS and local setup.
- [ ] Only then merge and start Phase 2.

Do not mark checklist items complete without actually running them.