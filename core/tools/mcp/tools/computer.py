
from __future__ import annotations

from typing import Any

from ..client import get_client


def computer_state() -> dict[str, Any]:

    return get_client().status()


def computer_disk() -> dict[str, Any]:

    return get_client().disk()
