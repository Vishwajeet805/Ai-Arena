import json
from unittest.mock import patch

import pytest

from app.targets.openai_compatible import TargetAdapterError, call_configured_target


CASE = {"input_prompt": "test", "retrieved_text": "fixture", "case_id": "T"}


def test_adapter_sends_auth_and_returns_text():
    body = json.dumps({"choices": [{"message": {"content": "mocked answer"}}]}).encode()
    class Response:
        status = 200
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def read(self, limit): return body
    with patch.dict("os.environ", {"ARENA_LLM_BASE_URL":"https://example.test/v1", "ARENA_LLM_MODEL":"mock", "ARENA_LLM_API_KEY":"secret"}):
        with patch("app.targets.openai_compatible.urlopen", return_value=Response()) as open_url:
            assert call_configured_target(CASE, "on") == "mocked answer"
            req = open_url.call_args.args[0]
            assert req.get_header("Authorization") == "Bearer secret"
            assert "untrusted" in json.loads(req.data)["messages"][1]["content"].lower()


def test_missing_configuration_fails_without_secret():
    with patch.dict("os.environ", {}, clear=True):
        with pytest.raises(TargetAdapterError, match="not configured"):
            call_configured_target(CASE, "off")


def test_non_https_rejected():
    with patch.dict("os.environ", {"ARENA_LLM_BASE_URL":"http://example.test", "ARENA_LLM_MODEL":"mock", "ARENA_LLM_API_KEY":"secret"}):
        with pytest.raises(TargetAdapterError, match="HTTPS"):
            call_configured_target(CASE, "off")
