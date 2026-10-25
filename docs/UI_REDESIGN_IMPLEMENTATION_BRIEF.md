# AI Arena — Cinematic Security Lab UI Redesign Brief

**Repository:** https://github.com/Vishwajeet805/Ai-Arena  
**Working branch:** feat/editorial-arena-redesign  
**Direction:** Cinematic Security Lab · **Theme:** Dark-first · **Motion:** Balanced  
**Environment:** VS Code + GitHub Copilot · **Stack:** 21st.dev, shadcn/ui, Motion for React, Lucide

## 1. Executive brief

Redesign AI Arena as a premium, cinematic AI-security workbench: a dark instrument-panel interface with a distinctive threat-scan motif, restrained ember accents, crisp technical typography, readable evidence, and clear separation between setup, execution, comparison, and history. It should feel deliberately art-directed—not like a generic AI-generated dashboard or a collection of unrelated component demos.

The visual story is **DETECT → EVALUATE → COMPARE → PRESERVE EVIDENCE**. The landing page earns attention; the operational workspace stays quiet and information-dense. Motion should explain state changes and guide attention, not decorate every element.

This is a frontend presentation and information-architecture redesign. Preserve the backend, API contracts, evaluator semantics, run behavior, comparison behavior, persisted history, evidence details, and exports. Do not replace live data with mock data, hard-coded metrics, fake progress, or simulated success states.

## 2. Existing app inspection

The current working branch was inspected when this brief was prepared. Re-check the latest branch before implementation because the repository may have changed.

- Frontend: Next.js 15 App Router, React 19, TypeScript 5.8.
- Main interface and most client state currently live in frontend/src/app/page.tsx.
- Styling is hand-written CSS in frontend/src/app/globals.css.
- frontend/package.json does not currently include Tailwind, shadcn/ui, Motion, or Lucide dependencies.
- The page owns API health, suite loading, target/suite/defense selections, baseline and defended run state, comparison results, evidence, history, and exports.
- API base is NEXT_PUBLIC_API_BASE_URL with a localhost fallback. Preserve this contract.
- Existing calls include GET /api/v1/health, GET /api/v1/suites, POST /api/v1/runs, POST /api/v1/comparisons, GET /api/v1/runs?limit=10, and GET /api/v1/runs/{run_id}/report.
- README documents GET /api/v1/suites/{suite_id}/cases and GET /api/v1/runs/{run_id} too. Confirm the current OpenAPI contract before wiring new screens to them.
- Verdicts are PASS, FAIL, NEEDS_REVIEW, and ERROR. NEEDS_REVIEW and ERROR remain visible and must not be folded into the ASR denominator.
- Existing UI includes API health, safety/methodology copy, baseline/defended workflow, case evidence, run history, JSON/CSV exports, and comparison JSON export.
- The current page has duplicated methodology markup and repeated methodology IDs. Correct this during restructuring.
- The current design is light-first and monolithic. Migrate deliberately to reusable components and tokens rather than layering a second design system over many CSS overrides.
- “Configured OpenAI-compatible model” is a product option whose credentials belong in backend environment variables only. Preserve the honest warnings; do not imply that this path is sandboxed.
- The synthetic runner was recently repaired and the synthetic demo is now working. Treat it as a regression-critical path.

Before implementation, pull the latest branch, inspect its commit and working tree, run the existing typecheck/build, and smoke the synthetic baseline, defended, comparison, history, and export flows. Save a known-good checkpoint.

## 3. Experience principles

1. **Cinematic entry, calm workbench.** Landing is brand-led; the workspace prioritizes speed, clarity, and trust.
2. **Evidence before spectacle.** Metrics animate only after real API results arrive. Every number must retain its definition and limitations.
3. **One visual system.** Small token set, consistent spacing, restrained borders, deliberate typography.
4. **Distinct feature surfaces.** Evaluation, run details, comparison, and history get their own information architecture.
5. **Honest states.** Loading, empty, unavailable, partial, error, completed, and needs-review are designed states.
6. **Progressive disclosure.** Show compact summaries first; expose reason, severity, response excerpt, metadata, and methodology on demand.
7. **No fake AI ornament.** Avoid random gradients, excessive glassmorphism, constant particles, giant blobs, unnecessary 3D, and motion unrelated to the task.
8. **Safety is product UX.** Keep synthetic scope, configured-target requirements, evaluator limitations, and authorized-use guidance visible.

## 4. Art direction and tokens

