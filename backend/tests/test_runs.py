import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.fixtures.baseline import BASELINE_CASES


@pytest.fixture
def client():
    # Enter TestClient as a context manager so FastAPI startup hooks create the DB tables.
    with TestClient(app) as test_client:
        yield test_client


def test_create_run_persists_all_case_results_and_contract_shape(client):
    response = client.post("/api/v1/runs", json={
        "target_id": "demo_assistant", "suite_id": "baseline", "defense_mode": "off"
    })
    assert response.status_code == 202
    run = response.json()
    assert run["status"] == "completed"
    assert run["target_id"] == "demo_assistant"
    assert run["suite_id"] == "baseline"
    assert run["suite_version"] == "1.0.0"
    assert run["defense_mode"] == "off"
    assert run["evaluator_version"] == "deterministic-rules-1.1.0"
    assert run["created_at"].endswith("Z")
    assert run["completed_at"].endswith("Z")
    assert len(run["results"]) == len(BASELINE_CASES)
    assert all(item["verdict"] in {"PASS", "FAIL", "NEEDS_REVIEW", "ERROR"} for item in run["results"])


def test_defense_modes_keep_same_fixture_ids_and_expected_verdicts(client):
    payload = {"target_id": "demo_assistant", "suite_id": "baseline"}
    off = client.post("/api/v1/runs", json={**payload, "defense_mode": "off"}).json()
    on = client.post("/api/v1/runs", json={**payload, "defense_mode": "on"}).json()
    assert [item["case_id"] for item in off["results"]] == [item["case_id"] for item in on["results"]]
    assert all(item["verdict"] == "FAIL" for item in off["results"])
    assert all(item["verdict"] == "PASS" for item in on["results"])
    assert off["run_id"] != on["run_id"]


def test_unknown_run_is_404_and_json_report_matches_run(client):
    created = client.post("/api/v1/runs", json={
        "target_id": "demo_assistant", "suite_id": "baseline", "defense_mode": "on"
    }).json()
    fetched = client.get(f"/api/v1/runs/{created['run_id']}")
    report = client.get(f"/api/v1/runs/{created['run_id']}/report")
    assert fetched.status_code == 200 and fetched.json() == created
    assert report.status_code == 200 and report.json() == created
    assert client.get("/api/v1/runs/no-such-run").status_code == 404


def test_invalid_run_input_is_422_and_extra_fields_are_rejected(client):
    payloads = [
        {"target_id": "wrong", "suite_id": "baseline", "defense_mode": "off"},
        {"target_id": "demo_assistant", "suite_id": "wrong", "defense_mode": "off"},
        {"target_id": "demo_assistant", "suite_id": "baseline", "defense_mode": "maybe"},
        {"target_id": "demo_assistant", "suite_id": "baseline", "defense_mode": "off", "extra": True},
    ]
    for payload in payloads:
        assert client.post("/api/v1/runs", json=payload).status_code == 422


def test_comparison_returns_matching_case_outcomes_and_attack_success_rate(client):
    base = {"target_id": "demo_assistant", "suite_id": "baseline"}
    off = client.post("/api/v1/runs", json={**base, "defense_mode": "off"}).json()
    on = client.post("/api/v1/runs", json={**base, "defense_mode": "on"}).json()
    compared = client.post("/api/v1/comparisons", json={
        "baseline_run_id": off["run_id"], "defended_run_id": on["run_id"]
    })
    assert compared.status_code == 200
    body = compared.json()
    assert body["baseline_run_id"] == off["run_id"]
    assert body["defended_run_id"] == on["run_id"]
    assert body["baseline_asr"] == 1.0
    assert body["defended_asr"] == 0.0
    assert len(body["items"]) == len(BASELINE_CASES)


def test_missing_comparison_runs_return_404(client):
    response = client.post("/api/v1/comparisons", json={
        "baseline_run_id": "missing", "defended_run_id": "also-missing"
    })
    assert response.status_code == 404


def test_health_and_suites_remain_available(client):
    assert client.get("/api/v1/health").json() == {"status": "ok"}
    assert client.get("/api/v1/suites").status_code == 200
