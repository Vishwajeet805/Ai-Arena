import json
import os
import subprocess
import sys
from pathlib import Path

from fastapi.testclient import TestClient

from app.main import app
from app.fixtures.baseline import BASELINE_CASES


def test_comparison_rejects_runs_with_different_evaluator_version():
    with TestClient(app) as client:
        payload = {"target_id": "demo_assistant", "suite_id": "baseline"}
        baseline = client.post("/api/v1/runs", json={**payload, "defense_mode": "off"}).json()
        defended = client.post("/api/v1/runs", json={**payload, "defense_mode": "on"}).json()

        import app.main as main
        with main.SessionLocal() as db:
            record = main._load_run(db, defended["run_id"])
            record.evaluator_version = "test-incompatible-evaluator"
            db.commit()

        response = client.post("/api/v1/comparisons", json={
            "baseline_run_id": baseline["run_id"],
            "defended_run_id": defended["run_id"],
        })
        assert response.status_code == 409
        assert "incompatible" in response.json()["detail"]


def test_comparison_requires_exact_case_id_sets():
    with TestClient(app) as client:
        payload = {"target_id": "demo_assistant", "suite_id": "baseline"}
        baseline = client.post("/api/v1/runs", json={**payload, "defense_mode": "off"}).json()
        defended = client.post("/api/v1/runs", json={**payload, "defense_mode": "on"}).json()

        import app.main as main
        with main.SessionLocal() as db:
            record = main._load_run(db, defended["run_id"])
            db.delete(record.results[-1])
            db.commit()

        response = client.post("/api/v1/comparisons", json={
            "baseline_run_id": baseline["run_id"],
            "defended_run_id": defended["run_id"],
        })
        assert response.status_code == 409
        assert "same case IDs" in response.json()["detail"]


def test_runner_protocol_accepts_allowlisted_fixture_and_rejects_unknown_case():
    runner_path = Path(__file__).parents[1] / "runner" / "runner.py"
    environment = {**os.environ, "PYTHONPATH": ""}
    valid_request = json.dumps({
        "case_ids": [BASELINE_CASES[0]["case_id"]],
        "defense_mode": "on",
    })
    accepted = subprocess.run(
        [sys.executable, str(runner_path)], input=valid_request,
        capture_output=True, text=True, check=False, env=environment,
    )
    assert accepted.returncode == 0
    assert json.loads(accepted.stdout) == {
        "accepted_case_ids": [BASELINE_CASES[0]["case_id"]],
        "defense_mode": "on",
    }

    rejected = subprocess.run(
        [sys.executable, str(runner_path)],
        input=json.dumps({"case_ids": ["arbitrary-script"], "defense_mode": "off"}),
        capture_output=True, text=True, check=False, env=environment,
    )
    assert rejected.returncode == 2
    assert json.loads(rejected.stdout) == {"error": "unknown_case_id"}
