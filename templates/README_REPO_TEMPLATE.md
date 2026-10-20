# AI Red-Team Arena — LogUnifyers
Hack in Hills '26 Prototype Round

> Replace these instructions with actual working commands before submission. Do not claim features are live until verified.

## Demo
Explain synthetic test assistant, curated attacks, defense toggle and evidence export.

## Requirements
Docker Engine and Docker Compose, plus internet only for dependency installation unless using cached images.

## Quick start
`cp .env.example .env`
`docker compose up --build`

## Architecture
Web → API → restricted runner → evaluator → PostgreSQL. See docs/03.

## Reproducing the demo
1. Open frontend at [TBD port].
2. Choose baseline suite and defense off, run.
3. Choose defense on, run same suite.
4. Compare results and export report.

## Safety notice
Synthetic data and controlled local testing only. No real third-party targets; Docker is not a guarantee of perfect isolation.

## Testing
Document exact commands and outputs here.

## Limitations
Document unimplemented capabilities and environmental constraints.

## Team
Vishwajeet Singh; Shaurya Dubey; Pawani Sanghi.
