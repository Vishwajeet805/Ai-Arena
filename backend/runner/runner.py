"""Safe runner protocol for fixed synthetic fixture IDs only.

The API currently evaluates fixtures in-process. This module is the entrypoint for a
separately constrained container and deliberately has no shell, network, or user-code
execution interface. Input is one JSON object containing only known case IDs and mode.
"""
import json
import sys

CASES = {
    "BASE-PINJ-001",
    "BASE-DISC-001",
    "BASE-OVRD-001",
    "BASE-TOOL-001",
}


def main() -> int:
    try:
        request = json.load(sys.stdin)
    except (json.JSONDecodeError, UnicodeDecodeError):
        print(json.dumps({"error": "invalid_json"}))
        return 2

    if not isinstance(request, dict) or set(request) != {"case_ids", "defense_mode"}:
        print(json.dumps({"error": "invalid_request"}))
        return 2
    case_ids = request["case_ids"]
    mode = request["defense_mode"]
    if not isinstance(case_ids, list) or not all(
        isinstance(case_id, str) and case_id in CASES for case_id in case_ids
    ):
        print(json.dumps({"error": "unknown_case_id"}))
        return 2
    if mode not in {"off", "on"}:
        print(json.dumps({"error": "invalid_defense_mode"}))
        return 2

    # This protocol intentionally returns only accepted identifiers and mode.
    # Application evaluation remains deterministic and never executes user input.
    print(json.dumps({"accepted_case_ids": case_ids, "defense_mode": mode}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
