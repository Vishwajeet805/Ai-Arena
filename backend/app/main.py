from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="AI Red-Team Arena API",
    version="0.1.0",
    description="Initial API scaffold. Evaluation features are not implemented yet.",
)

origins = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

@app.get("/api/v1/health", tags=["system"])
def health() -> dict[str, str]:
    """Lightweight liveness check; does not yet validate database connectivity."""
    return {"status": "ok"}


from app.fixtures.baseline import BASELINE_CASES, BASELINE_SUITE_ID, BASELINE_SUITE_VERSION


@app.get("/api/v1/suites", tags=["suites"])
def list_suites() -> dict[str, list[dict[str, str | int]]]:
    """List available curated suites; this endpoint does not execute test cases."""
    return {
        "items": [
            {
                "suite_id": BASELINE_SUITE_ID,
                "version": BASELINE_SUITE_VERSION,
                "case_count": len(BASELINE_CASES),
            }
        ]
    }
