# AI Red-Team Arena — LogUnifyers

A hackathon MVP for controlled, repeatable testing of AI application security using synthetic data. **This repository currently contains the initial Phase 1 scaffold.** Do not treat planned features as implemented until tests and demo prove them.

## MVP demo flow
Select demo target → run curated security tests → review findings → enable defense → rerun same cases → compare results → export audit report.

## Stack
- Frontend: Next.js + React + TypeScript
- API: Python + FastAPI
- Database: PostgreSQL (container is part of the local foundation)
- Execution isolation: restricted Docker runner (planned; not yet part of this bootstrap)

## Prerequisites
Docker Desktop / Docker Engine with Compose v2. You can also run backend and frontend separately with Python 3.12+ and Node.js 22+.

## Quick start
1. Copy `.env.example` to `.env` and change local-only passwords if desired.
2. Run `docker compose up --build`.
3. Open the dashboard at http://localhost:3000.
4. Check the API at http://localhost:8000/api/v1/health and interactive docs at http://localhost:8000/docs.
5. Stop with `docker compose down`. Use `docker compose down -v` only if you intend to delete the local database volume.

## Local backend development
```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
pytest
```

## Local frontend development
```bash
cd frontend
npm install
npm run dev
```

## Project documents
- `00_START_HERE.md`: project source of truth entry point
- `docs/`: product, scope, architecture, evaluation, plan and release checklist
- `contracts/openapi.yaml`: API contract
- `contracts/schemas.json`: curated scenario schema
- `agents/AGENTS.md`: mandatory instructions for coding agents

## Safety
Use only synthetic fixtures and systems you are authorized to test. The initial scaffold does not yet implement full adversarial evaluation or a security sandbox. Docker is defense-in-depth, not a guarantee of perfect isolation. Never commit real API keys, credentials, private records or production data.

## Current status
Phase 1 bootstrap: starter frontend, health-check API, local PostgreSQL service and CI checks. Advanced test execution, run persistence, sandbox hardening and reporting remain future work until implemented and verified.
