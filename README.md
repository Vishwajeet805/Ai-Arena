# AI Red-Team Arena — LogUnifyers

A hackathon MVP for controlled, repeatable testing of AI application security using synthetic data.

## Live demo

- **Dashboard:** https://ai-arena-five-pi.vercel.app/
- **API health:** https://ai-arena-pa82.onrender.com/api/v1/health
- **Interactive API docs:** https://ai-arena-pa82.onrender.com/docs

The hosted dashboard has been manually smoke-tested: suite loading, baseline and defended runs, run history, comparison, and JSON export worked. The API is hosted on Render and the frontend on Vercel. Render's free service may take a little time to wake up after inactivity.

### Deployment configuration

- Vercel frontend project root: `frontend`
- Frontend environment variable: `NEXT_PUBLIC_API_BASE_URL=https://ai-arena-pa82.onrender.com`
- Render API service root: `backend`
- Render API environment variables: `DATABASE_URL` (Render PostgreSQL connection URL) and `CORS_ORIGINS=https://ai-arena-five-pi.vercel.app`

Do not publish database credentials or other secrets in this README.

## Current implementation status

- FastAPI persists deterministic demo runs and exposes run history, comparisons and JSON reports.
- Curated suite has four synthetic cases; the deterministic demo target never calls an external model, tool, shell, or third-party target.
- Attack Success Rate uses only decisive PASS/FAIL outcomes. ERROR and NEEDS_REVIEW are excluded from the denominator and returned as separate excluded counts.
- A separate non-root runner image and constrained Compose profile are provided in `backend/runner`. It accepts only fixed case identifiers and defense mode.
- **Important limitation:** the API has not yet been wired to dispatch evaluations to the runner container. API runs still execute in-process, so do not describe API execution as sandboxed or isolated.
- Docker shares the host kernel and is defense-in-depth, not a guarantee of perfect isolation.

## Stack

- Frontend: Next.js + React + TypeScript
- API: Python + FastAPI
- Database: PostgreSQL through Docker Compose; SQLite is used only as a local fallback
- Runner: separate Docker image with non-root user, no network, read-only root filesystem, dropped capabilities, no-new-privileges, PID/memory/CPU limits, and no host mounts or Docker socket

## Prerequisites

Docker Desktop / Docker Engine with Compose v2. For local development, Python 3.12+ and Node.js 22+.

## Quick start

1. Copy `.env.example` to `.env` and change local-only passwords if desired.
2. Run `docker compose up --build`.
3. Open the dashboard at http://localhost:3000.
4. Check the API at http://localhost:8000/api/v1/health and interactive docs at http://localhost:8000/docs.
5. Stop with `docker compose down`. Use `docker compose down -v` only if you intend to delete the local database volume.

The runner is opt-in and does not start during the default app startup. Build it separately, then run the service in a one-shot container:

```sh
docker compose --profile runner build runner
printf '%s' '{"case_ids":["BASE-PINJ-001"],"defense_mode":"on"}' | docker compose --profile runner run --rm -T runner
```

The runner service has no network, published ports, host bind mounts, credentials, or Docker socket. It accepts fixture IDs only and does not execute arbitrary code. Verify these settings on the actual Docker host before presenting them as runtime evidence.

## Local backend development

```bash
cd backend
python -m venv .venv
# Windows PowerShell: .\\.venv\\Scripts\\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
pytest -q
```

## Local frontend development

```bash
cd frontend
npm install
npm run dev
```

## API endpoints

- `GET /api/v1/health`
- `GET /api/v1/suites`
- `POST /api/v1/runs`
- `GET /api/v1/runs?limit=20`
- `GET /api/v1/runs/{run_id}`
- `POST /api/v1/comparisons`
- `GET /api/v1/runs/{run_id}/report`

Comparisons reject runs with incompatible suite, target, or evaluator versions, and reject runs with non-matching case-ID sets. Evaluator and target version metadata are intended for auditability.

## Safety and known issues

Use only synthetic fixtures and systems you are authorized to test. No arbitrary script execution, production data, genuine secrets, live exploitation, external scanning, or third-party target execution is part of this prototype. The runner container is currently a constrained protocol container, not an execution engine for user-supplied workloads, and it is not yet orchestrated by the API. The end-to-end acceptance flow is **not verified** until backend tests, frontend checks, Compose startup, and the runner command have been executed on a real development host.

## Project documents

- `00_START_HERE.md`: project source-of-truth entry point
- `docs/`: product, scope, architecture, evaluation, plan and release checklist
- `contracts/openapi.yaml`: API contract
- `contracts/schemas.json`: curated scenario schema
- `agents/AGENTS.md`: coding-agent instructions
