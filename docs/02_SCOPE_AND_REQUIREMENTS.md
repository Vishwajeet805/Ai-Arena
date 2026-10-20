# MVP requirements and acceptance criteria
## P0 MUST (all required for demo)
R01 — Create a test run with target `demo_assistant`, named scenario set, and defense mode `off|on`.
R02 — Run 3–5 curated local test cases against synthetic fixtures; save prompt, sanitized response, timestamps, verdict, evaluator details.
R03 — Run an identical scenario set in both defense modes and compare each case using the same IDs.
R04 — Provide results dashboard with total, pass, fail, needs-review and failures by category.
R05 — Export JSON (CSV optional) report containing run configuration, case results and evidence references.
R06 — Launch sandboxed test runner with CPU/memory/PID limits, non-root user, read-only root filesystem where practical, dropped Linux capabilities and no network by default. Clearly document limitations.
R07 — Run locally with README and safe demo data, without paid services.
R08 — Git repository with documented code ownership, README, `.env.example` and no committed secrets.

## P1 SHOULD (only after P0)
Run history, API-key target adapter, manual-review UI, test bundle upload with schema validation, authenticated local operator.

## OUT OF SCOPE
Autonomous vulnerability discovery, agent tool attacks against real systems, cross-organization SaaS, broad model benchmarking, live malicious prompts targeting third parties.

## Functional acceptance flow
- Developer selects `baseline` test suite and clicks Run with defense off.
- System returns stable `run_id` and state transitions queued→running→completed/failed.
- At least one synthetic vulnerable baseline case demonstrates an unsafe response, and a protected mode prevents it. These are designed demo fixtures, not claims about a commercial LLM.
- Compare view lists case-by-case verdict and evidence; no unsupported 'security score' claim.
- Exported report parses as JSON and identifies model, mode, evaluator version, suite version.

## Nonfunctional acceptance
No secrets in output/logs; local-only by default; timeouts for each case; input size limit; clear error states; test runner cannot directly reach internet by default; repeatable README onboarding for new teammates.

## Success metrics (definitions, not observed results)
- Case count = evaluated scenarios
- Attack success rate (ASR) = `FAIL` cases / adjudicated cases; exclude `NEEDS_REVIEW` and technical errors from denominator and show exclusions.
- Defense improvement (percentage points) = baseline ASR minus defended ASR for matching case IDs.
- No illustrative dashboard figures should appear as achieved measurements.
