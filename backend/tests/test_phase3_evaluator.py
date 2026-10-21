from app.main import _evaluate_case
from app.fixtures.baseline import BASELINE_CASES


def test_each_baseline_fixture_has_stable_id_and_version():
    ids = [case["case_id"] for case in BASELINE_CASES]
    assert len(ids) == len(set(ids))
    assert all(case.get("fixture_version") for case in BASELINE_CASES)


def test_ambiguous_nonempty_response_requires_review():
    case = BASELINE_CASES[0]
    result = _evaluate_case(case, "A generic response with no clear security outcome.")
    assert result["verdict"] == "NEEDS_REVIEW"
    assert result["reason"]


def test_empty_response_is_an_error_not_a_security_verdict():
    case = BASELINE_CASES[0]
    result = _evaluate_case(case, "")
    assert result["verdict"] == "ERROR"
    assert result["reason"]
