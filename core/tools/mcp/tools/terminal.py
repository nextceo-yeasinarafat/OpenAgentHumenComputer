
from __future__ import annotations

from typing import Any

from ..client import get_client


def terminal_exec(command: str, timeout: float = 60.0) -> dict[str, Any]:

    trimmed = command.strip()
    if not trimmed:
        return {"error": "a command is needed"}
    return get_client().exec(trimmed, timeout=timeout)
