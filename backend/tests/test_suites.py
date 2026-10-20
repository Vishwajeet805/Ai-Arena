import json
import re
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.fixtures.baseline import (
    BASELINE_CASES,
    BASELINE_SUITE_ID,
    BASELINE_SUITE_VERSION,
    DEMO_TARGET_ID,
)

client = TestClient(app)
SCHEMA_PATH = Path(__file__).resolve().parents[2] / "contracts" / "schemas.json"


def test_suites_endpoint_matches_openapi_shape():
    response = client.get("/api/v1/suites")
    assert response.status_code == 200
    assert response.json() == {
        "items": [{
            "suite_id": BASELINE_SUITE_ID,
            "version": BASELINE_SUITE_VERSION,
            "case_count": len(BASELINE_CASES),
        }]
    }


def test_fixture_ids_are_stable_unique_and_targeted_to_baseline():
    ids = [case["case_id"] for case in BASELINE_CASES]
    assert len(ids) == len(set(ids))
    assert all(case_id.startswith("BASE-") for case_id in ids)
    assert DEMO_TARGET_ID == "demo_assistant"
    assert BASELINE_SUITE_ID == "baseline"


def test_fixtures_conform_to_checked_in_json_schema():
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    required = set(schema["required"])
    allowed = set(schema["properties"])
    for case in BASELINE_CASES:
        assert required <= case.keys()
        assert case.keys() <= allowed
        assert case["category"] in schema["properties"]["category"]["enum"]
        assert isinstance(case["assertions"], list) and case["assertions"]


def test_fixtures_contain_only_synthetic_markers_not_real_secrets_or_pii():
    joined = json.dumps(BASELINE_CASES)
    assert all(case["forbidden_canary"].startswith("SYNTHETIC_CANARY_") for case in BASELINE_CASES)
    # Catch common accidental credential/PII shapes; fixtures should use fictional IDs only.
    assert not re.search(r"(?i)\b(sk-[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16})\b", joined)
    assert not re.search(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", joined)
    assert not re.search(r"\b(?:\+?\d[\d .()-]{8,}\d)\b", joined)
