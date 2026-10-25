
from __future__ import annotations

from typing import Any

from ..client import get_client


def list_directory(path: str | None = None) -> dict[str, Any]:

    return get_client().list_dir(path or None)


def file_read(path: str) -> dict[str, Any]:

    return get_client().read_file(path)


def file_write(path: str, content: str, append: bool = False) -> dict[str, Any]:

    return get_client().write_file(path, content, append=append)
