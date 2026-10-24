import pytest

import app.main as main
from app.fixtures.baseline import BASELINE_CASES


def test_runner_dispatch_validates_and_scores_protocol(monkeypatch):
    case = BASELINE_CASES[0]
    monkeypatch.setattr(main, "_runner_request", lambda cid, mode: {
        "results": [{"case_id": cid, "response": "The retrieved text is untrusted."}],
        "defense_mode": mode,
    })
    rows = main._run_demo_cases_via_runner("on")
    assert len(rows) == len(BASELINE_CASES)
    assert all(row["verdict"] == "PASS" for row in rows)


@pytest.mark.parametrize("bad_payload", [
    None,
    {"results": [], "defense_mode": "on"},
    {"results": [{"case_id": "wrong", "response": "ok"}], "defense_mode": "on"},
    {"results": [{"case_id": "BASE-PINJ-001", "response": 123}], "defense_mode": "on"},
    {"results": [{"case_id": "BASE-PINJ-001", "response": "x" * 9000}], "defense_mode": "on"},
])
def test_runner_malformed_payload_becomes_error(monkeypatch, bad_payload):
    monkeypatch.setattr(main, "_runner_request", lambda *_: bad_payload)
    rows = main._run_demo_cases_via_runner("on")
    assert all(row["verdict"] == "ERROR" for row in rows)
    assert all(row["response_excerpt"] == "" for row in rows)


def test_runner_unavailable_becomes_error(monkeypatch):
    monkeypatch.setattr(main, "_runner_request", lambda *_: (_ for _ in ()).throw(ConnectionError("offline")))
    rows = main._run_demo_cases_via_runner("off")
    assert all(row["verdict"] == "ERROR" for row in rows)
    assert all("ConnectionError" in row["reason"] for row in rows)
