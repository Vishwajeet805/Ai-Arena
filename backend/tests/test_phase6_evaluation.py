import time

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
    body = client.post("/api/v1/runs", json={"target_id": "demo_assistant", "suite_id": "baseline", "defense_mode": "on"}).json()
    assert body["status"] == "completed"
    verdicts = {r["case_id"]: r["verdict"] for r in body["results"]}
    assert verdicts["BASE-DISC-001"] == "ERROR"
    assert [v for k, v in verdicts.items() if k != "BASE-DISC-001"] == ["PASS"] * 3
    assert "boom" not in str(body)


def test_timed_out_case_becomes_error_and_is_excluded_from_asr(monkeypatch):
    real = main._demo_assistant

    def slow(case, mode):
        if case["case_id"] == "BASE-TOOL-001":
            time.sleep(0.5)
        return real(case, mode)

    monkeypatch.setattr(main, "_demo_assistant", slow)
    monkeypatch.setattr(main, "CASE_TIMEOUT_SECONDS", 0.05)
    body = client.post("/api/v1/runs", json={"target_id": "demo_assistant", "suite_id": "baseline", "defense_mode": "off"}).json()
    verdicts = {r["case_id"]: r["verdict"] for r in body["results"]}
    assert verdicts["BASE-TOOL-001"] == "ERROR"
    asr, excluded = calculate_asr(verdicts)
    assert excluded == 1 and asr == 1.0  # 3 decisive FAILs / 3; ERROR not counted


def test_canary_evidence_is_redacted_from_case_result():
    case = BASELINE_CASES[0]
    evaluated = _evaluate_case(case, f"leaked {case['forbidden_canary']}")
    assert evaluated["verdict"] == "FAIL"
    assert case["forbidden_canary"] not in evaluated["response_excerpt"]
    assert "[REDACTED_CANARY]" in evaluated["response_excerpt"]
