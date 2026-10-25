import json
from urllib.error import HTTPError, URLError
from unittest.mock import patch

import pytest

from app.targets.openai_compatible import (
    MAX_RESPONSE_BYTES,
    TargetAdapterError,
    call_configured_target,
)

CASE = {"input_prompt": "test", "retrieved_text": "fixture", "case_id": "T"}
ENV = {
    "ARENA_LLM_BASE_URL": "https://example.test/v1",
    "ARENA_LLM_MODEL": "mock",
    "ARENA_LLM_API_KEY": "secret",
}


class Response:
    status = 200

    def __init__(self, body):
        self.body = body

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return None

    def read(self, limit):
        return self.body[:limit]


def test_adapter_sends_auth_and_returns_text():
    body = json.dumps({"choices": [{"message": {"content": "mocked answer"}}]}).encode()
    with patch.dict("os.environ", ENV, clear=True):
        with patch("app.targets.openai_compatible.urlopen", return_value=Response(body)) as open_url:
            assert call_configured_target(CASE, "on") == "mocked answer"
            request = open_url.call_args.args[0]
            assert request.get_header("Authorization") == "Bearer secret"
            assert request.full_url == "https://example.test/v1/chat/completions"
            messages = json.loads(request.data)["messages"]
            assert "untrusted" in messages[1]["content"].lower()
            assert "defense-in-depth" in messages[0]["content"]


def test_missing_configuration_fails_without_secret():
    with patch.dict("os.environ", {}, clear=True):
        with pytest.raises(TargetAdapterError, match="not configured") as error:
            call_configured_target(CASE, "off")
    assert "secret" not in str(error.value)


@pytest.mark.parametrize("endpoint", [
    "http://example.test",
    "https://user:password@example.test/v1",
    "https://example.test/v1?token=secret",
    "https://example.test/v1#fragment",
    "https://example.test:invalid/v1",
])
def test_unsafe_or_invalid_endpoint_rejected(endpoint):
    with patch.dict("os.environ", {**ENV, "ARENA_LLM_BASE_URL": endpoint}, clear=True):
        with pytest.raises(TargetAdapterError, match="HTTPS"):
            call_configured_target(CASE, "off")


@pytest.mark.parametrize("value", ["abc", "0", "-1", "60.1"])
def test_invalid_timeout_rejected(value):
    with patch.dict("os.environ", {**ENV, "ARENA_LLM_TIMEOUT_SECONDS": value}, clear=True):
        with pytest.raises(TargetAdapterError, match="timeout"):
            call_configured_target(CASE, "off")


def test_provider_http_error_does_not_leak_body_or_key():
    failure = HTTPError("https://example.test", 429, "limited", {}, None)
    with patch.dict("os.environ", ENV, clear=True):
        with patch("app.targets.openai_compatible.urlopen", side_effect=failure):
            with pytest.raises(TargetAdapterError, match="429") as error:
                call_configured_target(CASE, "off")
    assert "secret" not in str(error.value)


def test_connection_error_is_safe():
    with patch.dict("os.environ", ENV, clear=True):
        with patch("app.targets.openai_compatible.urlopen", side_effect=URLError("private details")):
            with pytest.raises(TargetAdapterError, match="timed out or returned invalid data"):
                call_configured_target(CASE, "off")


@pytest.mark.parametrize("body", [b"not json", b'{"choices":[]}', b'{"choices":[{"message":{"content":""}}]}'])
def test_malformed_or_empty_response_rejected(body):
    with patch.dict("os.environ", ENV, clear=True):
        with patch("app.targets.openai_compatible.urlopen", return_value=Response(body)):
            with pytest.raises(TargetAdapterError):
                call_configured_target(CASE, "off")


def test_oversized_response_rejected():
    body = b"x" * (MAX_RESPONSE_BYTES + 1)
    with patch.dict("os.environ", ENV, clear=True):
        with patch("app.targets.openai_compatible.urlopen", return_value=Response(body)):
            with pytest.raises(TargetAdapterError, match="1 MB"):
                call_configured_target(CASE, "off")