### “Midnight / Ember”

Use deep graphite canvas, lifted slate surfaces, thin cool borders, and one ember-orange accent. Reserve a low-contrast grid/scan motif for the landing hero and selected empty states; operational screens stay low-noise.

| Token | Suggested value | Usage |
|---|---|---|
| Canvas | #0B0D10 | App background |
| Surface 1 | #11151B | Main panels |
| Surface 2 | #171D25 | Raised cards/menus |
| Surface 3 | #1D2530 | Hover/selected surface |
| Border | #29323D | Dividers/outlines |
| Primary text | #F2F5F8 | Main content |
| Muted text | #9AA6B2 | Secondary content |
| Quiet text | #6E7A87 | Short metadata only |
| Ember | #FF7047 | Primary action/active indicator |
| Ember-soft | #3A211C | Subtle accent background |
| Success | #48D6A0 | PASS / healthy API |
| Danger | #FF6B70 | FAIL / error |
| Warning | #F0BD63 | NEEDS_REVIEW |
| Technical | #A9A0FF | Optional evaluator metadata |

Use Geist or Inter for interface text and Geist Mono for run IDs, case IDs, timestamps, versions, and protocol labels. Prefer supported/self-hosted font loading over a blocking CSS @import.

- 8px spacing base; controls may use 6px internal increments.
- Panel radius 10–14px; controls 8–10px; status chips rounded only where useful.
- 1px borders; use glow sparingly for active/focus states.
- Max content width around 1440px; wide workspace uses a 240–260px sidebar plus flexible content.
- Primary CTA uses ember fill; secondary actions are quiet outlined/ghost buttons.
- Status always uses label plus icon/color, never color alone.

Semantic verdict palette: PASS green/teal, FAIL red, NEEDS_REVIEW amber, ERROR muted magenta/red-violet distinct from a security FAIL. API checking/connected/unavailable states must retain readable labels and accessible live announcements. Do not change evaluator semantics to fit the palette.

## 5. Page and feature layouts

### A. Landing — /

**Goal:** a memorable opening for the demo video and an immediate explanation of the product.

- Minimal top bar: AI Arena mark, How it works, Methodology, API health badge, Enter the lab CTA.
- Hero headline, concise description of controlled repeatable evaluations, and a custom threat-scan visualization.
- The scan graphic can use a thin-line reticle, a restrained sweep, case nodes, and a three-step pipeline. It is decorative, not live telemetry.
- Workflow strip: Run baseline → Enable defense → Compare evidence.
- Capability row: synthetic fixtures, case-matched comparisons, inspectable evidence, exportable reports.
- Safety/methodology section: deterministic synthetic fixtures, not production certification; configured model mode depends on backend configuration.
- Enter the lab transitions to the workspace.

Use one signature animation, not a loop of effects. Avoid fake metrics or fake live activity.

### B. Workspace overview — /workspace

Desktop shell: left sidebar with Overview, New evaluation, Runs & evidence, Compare, Methodology; top bar with breadcrumb/context/API health; main column with “Ready to evaluate”, New evaluation CTA, API/suite status, latest-run summary, workflow progress, recent runs. Optional right rail on wide screens; collapse it on medium screens.

API health and suite counts must be real. Workflow steps only become complete from real returned run/comparison state. Empty state tells first-time users exactly what to do.

### C. New evaluation — /workspace/evaluate

- Configuration panel split into Target, Test suite, and Defense posture.
- Target choices: Synthetic demo assistant / Configured OpenAI-compatible model.
- Suite options come from GET /api/v1/suites; display actual ID, version, and case count.
- Defense posture: Off (baseline) / On (defended).
- A live Run plan summary explains the selected configuration.
- Main CTA: Run evaluation. Preserve the current disable conditions (busy, API unavailable, no suites).
- Keep configured-model requirements and backend-only credentials close to that choice.
- On submission, show an honest working state; do not fabricate percentage progress for synchronous work.
- Completion/failure panel links to the run details.

Preserve the POST body keys: target_id, suite_id, defense_mode.

### D. Run details and evidence — /workspace/runs/[runId]

- Header: mode, run status, timestamp, run ID/copy action, export controls.
- Metadata strip: target/version, suite/version, defense config, evaluator version/type/source when returned.
- Verdict summary: total cases and counts for all four verdicts.
- Search/filter by case ID, category, verdict, and severity only where data exists.
- Each case opens an inline disclosure or side panel with case ID/category, verdict, evaluator reason, severity/rationale when present, and response excerpt.
- Preserve whitespace and safe wrapping. Empty response excerpts remain explicitly empty.
- JSON and CSV exports use the existing report endpoint and CSV escaping logic.
- Treat all API response text as untrusted plain text; never inject it as HTML.

