
from __future__ import annotations

import hmac
import os
import time
from urllib.parse import urlparse

try:
    from .generate_token import load_registry, token_hash
except ImportError:
    from generate_token import load_registry, token_hash

MASTER_TOKEN = os.environ.get("AGENT_HUMEN_COMPUTER_TOKEN", "")

ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get(
        "AGENT_HUMEN_COMPUTER_ALLOWED_HOSTS", "127.0.0.1,localhost,0.0.0.0"
    ).split(",")
    if host.strip()
]


def _base_url_allowed(base_url: str | None) -> bool:
    if not base_url:
        return True
    host = urlparse(base_url).hostname or ""
    if host in ALLOWED_HOSTS:
        return True
    return host.startswith(("10.", "192.168.", "172."))


def verify_agent_token(
    token: str,
    required_permission: str | None = None,
    base_url: str | None = None,
) -> dict:

    if not _base_url_allowed(base_url):
        return {"valid": False, "agent": "", "role": "", "permissions": []}

    if MASTER_TOKEN and token and hmac.compare_digest(token, MASTER_TOKEN):
        return {
            "valid": True,
            "agent": "master-supervisor",
            "role": "admin",
            "permissions": ["all"],
        }

    if not token:
        return {"valid": False, "agent": "", "role": "", "permissions": []}

    record = load_registry().get(token_hash(token))
    if not record or record.get("revoked"):
        return {"valid": False, "agent": "", "role": "", "permissions": []}

    expires = record.get("expires_at", 0)
    if expires and time.time() > expires:
        return {"valid": False, "agent": "", "role": "", "permissions": []}

    permissions = record.get("permissions", [])
    if (
        required_permission
        and required_permission not in permissions
        and "all" not in permissions
    ):
        return {"valid": False, "agent": "", "role": "", "permissions": permissions}

    return {
        "valid": True,
        "agent": record.get("agent", ""),
        "role": "agent",
        "permissions": permissions,
    }


if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="verify an agent token")
    parser.add_argument("--token", required=True)
    parser.add_argument("--perm")
    parser.add_argument("--base-url")
    answer = verify_agent_token(
        parser.parse_args().token,
        parser.parse_args().perm,
        parser.parse_args().base_url,
    )
    print(json.dumps(answer))
