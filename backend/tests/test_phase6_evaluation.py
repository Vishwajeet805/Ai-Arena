import json
from subprocess import CompletedProcess, TimeoutExpired

import pytest
from fastapi.testclient import TestClient

import app.main as main
from app.fixtures.baseline import BASELINE_CASES
from app.main import _demo_assistant, _evaluate_case, app, calculate_asr

client = TestClient(app)


@pytest.mark.parametrize("case", BASELINE_CASES, ids=lambda c: c["case_id"])
def test_every_fixture_fails_undefended_and_passes_defended(case):
    assert _evaluate_case(case, _demo_assistant(case, "off"))["verdict"] == "FAIL"
    assert _evaluate_case(case, _demo_assistant(case, "on"))["verdict"] == "PASS"


@pytest.mark.parametrize("case", BASELINE_CASES, ids=lambda c: c["case_id"])
def test_canary_in_response_always_fails(case):
    assert _evaluate_case(case, f"leak {case['forbidden_canary']}")["verdict"] == "FAIL"


def test_crashing_case_becomes_error_and_run_still_completes(monkeypatch):
    real = main._demo_assistant

    def flaky(case, mode):
        if case["case_id"] == "BASE-DISC-001":
            raise RuntimeError("boom")
        return real(case, mode)

    monkeypatch.setattr(main, "_demo_assistant", flaky)

    def fake_runner(command, input, **kwargs):
        request = json.loads(input)
        case_id = request["case_ids"][0]
        case = next(c for c in BASELINE_CASES if c["case_id"] == case_id)
        try:
            response = main._demo_assistant(case, request["defense_mode"])
        except Exception:
            return CompletedProcess(command, 1, "", "runner failure")
        return CompletedProcess(command, 0, json.dumps({
            "defense_mode": request["defense_mode"],
            "results": [{"case_id": case_id, "response": response}],
        }), "")

    monkeypatch.setattr(main.subprocess, "run", fake_runner)
    body = client.post("/api/v1/runs", json={"target_id": "demo_assistant", "suite_id": "baseline", "defense_mode": "on"}).json()
    assert body["status"] == "completed"
    verdicts = {r["case_id"]: r["verdict"] for r in body["results"]}
    assert verdicts["BASE-DISC-001"] == "ERROR"
    assert [v for k, v in verdicts.items() if k != "BASE-DISC-001"] == ["PASS"] * 3
    assert "boom" not in str(body)


def test_timed_out_case_becomes_error_and_is_excluded_from_asr(monkeypatch):
    monkeypatch.setattr(main, "CASE_TIMEOUT_SECONDS", 0.05)

    def fake_runner(command, input, **kwargs):
        request = json.loads(input)
        case_id = request["case_ids"][0]
        if case_id == "BASE-TOOL-001":
            raise TimeoutExpired(command, kwargs["timeout"])
        case = next(c for c in BASELINE_CASES if c["case_id"] == case_id)
        response = main._demo_assistant(case, request["defense_mode"])
        return CompletedProcess(command, 0, json.dumps({
            "defense_mode": request["defense_mode"],
            "results": [{"case_id": case_id, "response": response}],
        }), "")

    monkeypatch.setattr(main.subprocess, "run", fake_runner)
    body = client.post("/api/v1/runs", json={"target_id": "demo_assistant", "suite_id": "baseline", "defense_mode": "off"}).json()
    verdicts = {r["case_id"]: r["verdict"] for r in body["results"]}
    assert verdicts["BASE-TOOL-001"] == "ERROR"
    asr, excluded = calculate_asr(verdicts)
    assert excluded == 1 and asr == 1.0

def test_canary_evidence_is_redacted_from_case_result():
    case = BASELINE_CASES[0]
    evaluated = _evaluate_case(case, f"leaked {case['forbidden_canary']}")
    assert evaluated["verdict"] == "FAIL"
    assert case["forbidden_canary"] not in evaluated["response_excerpt"]
    assert "[REDACTED_CANARY]" in evaluated["response_excerpt"]
