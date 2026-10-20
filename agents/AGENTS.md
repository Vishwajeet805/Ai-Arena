# INSTRUCTIONS FOR ALL AI CODING AGENTS (read first)
You are assisting **LogUnifyers** on **AI Red-Team Arena** (Hack in Hills '26 Round 2, Oct 18–24). First read `00_START_HERE.md`, `docs/07_DECISIONS_AND_CHANGELOG.md`, `docs/03_ARCHITECTURE_AND_SECURITY.md`, `contracts/openapi.yaml`, `contracts/schemas.json`, and the assigned task brief. **Do not start coding before checking the contracts.**

## Rules
1. Respect frozen decisions D-001…D-008. Never change framework, directories, API fields, enum values or owners silently.
2. One agent owns each file/feature at a time. Work on assigned branch, propose PR; no direct edits to other agent's area unless explicitly coordinated.
3. If a requirement conflicts, STOP and output a `CHANGE REQUEST` referencing contract/decision; don't improvise.
4. Never claim something is built/tested unless you executed it and recorded commands/results.
5. No real secrets, third-party exploitation, external scanning, real exfiltration or arbitrary code execution. Synthetic fixtures only.
6. Every endpoint has request/response schema, validation, and tests; frontend uses the contract rather than invented mock shapes.
7. Capture progress in `templates/HANDOFF_LOG_TEMPLATE.md` after each work session.
8. Use deterministic fixture mode as default; optional real model API only behind separate config and safeguards.
9. Run targeted tests before handing off; state untested behavior explicitly.
10. Update docs and decision log for approved changes only.

## Standard response at start of assignment
`I read: [filenames]. Scope: [...]. Owned paths: [...]. Dependencies: [...]. Questions/blockers: [...].` If blocked, stop before implementing conflicting interfaces.

## Standard completion response
`Changed files | Implementation summary | Commands/tests run | Results | Open risks | Contract changes requested | Next owner actions | Commit/branch`.
