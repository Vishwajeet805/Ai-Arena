# Round 2 action plan | Oct 18–24, 2026
## Owners
**Vishwajeet Singh (Backend & Security Infrastructure):** FastAPI, db models, Docker Compose, restricted runner, API integration, security and deploy scripts.
**Shaurya Dubey (AI Evaluation & Red-Team Engine):** fixture suite, demo assistant, defense gate, evaluator, outcomes verification, adversarial test documentation.
**Pawani Sanghi (Frontend & Product Design):** Next.js dashboard, run creation, progress/results/compare views, error/loading states, demo-friendly polish.

## Day-by-day milestones
- **18 Oct:** agree spec/contracts, create repo and branches, environment + skeleton. Deliver: booting hello-world web/API.
- **19 Oct:** baseline assistant + 3 test fixtures; UI shell, DB schemas, create-run endpoint. Deliver: run ID and mock report.
- **20 Oct:** execute real local cases; evaluator and persistence. Deliver: actual baseline test results.
- **21 Oct:** restricted runner; defense toggle + isolation checks. Deliver: sandboxed execution trace.
- **22 Oct:** pairwise comparison; dashboard integration; JSON export. Deliver: end-to-end live flow.
- **23 Oct:** security hardening, clean README, smoke tests, record raw evidence; fix bugs. Deliver: release candidate.
- **24 Oct:** rehearse, screen record concise video, push tagged commit, inspect organizer submission requirements, upload links ahead of 11:59 PM IST.

## Daily integration ritual (15 min)
At start: pull main, review decision register, announce touched files, agree endpoint changes first. At end: PR review, rerun integration smoke tests, update handoff log and blockers.

## Cut-line
If behind by Oct 21: freeze P1 features and focus on demo target + deterministic tests + compare results. If runner isolation is blocked, show local eval prototype and **explicitly disclose** which constraints are missing rather than misrepresenting security.

## Demo script (90–150 s)
0–15s problem; 15–30s architecture and synthetic-data notice; 30–60s run baseline cases; 60–90s switch defense and rerun; 90–120s compare evidence/export; remainder show GitHub/README, sandbox restrictions and honest limitations.
