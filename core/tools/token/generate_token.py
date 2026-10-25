
from __future__ import annotations

import argparse
import hashlib
import json
import os
import secrets
import sys
import time
from pathlib import Path

PREFIX = "octk_live_"
DEFAULT_PERMISSIONS = ["terminal", "browser", "desktop", "filesystem"]
KNOWN_PERMISSIONS = {"terminal", "browser", "desktop", "filesystem", "all"}

HOME_CONFIG = Path.home() / ".config" / "openagenthumencomputer"


def registry_path() -> Path:
    return Path(
        os.environ.get(
            "AGENT_HUMEN_COMPUTER_TOKEN_STORE",
            str(HOME_CONFIG / "agent_tokens.json"),
        )
    )


def load_registry() -> dict:
    path = registry_path()
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return {}


def save_registry(registry: dict) -> None:
    path = registry_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(
        json.dumps(registry, indent=2, sort_keys=True), encoding="utf-8"
    )
    temporary.replace(path)
    os.chmod(path, 0o600)


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create(agent: str, ttl_days: int, permissions: list[str]) -> dict:
    for permission in permissions:
        if permission not in KNOWN_PERMISSIONS:
            raise SystemExit(f"unknown permission: {permission}")

    token = PREFIX + secrets.token_urlsafe(32)
    record = {
        "agent": agent,
        "token_prefix": token[:15] + "...",
        "token_hash": token_hash(token),
        "permissions": sorted(set(permissions)),
        "created_at": int(time.time()),
        "expires_at": int(time.time() + ttl_days * 86400) if ttl_days else 0,
        "revoked": False,
    }

    registry = load_registry()
    registry[record["token_hash"]] = record
    save_registry(registry)

    return {"token": token, **record}


def revoke(hash_prefix: str) -> bool:
    registry = load_registry()
    matches = [h for h in registry if h.startswith(hash_prefix)]
    if len(matches) != 1:
        raise SystemExit(
            f"{'no token' if not matches else 'several tokens'} match '{hash_prefix}'"
        )
    registry[matches[0]]["revoked"] = True
    save_registry(registry)
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Agent tokens of the computer")
    sub = parser.add_subparsers(dest="command", required=True)

    make = sub.add_parser("create", help="create a token, show it once")
    make.add_argument("--agent", required=True, help="who the token is for")
    make.add_argument("--ttl-days", type=int, default=30, help="days until it dies (0 = never)")
    make.add_argument(
        "--perms",
        default=",".join(DEFAULT_PERMISSIONS),
        help="comma-separated: terminal,browser,desktop,filesystem,all",
    )

    sub.add_parser("list", help="every token, by its hash")
    revoke_parser = sub.add_parser("revoke", help="kill a token by hash prefix")
    revoke_parser.add_argument("hash_prefix")

    args = parser.parse_args()

    if args.command == "create":
        made = create(
            args.agent, args.ttl_days, [p for p in args.perms.split(",") if p]
        )
        print(json.dumps(made, indent=2))
        print(
            f"\ntell the agent this token, once — it is not shown again:\n  {made['token']}",
            file=sys.stderr,
        )
    elif args.command == "list":
        registry = load_registry()
        for digest, record in sorted(registry.items()):
            state = "REVOKED" if record.get("revoked") else "active"
            expires = (
                time.strftime("%Y-%m-%d", time.gmtime(record["expires_at"]))
                if record.get("expires_at")
                else "never"
            )
            print(
                f"{digest[:12]}  {record['agent']:<20} {state:<8} "
                f"perms={','.join(record['permissions'])}  expires={expires}"
            )
        if not registry:
            print("no tokens yet — create one with 'create'")
    elif args.command == "revoke":
        revoke(args.hash_prefix)
        print("revoked")


if __name__ == "__main__":
    main()
