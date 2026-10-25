
from __future__ import annotations

import urllib.parse
from typing import Any

from ..client import get_client


def browser_open(url: str) -> dict[str, Any]:

    trimmed = url.strip()
    if not trimmed:
        return {"error": "a url is needed"}
    return get_client().open_url(trimmed)


def browser_search(query: str) -> dict[str, Any]:

    trimmed = query.strip()
    if not trimmed:
        return {"error": "a query is needed"}
    search_url = f"https://www.google.com/search?q={urllib.parse.quote_plus(trimmed)}"
    return get_client().open_url(search_url)
