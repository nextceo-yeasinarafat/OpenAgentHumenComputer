
from __future__ import annotations

import os
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[3]
ENV_FILES = [ROOT_DIR / ".env", ROOT_DIR / ".env.token"]

for env_path in ENV_FILES:
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as source:
            for line in source:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, value = line.partition("=")
                    os.environ.setdefault(key.strip(), value.strip())

BASE_URL = os.environ.get(
    "AGENT_HUMEN_COMPUTER_BASE_URL", "http://127.0.0.1:7071"
).rstrip("/")
TOKEN = os.environ.get("AGENT_HUMEN_COMPUTER_TOKEN", "")
