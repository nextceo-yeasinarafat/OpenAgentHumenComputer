
from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Optional

from . import config


class BridgeClient:


    def __init__(
        self,
        base_url: Optional[str] = None,
        token: Optional[str] = None,
        timeout: float = 90.0,
    ) -> None:
        self.base_url = (base_url or config.BASE_URL).rstrip("/")
        self.token = token if token is not None else config.TOKEN
        self.timeout = timeout

    def _headers(self) -> dict[str, str]:
        headers = {"Accept": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _request(
        self,
        method: str,
        path: str,
        data: Optional[dict[str, Any]] = None,
        params: Optional[dict[str, Any]] = None,
    ) -> Any:
        url = f"{self.base_url}{path}"
        if params:
            query = urllib.parse.urlencode(
                {key: value for key, value in params.items() if value is not None}
            )
            url = f"{url}?{query}"

        body = json.dumps(data).encode("utf-8") if data is not None else None
        request = urllib.request.Request(
            url, data=body, headers=self._headers(), method=method
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as problem:
            detail = problem.read().decode("utf-8", "replace").strip()
            raise RuntimeError(f"HTTP {problem.code} from {path}: {detail}") from problem
        except OSError as problem:
            raise RuntimeError(
                f"the bridge is not reachable at {self.base_url}: {problem}"
            ) from problem



    def health(self) -> dict[str, Any]:
        return self._request("GET", "/api/health")

    def status(self) -> dict[str, Any]:

        return self._request("GET", "/api/computer/status")

    def disk(self) -> dict[str, Any]:

        return self._request("GET", "/api/disk")

    def exec(
        self, command: str, timeout: float = 60.0
    ) -> dict[str, Any]:

        return self._request(
            "POST", "/api/exec", data={"command": command, "timeout": timeout}
        )

    def list_dir(self, path: Optional[str] = None) -> dict[str, Any]:

        return self._request("GET", "/api/fs", params={"path": path} if path else None)

    def read_file(self, path: str) -> dict[str, Any]:
        return self._request("GET", "/api/file", params={"path": path})

    def write_file(
        self, path: str, content: str, append: bool = False
    ) -> dict[str, Any]:
        return self._request(
            "PUT", "/api/file", data={"path": path, "content": content, "append": append}
        )

    def open_url(self, url: str) -> dict[str, Any]:

        return self._request("POST", "/api/open-url", data={"url": url})

    def desktop_act(
        self, steps: list[dict[str, Any]], settle_ms: int = 100, observe: bool = True
    ) -> dict[str, Any]:

        return self._request(
            "POST",
            "/v1/desktop",
            data={"steps": steps, "settleMs": settle_ms, "observe": observe},
        )


_client: Optional[BridgeClient] = None


def get_client() -> BridgeClient:

    global _client
    if _client is None:
        _client = BridgeClient()
    return _client
