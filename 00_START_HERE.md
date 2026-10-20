# LogUnifyers — AI Red-Team Arena | START HERE
**Version:** 1.0 | **Status:** Planning baseline | **Updated:** 18 Oct 2026

## What is this?
An AI security testing platform MVP for Hack in Hills '26 Round 2. Developers run controlled prompt-injection and unauthorized-data-access tests against a *synthetic-data demo AI assistant* in a restricted sandbox, compare outcomes before and after defense, and export audit evidence.

## Fixed identity
- **Team:** LogUnifyers
- **Product:** AI Red-Team Arena
- **Tagline:** Build AI. Break AI. Harden AI.
- **Track:** Securing Adversarial AI Safety Testing Infrastructure
- **Round 2:** Oct 18–24, 2026 (deadline 24 Oct, 11:59 PM IST per user-provided Unstop text)
- **Team:** Vishwajeet Singh — Backend & Security Infrastructure; Shaurya Dubey — AI Evaluation & Red-Team Engine; Pawani Sanghi — Frontend & Product Design.

## Read in this order
1. `docs/01_PRODUCT_BRIEF.md`
2. `docs/02_SCOPE_AND_REQUIREMENTS.md`
3. `docs/03_ARCHITECTURE_AND_SECURITY.md`
4. `contracts/openapi.yaml` and `contracts/schemas.json`
5. `docs/04_DATA_AND_EVALUATION.md`
6. `docs/05_IMPLEMENTATION_PLAN.md`
7. `agents/AGENTS.md` before handing work to ANY coding AI.

## Single-source-of-truth / change policy
`docs/07_DECISIONS_AND_CHANGELOG.md` is the decision register. `contracts/` owns the API and data schema. Agents MUST read these first and propose updates rather than silently invent interfaces. Use documented mock responses until backend integration. Never claim tested results before actually executing tests.

## Non-negotiable MVP demo
1. Start demo assistant with synthetic company policy/secret fixture.
2. Execute 3–5 *authorized, local* adversarial test cases and collect responses.
3. Score deterministic outcomes; mark ambiguity for manual review.
4. Toggle an authorization defense and rerun identical tests.
5. Display before/after evidence, audit record, and export JSON/CSV report.
6. Show Docker resource/network restrictions working (or explicitly label incomplete isolation).

## Deliverables
Public/private GitHub repository as organizers require, local run instructions, working MVP, demonstration video, test evidence. Check official submission form for exact link/video requirements.

## Setup target
Copy `.env.example` to `.env` once created. No production credentials or external confidential material. Use `docker compose up --build` as the desired standard entrypoint, with a mock/demo mode when no external LLM key is provided.
