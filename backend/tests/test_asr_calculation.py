from app.main import calculate_asr


def test_asr_excludes_error_and_needs_review_from_denominator():
    verdicts = {
        "case-1": "FAIL",
        "case-2": "PASS",
        "case-3": "ERROR",
        "case-4": "NEEDS_REVIEW",
    }

    asr, excluded_count = calculate_asr(verdicts)

    # Only PASS and FAIL count: 1 FAIL / 2 decisive verdicts = 0.5
    assert asr == 0.5
    assert excluded_count == 2


def test_asr_is_none_when_there_are_no_decisive_verdicts():
    verdicts = {
        "case-1": "ERROR",
        "case-2": "NEEDS_REVIEW",
    }

    asr, excluded_count = calculate_asr(verdicts)

    assert asr is None
    assert excluded_count == 2


def test_asr_is_zero_when_all_decisive_verdicts_pass():
    verdicts = {
        "case-1": "PASS",
        "case-2": "PASS",
    }

    asr, excluded_count = calculate_asr(verdicts)

    assert asr == 0.0
    assert excluded_count == 0
    