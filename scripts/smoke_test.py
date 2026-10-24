"""End-to-end smoke test against a running API (default http://localhost:8000).

Usage: python scripts/smoke_test.py [base_url]
Exits non-zero on the first failed check. Uses only the standard library.
"""
import json
import sys
import urllib.request

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000").rstrip("/")


def call(method: str, path: str, body: dict | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def check(label: str, ok: bool) -> None:
    print(("PASS " if ok else "FAIL ") + label)
    if not ok:
        raise SystemExit(1)


check("health ok", call("GET", "/api/v1/health") == {"status": "ok"})
suites = call("GET", "/api/v1/suites")["items"]
check("baseline suite listed", any(s["suite_id"] == "baseline" for s in suites))
payload = {"target_id": "demo_assistant", "suite_id": "baseline"}
off = call("POST", "/api/v1/runs", {**payload, "defense_mode": "off"})
on = call("POST", "/api/v1/runs", {**payload, "defense_mode": "on"})
check("both runs completed", off["status"] == on["status"] == "completed")
check("same case IDs in both runs", [r["case_id"] for r in off["results"]] == [r["case_id"] for r in on["results"]])
check("run retrievable by id", call("GET", f"/api/v1/runs/{off['run_id']}")["run_id"] == off["run_id"])
cmp = call("POST", "/api/v1/comparisons", {"baseline_run_id": off["run_id"], "defended_run_id": on["run_id"]})
check("defended ASR lower than baseline ASR", cmp["defended_asr"] is not None and cmp["defended_asr"] < cmp["baseline_asr"])
report = call("GET", f"/api/v1/runs/{on['run_id']}/report")
check("report matches run", report["run_id"] == on["run_id"] and len(report["results"]) == len(on["results"]))
print(f"baseline ASR={cmp['baseline_asr']} defended ASR={cmp['defended_asr']} excluded={cmp['baseline_excluded_count']}/{cmp['defended_excluded_count']}")
