
from __future__ import annotations

from typing import Any

from ..client import get_client


def computer_observe() -> dict[str, Any]:

    result = get_client().desktop_act([], settle_ms=0, observe=True)
    observation = result.get("observation")
    if not observation:
        return {"available": False, "error": "the screen did not answer", "result": result}
    return observation


def computer_act(actions: list[dict[str, Any]], settle_ms: int = 100) -> dict[str, Any]:

    if not actions or len(actions) > 24:
        return {"error": "1 to 24 actions are taken at a time"}
    result = get_client().desktop_act(actions, settle_ms=settle_ms, observe=True)
    observation = result.get("observation")
    if not observation:
        return {"completed": result.get("completed", False), "error": "the screen did not answer"}
    return observation
