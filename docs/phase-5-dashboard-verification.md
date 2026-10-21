# Phase 5 dashboard verification

## Included UI flow
- Fetch available suites from `GET /api/v1/suites` and populate the suite selector from the API.
- Configure the currently supported synthetic demo target, suite, and defense mode (`off` / `on`).
- Submit a run through `POST /api/v1/runs`, showing a busy state and the status returned by the API.
- Inspect case ID, category, verdict, evaluator reason, response excerpt, and run version metadata.
- Compare a baseline run with a defended run through `POST /api/v1/comparisons`; the API response aligns rows by exact case ID.
- Export the API's comparison response as JSON and fetch a full run report from `GET /api/v1/runs/{run_id}/report` before exporting.
- Show connection, loading, empty, and request-error states; native labels, buttons, details/summary, table headers, skip link, and visible keyboard focus are included.

## Local verification performed before this change
The developer reported that backend tests passed (21 passed) and frontend typecheck and Next.js production build passed on the prior dashboard revision.

## Verify this branch
From `frontend/` run:
```powershell
npm run typecheck
npm run build
```

From `backend/` run:
```powershell
pytest -q
```

Run the API on port 8000 and frontend on port 3000, then capture a screenshot of the configuration section and a screenshot of case evidence plus comparison after running the four-case baseline and defended modes.

## Important limitations
The API currently performs deterministic synthetic evaluations synchronously in-process. The UI's progress indicator reflects request submission, not per-case live progress. This is not a real external model evaluation and is not sandboxed. The API currently exposes only `demo_assistant` and the curated `baseline` suite.
