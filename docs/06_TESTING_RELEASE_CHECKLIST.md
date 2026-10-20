# QA, security review and release
## Before each PR merge
- [ ] Tests pass; no credentials added; types/contracts not silently changed.
- [ ] API error handling tested; UI handles empty/error/loading.
- [ ] Fixtures only synthetic; no external target endpoints by default.
- [ ] Audit records retain case IDs, run IDs, evaluator version and outcome reason.
- [ ] New feature reflected in README/decision register if architectural.

## Round 2 smoke test
- [ ] Fresh clone boot succeeds following README.
- [ ] Demo suite available offline and without external API key.
- [ ] Create baseline run, status poll, results load.
- [ ] Create defended run; before/after comparisons valid.
- [ ] Export JSON opens and matches UI totals.
- [ ] Kill/timeout one test: ERROR handled and excluded from ASR.
- [ ] Runner cannot reach public internet in default mode; caps/UID inspected.
- [ ] No live credentials, real secrets or Docker socket inside runner.
- [ ] Team roles and spelling correct: Pawani Sanghi.
- [ ] Git commit/tag recorded, demo recording playable, repo accessible to judges as required.

## Failure policy
Technical errors are not counted as secured attacks. Unknown conditions are explicitly labeled NEEDS_REVIEW. Do not fabricate claims or screenshots.
