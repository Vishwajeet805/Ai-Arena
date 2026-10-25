# Phase 7E — Operational QA and release evidence

This document distinguishes automated CI evidence from checks that still require the hosted deployment or a person with access to the deployment controls. Do not mark a manual/hosted check as passed without recording an observed result.

## Automated checks

The CI workflow covers:
- Backend tests and frontend typecheck/build.
- Docker Compose API-to-runner smoke flow, including runner outage mapping to `ERROR`.
- PostgreSQL and API restart persistence: create a synthetic run, restart PostgreSQL, wait for database readiness, restart the API, then verify that run detail, JSON report, and run history retain the same case IDs, verdicts, reasons, and response excerpts.

The CI job logs are the evidence for the automated persistence check. A green job does **not** prove that the hosted Render database/service was restarted or that the hosted deployment has the same configuration.

## Hosted persistence check (manual; authorized operator only)

1. Confirm the deployment points to the expected PostgreSQL database and never paste its credential-bearing URL into issues or logs.
2. In the hosted dashboard, create a baseline run using the synthetic demo target and note the run ID.
3. Open run history and the run JSON report. Record case IDs, verdicts, reasons, response excerpts, suite/evaluator/target version, and timestamps.
4. Trigger an ordinary API service restart/redeploy using the hosting provider's controls. Do not delete the database or its volume.
5. After health returns `{"status":"ok"}`, fetch the same run ID, open its report, and refresh history.
6. Verify the same run ID and case-level data persist. Save a redacted observation below. Never record database URLs, tokens, API keys, or personal/production data.

### Hosted persistence observation

- Date/time (UTC):
- Deployment/service revision:
- Run ID (may be shortened):
- API health after restart:
- Run detail matched before restart: PASS / FAIL / NOT RUN
- JSON report matched before restart: PASS / FAIL / NOT RUN
- History still contains run: PASS / FAIL / NOT RUN
- Redacted notes / incident link:

## Timeout, error, empty and retry checks

- [ ] API unavailable at initial load shows the disconnected state and does not present invented results.
- [ ] Failed run request shows a readable error and the Retry run action can be used after service recovery.
- [ ] Failed history request shows its error and Retry history can be used after service recovery.
- [ ] Empty history explains that no saved runs exist.
- [ ] A synthetic run with runner unavailable records `ERROR` outcomes, not successful `PASS` outcomes (covered by Docker Compose CI).
- [ ] A timed-out in-process Python thread may continue running after the caller records `ERROR`; the current timeout is not hard cancellation or a security isolation boundary.

## Data consistency and release checklist

- [ ] Baseline and defended run use the same target/version, suite/version, and evaluator version.
- [ ] Comparison lists matching case IDs and separates `NEEDS_REVIEW`/`ERROR` from decisive ASR.
- [ ] Comparison evidence and run JSON report correspond to the persisted run details.
- [ ] Confirm only synthetic fixtures were used; no secrets, customer data, or unauthorized third-party target.
- [ ] Review repository diff and commit history for local database files and credentials. `.gitignore` excludes `*.db`, `*.sqlite`, and `*.sqlite3`.
- [ ] Capture a short dashboard walkthrough/screenshots if required by the organizer.
- [ ] Verify the current organizer submission rules, deadline, repository visibility, team details, and video/link requirements.

## Known limitations

The current target and four-case suite are deterministic synthetic fixtures. Results are not a real-world model security guarantee. Docker restrictions are defense-in-depth and do not prove perfect isolation. Hosted runner isolation and hosted PostgreSQL restart persistence must be verified against the actual deployed configuration, not inferred from local/CI success.
