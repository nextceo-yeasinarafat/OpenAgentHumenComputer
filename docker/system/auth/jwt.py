
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time

ALGORITHM = "HS256"
ISSUER = "openagenthumencomputer-auth"


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _b64url_decode(text: str) -> bytes:
    padding = "=" * (-len(text) % 4)
    return base64.urlsafe_b64decode(text + padding)


def issue(secret: str, claims: dict, expire_hours: float = 24.0) -> str:

    now = int(time.time())
    payload = {
        **claims,
        "iss": ISSUER,
        "iat": now,
        "exp": now + int(expire_hours * 3600),
        "jti": secrets.token_hex(16),
    }
    header = {"alg": ALGORITHM, "typ": "JWT"}
    sections = (
        _b64url(json.dumps(header, separators=(",", ":")).encode()),
        _b64url(json.dumps(payload, separators=(",", ":")).encode()),
    )
    signature = hmac.new(
        secret.encode(), f"{sections[0]}.{sections[1]}".encode(), hashlib.sha256
    ).digest()
    return f"{sections[0]}.{sections[1]}.{_b64url(signature)}"


def verify(secret: str, token: str) -> dict | None:

    parts = token.split(".")
    if len(parts) != 3:
        return None
    header, payload, signature = parts
    try:
        header_data = json.loads(_b64url_decode(header))
        if header_data.get("alg") != ALGORITHM:
            return None
        expected = hmac.new(
            secret.encode(), f"{header}.{payload}".encode(), hashlib.sha256
        ).digest()
        if not hmac.compare_digest(expected, _b64url_decode(signature)):
            return None
        claims = json.loads(_b64url_decode(payload))
    except (ValueError, KeyError):
        return None
    if claims.get("iss") != ISSUER:
        return None
    if time.time() > claims.get("exp", 0):
        return None
    return claims


def new_secret() -> str:

    return secrets.token_hex(32)