### E. Comparison — /workspace/compare

- Header identifies both run IDs and compatibility metadata.
- Two metric panels for baseline and defended ASR; render null as N/A and show excluded counts.
- Explain that the API computes ASR from decisive PASS/FAIL outcomes only.
- Case table aligns exact case_id values and shows both verdicts, reasons/evidence, and change status.
- Optional filters: changed / unchanged / needs review.
- Audit disclosure includes generated time, evaluation method, both run metadata objects, and every API-returned limitation.
- Export comparison JSON from the actual comparison object.

Preserve POST /api/v1/comparisons payload keys baseline_run_id and defended_run_id. Do not calculate a competing ASR in the frontend or imply statistical significance.

### F. Runs and history — /workspace/runs

- Search/filter by mode, status, suite, and date only where loaded data supports it.
- List mode, status, suite/version, created time, run ID, and verdict summary if available.
- Open a persisted run by ID and fetch authoritative data where the API supports it.
- Refresh has loading and error states. Distinguish “no runs yet” from “history unavailable”.
- Respect the current history limit; do not imply infinite pagination unless built.

### G. Methodology — /workspace/methodology

Explain synthetic fixture scope; PASS/FAIL/NEEDS_REVIEW/ERROR; ASR denominator/exclusions; case matching and compatibility; configured-model requirements and backend-only secrets; limitations; authorized-use guidance; links to repository evaluation docs and API docs. Keep wording aligned with README/backend behavior.

## 6. Component discovery and stack usage

**21st.dev:** discover high-quality visual components and interaction patterns. Inspect source, dependencies, responsive behavior, accessibility, and usage/license notes. Use it selectively, not as a reason to replace every primitive.

**shadcn/ui:** functional foundation—Button, Card, Badge, Input, Select, Tabs, Tooltip, Dropdown Menu, Dialog/Sheet, Table, Skeleton, Separator, Alert. Components are copied into the repo and should be themed to match our tokens.

**Motion for React:** page/section entry, layout transitions, drawers, and small state transitions. Prefer imports from motion/react. Centralize a small set of variants.

**Lucide React:** consistent outline icons for navigation, status, actions, and metadata. Avoid emoji as functional icons and avoid mixing icon families.

### 21st.dev setup in VS Code + Copilot

Run in a terminal:

~~~bash
npm i -g @21st-dev/cli
21st login
npx @21st-dev/cli install-skill
~~~

Search specific needs, one at a time:

~~~bash
21st search "dark dashboard sidebar app shell"
21st search "security analytics dashboard"
21st search "terminal command palette"
21st search "animated grid hero"
21st search "comparison data table"
21st search "activity timeline"
21st search "evidence inspector side panel"
21st search "empty state dark dashboard"
~~~

Shortlist the hero visualization, app shell/sidebar, and evidence side panel. Use shadcn primitives for routine controls instead of importing duplicate buttons, inputs, or tables.

For VS Code MCP access, follow the current guide at https://docs.21st.dev/mcp. The documented endpoint is https://21st.dev/api/mcp. Use the current VS Code MCP configuration flow and store the API key in a secret/input or local user setting—never commit a token. The CLI workflow above is a straightforward fallback.

### Add shadcn/ui safely

The current frontend does not yet have Tailwind configured. Do not assume the shadcn add command will work before setup, and do not overwrite globals.css blindly.

