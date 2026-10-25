

from __future__ import annotations

import json
import os
import socket
import subprocess
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
APP = HERE / "app"
PORT = int(os.environ.get("OPEN_COMPUTER_UI_PORT", "1010"))
HOST = os.environ.get("OPEN_COMPUTER_UI_HOST", "0.0.0.0")


def run(*command: str) -> str | None:

    try:
        done = subprocess.run(
            command,
            cwd=APP if APP.is_dir() else HERE,
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    if done.returncode != 0:
        return None
    return (done.stdout or done.stderr).strip().splitlines()[0] if (done.stdout or done.stderr).strip() else None


def iso(timestamp: float) -> str:
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()


def listens() -> bool:

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(1.0)
        return sock.connect_ex(("127.0.0.1", PORT)) == 0


def main() -> dict[str, object]:
    dist = APP / "dist" / "index.html"
    return {
        "app": str(APP),
        "checkout": {
            "present": (APP / ".git").is_dir(),
            "branch": run("git", "rev-parse", "--abbrev-ref", "HEAD"),
            "commit": run("git", "rev-parse", "--short", "HEAD"),
            "subject": run("git", "log", "-1", "--pretty=%s"),
        },
        "build": {
            "present": dist.is_file(),
            "built_at": iso(dist.stat().st_mtime) if dist.is_file() else None,
        },
        "runtime": {
            "node": run("node", "--version"),
            "npm": run("npm", "--version"),
            "bun": run("bun", "--version"),
        },
        "server": {
            "host": HOST,
            "port": PORT,
            "listening": listens(),
        },
    }


if __name__ == "__main__":
    print(json.dumps(main(), indent=2))
