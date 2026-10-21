from fastapi.testclient import TestClient

from app.main import app
from app.fixtures.baseline import BASELINE_CASES

client = TestClient(app)


def test_create_run_returns_contract_shape_and_results_for_every_fixture():
    response = client.post(
        "/api/v1/runs",
        json={"target_id": "demo_assistant", "suite_id": "baseline", "defense_mode": "off"},
    )
    assert response.status_code == 202
    run = response.json()
    assert run["status"] == "completed"
    assert run["target_id"] == "demo_assistant"
    assert run["suite_id"] == "baseline"
    assert run["suite_version"] == "1.0.0"
    assert run["defense_mode"] == "off"
    assert run["evaluator_version"] == "deterministic-rules-1.0.0"
    assert len(run["run_id"]) > 10
    assert run["created_at"].endswith("Z")
    assert run["completed_at"].endswith("Z")
    assert {result["case_id"] for result in run["results"]} == {
        case["case_id"] for case in BASELINE_CASES
    }
    assert all(
        result["verdict"] in {"PASS", "FAIL", "NEEDS_REVIEW", "ERROR"}
        for result in run["results"]
    )


def test_defense_off_and_on_are_repeatable_and_use_same_case_ids():
    payload = {"target_id": "demo_assistant", "suite_id": "baseline"}
    off = client.post("/api/v1/runs", json={**payload, "defense_mode": "off"}).json()
    on = client.post("/api/v1/runs", json={**payload, "defense_mode": "on"}).json()

    assert [x["case_id"] for x in off["results"]] == [x["case_id"] for x in on["results"]]
    assert all(x["verdict"] == "FAIL" for x in off["results"])
    assert all(x["verdict"] == "PASS" for x in on["results"])
    assert off["run_id"] != on["run_id"]


def test_get_run_returns_created_run_and_unknown_run_is_404():
    created = client.post(
        "/api/v1/runs",
        json={"target_id": "demo_assistant", "suite_id": "baseline", "defense_mode": "on"},
    ).json()
    response = client.get(f"/api/v1/runs/{created['run_id']}")
    assert response.status_code == 200
    assert response.json() == created
    assert client.get("/api/v1/runs/not-a-real-run-id").status_code == 404


def test_create_run_rejects_unknown_target_suite_mode_and_extra_fields():
    invalid_payloads = [
        {"target_id": "other", "suite_id": "baseline", "defense_mode": "off"},
        {"target_id": "demo_assistant", "suite_id": "not-baseline", "defense_mode": "off"},
        {"target_id": "demo_assistant", "suite_id": "baseline", "defense_mode": "maybe"},
        {"target_id": "demo_assistant", "suite_id": "baseline", "defense_mode": "off", "extra": "no"},
    ]
    for payload in invalid_payloads:
        response = client.post("/api/v1/runs", json=payload)
        assert response.status_code == 422