1. Checkpoint/commit the current branch.
2. Follow the current existing-Next.js instructions: https://ui.shadcn.com/docs/installation/next.
3. Run the initializer from frontend/ and review every changed config/style file.
4. Keep the @/* alias pointed at ./src/*.
5. Add only primitives needed for the first screen; run build/typecheck immediately.
6. Migrate styling in deliberate slices and remove the old conflicting rules as each slice is replaced.

Likely dependencies include motion and lucide-react, plus shadcn's required packages. Use the repo's current package manager. Keep Next.js 15 and React 19 unless a separately justified upgrade is tested independently.

### Suggested component map

- src/components/brand/arena-mark.tsx
- src/components/brand/threat-scan-visual.tsx
- src/components/layout/app-shell.tsx
- src/components/layout/app-sidebar.tsx
- src/components/layout/topbar.tsx
- src/components/layout/page-header.tsx
- src/components/status/api-health-badge.tsx
- src/components/status/verdict-badge.tsx
- src/components/evaluation/evaluation-form.tsx
- src/components/evaluation/run-plan-summary.tsx
- src/components/evaluation/run-status-panel.tsx
- src/components/runs/run-summary.tsx
- src/components/runs/run-table.tsx
- src/components/evidence/case-evidence-list.tsx
- src/components/evidence/case-evidence-panel.tsx
- src/components/comparison/comparison-metrics.tsx
- src/components/comparison/comparison-table.tsx
- src/components/methodology/scope-note.tsx
- src/lib/api-client.ts
- src/lib/types.ts
- src/lib/formatters.ts
- src/lib/exports.ts
- src/lib/motion.ts

This is a target structure, not a mandate to create empty abstractions. Extract components with a clear responsibility, repeated use, or independent interaction.

## 7. Motion system — balanced intensity

### Motion tokens
- Microinteraction: 120–180ms.
- Standard transition: 180–260ms.
- Page/section reveal: 300–450ms.
- Stagger related elements by 35–70ms; keep the sequence short.
- Prefer opacity and small translate/scale changes. Avoid large zooms, springy bounce, scroll hijacking, and motion on dense tables.

### Motion placement
1. Landing: one-time hero reveal, low-contrast scan sweep, one signal pulse, CTA hover/focus feedback.
2. Enter workspace: short fade/translate; never block navigation with a long intro.
3. Workspace: quick opacity/translate transition; no perpetual floating cards.
4. Run lifecycle: idle → submitting → completed/failed follows actual API state. Spinner only while waiting; no fake percentages.
5. Verdict summary: animate counts once after the real response is committed; final numbers remain readable without animation.
6. Comparison: reveal metrics and changed-case highlights after API success; never animate from misleading zeros.
7. Evidence panel: short slide/fade; preserve keyboard focus.
8. Buttons/cards: restrained hover/focus response; avoid lift effects on every nested element.

Respect prefers-reduced-motion through Motion's reduced-motion support and CSS fallback. Replace large transforms/parallax with opacity-only or no motion. No essential information may depend on animation. Avoid autoplay video and continuous motion in the workspace.

## 8. Responsive, accessibility, performance

### Responsive
- Wide desktop (≥1200px): persistent sidebar, full workspace grid, optional right rail.
- Tablet (768–1199px): compact/collapsible sidebar, one main column, right rail becomes a drawer or moves below.
- Mobile (<768px): sidebar becomes accessible sheet; top bar wraps; cards stack; comparison metrics stack; tables use labelled horizontal scrolling or a card-row alternative.
- Primary actions must remain reachable without horizontal page scrolling.
- Test 1440×900, 1024×768, 768×1024, 390×844, and 320×720.

### Accessibility
- Semantic landmarks, one clear H1 per page, ordered headings, labelled inputs, real buttons, table captions and headers.
- Keep skip navigation and visible :focus-visible styles.
- Meet WCAG AA contrast; muted metadata must remain readable.
- Status changes use concise polite live regions; failures use role=alert without announcing huge evidence blocks.
- Never use color as the only verdict/status signal.
- Icon-only buttons need accessible names and useful tooltips.
- Sheets/dialogs manage focus, close on Escape, and restore focus to the opener.
- Use accessible disclosure primitives; keep tables navigable and avoid nested interactive controls inside clickable rows.
- Respect zoom/reflow; no fixed-width panel should force page-level horizontal scrolling.
- Test reduced motion and keyboard-only navigation.

### Performance
- Keep the hero lightweight with CSS/SVG, not a large WebGL dependency.
- Avoid overlapping animation libraries and unnecessary 21st components.
- Lazy-load noncritical visualization code only if it materially improves first paint.
- Avoid hydration mismatches from random values or time-dependent markup.
- Use stable keys; avoid rerendering the whole app when one evidence disclosure opens.
- Long excerpts and IDs must wrap safely.

## 9. API and state preservation — non-negotiable

1. Keep NEXT_PUBLIC_API_BASE_URL as the frontend API base.
2. Preserve request methods, endpoint paths, payload keys, response fields, and status semantics.
3. Do not mock or hard-code suites, counts, verdicts, ASR, comparison deltas, run IDs, history, or evidence.
4. Keep health checking and checking/connected/unavailable states.
5. Preserve baseline defense_mode=off and defended defense_mode=on behavior.
6. Preserve case-ID-aligned comparison via POST /api/v1/comparisons; display API values and limitations.
7. Preserve reason, severity, severity rationale, response excerpt, evaluator metadata, and empty/error states.
8. Preserve history refresh, loading, error handling, and historical run selection.
9. Preserve run JSON, run CSV, and comparison JSON exports. Keep spreadsheet-formula neutralization in CSV cells.
10. Render API text as untrusted plain text, never HTML.
11. Keep provider credentials backend-only; never add ARENA_LLM_API_KEY to a NEXT_PUBLIC_* variable.
12. Do not claim configured-model execution is sandboxed or that the evaluator proves real-world robustness.
13. Keep ERROR and NEEDS_REVIEW distinct from PASS/FAIL.
14. If adding routes, use stable run IDs and refetch persisted records where the API supports it. Do not rely only on ephemeral component state for history/detail.
15. Use one API client and shared TypeScript response types. Components should not invent their own fetch logic.

## 10. Implementation order and exit criteria

### Phase 0 — baseline checkpoint
- Pull latest branch; inspect git status, commit, README, API docs, package scripts, page and CSS.
- Run npm install, npm run typecheck, npm run build from frontend/.
- Verify health, suite loading, synthetic baseline, defended run, comparison, history, JSON and CSV export.
- Record any pre-existing failures before UI work.

**Exit:** current behavior is documented and repeatable.

### Phase 1 — design system/dependencies
- Install 21st CLI/skills; configure VS Code MCP only if useful.
- Shortlist components for hero, app shell, evidence panel, and table.
- Initialize shadcn carefully; add Motion and Lucide.
- Define dark-first CSS variables, typography, spacing, focus rings, verdict tokens, and motion tokens.
- Test primitives in isolation.

**Exit:** theme and primitives render; typecheck/build pass.

### Phase 2 — extract domain/API logic
- Move API helper, response types, verdict formatting, summaries, and exports into focused modules without changing behavior.
- Add tests for CSV escaping/formula neutralization, verdict counts, ASR formatting, and status mapping where test infrastructure exists.

**Exit:** regression checks pass before page restructuring.

### Phase 3 — landing page
- Build hero and signature scan visual, workflow strip, methodology/safety copy, and Enter the lab CTA.
- Check reduced motion, small screens, and first paint.

**Exit:** distinctive, lightweight, and does not imply fake live activity.

### Phase 4 — workspace shell/overview
- Build sidebar, topbar, page headers, status components, and responsive shell.
- Every navigation item must lead to a real useful page.
- Reuse actual health and suite data.

**Exit:** all routes render; API logic is not duplicated.

### Phase 5 — evaluation
- Build target/suite/defense configuration and live run-plan summary.
- Wire current run submission/status handling.
- Add completion/failure summary and run-details link.

**Exit:** baseline and defended runs create real API runs.

### Phase 6 — run details/evidence/exports
- Implement metadata, verdict summary, evidence list/detail, history selection, JSON and CSV export.
- Preserve fields and exact report endpoint behavior.
- Test long/empty excerpts, errors, and all verdict states.

**Exit:** every run remains inspectable/exportable.

### Phase 7 — comparison/history
- Implement API-fed comparison metrics/table/limitations and JSON export.
- Implement history filters only over fields actually available; support refresh, loading, empty, unavailable, and error.
- Reopen details by run ID.

**Exit:** outcomes align by case ID; API metrics unchanged.

### Phase 8 — motion/polish/demo flow
- Add balanced motion only after core flows are stable.
- Review reduced motion and keyboard behavior.
- Demo sequence: landing → workspace → baseline → defended → compare → case evidence → history → export.

**Exit:** motion never obscures controls or fakes results.

### Phase 9 — regression/release
- Run typecheck, build, unit/backend smoke tests, browser checks, and deployed smoke tests.
- Review diffs and remove dead CSS/unused components.
- Update README/screenshot only after verified implementation.

**Exit:** no known critical regressions and checks are recorded honestly.

## 11. Verification checklist

### Automated
- npm run typecheck
- npm run build
- Existing backend tests and python scripts/smoke_test.py in the supported backend/runner environment.
- Focused tests for CSV escaping, verdict summaries, and formatters if test infrastructure exists.
- Run lint if configured; do not add an unrelated lint stack just for the redesign.

### Functional end-to-end
1. Cold load announces checking then the real API status.
2. Suite options come from the API with actual IDs, versions, and counts.
3. Baseline submits defense_mode=off and displays returned run ID/status/results.
4. Defended submits defense_mode=on.
5. Comparison sends the exact baseline and defended run IDs.
6. Comparison aligns exact case IDs and preserves change status.
7. Null ASR renders N/A; exclusions and limitations remain visible.
8. Evidence displays reason, severity/rationale, and response excerpt when present; empty excerpt remains explicit.
9. History loads/refreshes and distinguishes empty from error; selected run opens.
10. Run JSON export uses GET /api/v1/runs/{run_id}/report.
11. CSV export uses API report and retains formula-injection neutralization.
12. Comparison JSON export downloads the real comparison.
13. API/network/run failures show accessible errors and usable retry paths.
14. Configured-model mode preserves backend-only configuration and never exposes credentials.
15. No route silently falls back to mock data.

### Visual/accessibility
- Test all viewport sizes listed above.
- Keyboard through sidebar, forms, tables, disclosures, sheets, and export controls.
- Visible focus, contrast, zoom/reflow, labels, live announcements.
- Reduced motion enabled.
- Long IDs, long excerpts, missing metadata, zero results, and all four verdict states.
- No page-level horizontal overflow; intentional table scroll is labelled/contained.
- Landing scan does not imply real-time telemetry.

### Demo-video acceptance path
Start on landing → enter workspace → resolve real API health/suite count → run baseline → run defended → compare real API ASR and case-matched verdicts → open evidence → visit history and reopen a persisted run → export comparison JSON and run CSV → finish on methodology note that fixture results are illustrative, not production certification.

## 12. VS Code + GitHub Copilot prompts

Use one focused prompt per phase. Ask Copilot to inspect before editing and run typecheck/build after each phase.

### Prompt 1 — inspect only
> Inspect the current AI Arena frontend. Do not edit files. Map every API call, state transition, run/compare/history/export behavior, TypeScript type, and loading/error/empty state. Compare with docs/UI_REDESIGN_IMPLEMENTATION_BRIEF.md. Return a file-by-file migration plan and identify API contract uncertainty. Do not invent endpoints or mock data.

### Prompt 2 — design system
> Implement only the Cinematic Security Lab design tokens and accessible primitives from docs/UI_REDESIGN_IMPLEMENTATION_BRIEF.md. Use shadcn for functional primitives, Lucide for icons, and Motion sparingly. This repo currently uses hand-written CSS and may not have Tailwind configured; inspect before setup and review all config/CSS changes. Do not redesign API logic. Run typecheck and build.

### Prompt 3 — extract behavior
> Refactor the page's API helper, shared response types, verdict formatting, summary calculations, and JSON/CSV exports into focused modules. Preserve endpoints, payload keys, status semantics, CSV formula-injection defense, errors, and result fields. No UI redesign in this step. Run typecheck/build and report any behavior changes.

### Prompt 4 — implement one screen
> Implement only the next phase from docs/UI_REDESIGN_IMPLEMENTATION_BRIEF.md. Before editing, list files to change and behaviors to preserve. Use real API data and current response types. No mock success states, invented metrics, fake progress, placeholder buttons, or unverified endpoints. Respect reduced motion and keyboard accessibility. Run typecheck/build and summarize results.

### Prompt 5 — regression review
> Audit the redesign against docs/UI_REDESIGN_IMPLEMENTATION_BRIEF.md. Inspect routes/interactions, run available checks, identify regressions/dead code, and fix only evidence-backed issues. Explicitly test baseline, defended, comparison, history, evidence, run JSON, run CSV, and comparison JSON. Report anything not verified rather than claiming it passed.

## 13. Definition of done

- [ ] Cinematic Security Lab identity is consistent across landing and workspace.
- [ ] Dark-first tokens and semantic verdict states are readable/accessibility-tested.
- [ ] Feature areas have clear layouts and working navigation.
- [ ] API endpoints and payload contracts remain intact.
- [ ] Synthetic baseline and defended runs work against the real backend.
- [ ] Comparison uses API results and exact case IDs.
- [ ] Evidence and persisted history remain inspectable.
- [ ] Run JSON, run CSV, and comparison JSON exports work.
- [ ] Error/loading/empty/unavailable/reduced-motion states are tested.
- [ ] No fake metrics/progress, mock data, exposed credentials, or unsupported security claims.
- [ ] Typecheck, build, backend/browser regression checks, and deployment smoke checks have recorded outcomes.
