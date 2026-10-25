import importlib.util
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer
from urllib.error import HTTPError

import pytest

RUNNER_PATH = Path(__file__).resolve().parents[1] / "runner" / "runner.py"
spec = importlib.util.spec_from_file_location("arena_runner", RUNNER_PATH)
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)


@pytest.fixture
def runner_url(monkeypatch):
    server = ThreadingHTTPServer(("127.0.0.1", 0), runner.RunnerHandler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    url = f"http://127.0.0.1:{server.server_port}"
    monkeypatch.setenv("RUNNER_URL", url)
    yield url
    server.shutdown()
    thread.join(timeout=2)
    server.server_close()


def test_runner_http_health_and_allowlisted_run(runner_url):
    from urllib.request import urlopen
    import json

    with urlopen(runner_url + "/health", timeout=2) as response:
        assert response.status == 200
        assert json.loads(response.read()) == {"status": "ok"}

    payload = runner._handler_payload_for_test if hasattr(runner, "_handler_payload_for_test") else None
    # API client exercises the same wire protocol used in Compose.
    import app.main as main
    result = main._runner_request("BASE-PINJ-001", "on")
    assert result["defense_mode"] == "on"
    assert result["results"][0]["case_id"] == "BASE-PINJ-001"
    assert "untrusted" in result["results"][0]["response"]


def test_runner_http_rejects_unknown_case(runner_url):
    import json
    from urllib.request import Request, urlopen

    request = Request(
        runner_url + "/run",
        data=json.dumps({"case_ids": ["not-allowlisted"], "defense_mode": "on"}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with pytest.raises(HTTPError) as error:
        urlopen(request, timeout=2)
    assert error.value.code == 400
