
from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from jwt import issue, verify
from store import UserStore

PORT = int(os.environ.get("AUTH_PORT", "8988"))
AUTH_DIR = Path(os.environ.get("AUTH_DIR", Path.home() / ".auth"))
DB_PATH = AUTH_DIR / "auth.db"
SECRET_PATH = AUTH_DIR / "jwt.secret"
EXPIRE_HOURS = float(os.environ.get("AUTH_EXPIRE_HOURS", "24"))


def secret() -> str:

    if SECRET_PATH.exists():
        return SECRET_PATH.read_text().strip()
    AUTH_DIR.mkdir(parents=True, exist_ok=True)
    SECRET_PATH.write_text(__import__("jwt").new_secret())
    os.chmod(SECRET_PATH, 0o600)
    return SECRET_PATH.read_text().strip()


STORE = UserStore(DB_PATH)
SIGNING_SECRET = secret()


class AuthService(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *_args) -> None:
        pass

    def _json(self, code: int, body: dict) -> None:
        raw = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _bearer(self) -> str:
        header = self.headers.get("Authorization", "")
        return header.removeprefix("Bearer ").strip()

    def _claims(self) -> dict | None:
        return verify(SIGNING_SECRET, self._bearer())

    def _body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length) or b"{}")

    def do_GET(self) -> None:
        if self.path == "/auth/me":
            claims = self._claims()
            if not claims:
                self._json(401, {"detail": "invalid token"})
                return
            self._json(200, {
                "username": claims.get("username"),
                "role": claims.get("role"),
                **STORE.profile(claims.get("username", "")),
            })
            return
        self._json(404, {"detail": "not found"})

    def do_POST(self) -> None:
        if self.path == "/auth/login":
            try:
                body = self._body()
            except Exception:
                self._json(400, {"detail": "the body is not ours to read"})
                return
            user = STORE.authenticate(
                str(body.get("username", "")), str(body.get("password", ""))
            )
            if not user:
                self._json(401, {"detail": "wrong username or password"})
                return
            STORE.record_login(user["username"], self.client_address[0])
            token = issue(
                SIGNING_SECRET,
                {"sub": user["username"], "username": user["username"], "role": user["role"]},
                EXPIRE_HOURS,
            )
            self._json(200, {"token": token, "tokenType": "Bearer", **user})
            return

        if self.path == "/auth/change-password":
            claims = self._claims()
            if not claims:
                self._json(401, {"detail": "invalid token"})
                return
            try:
                body = self._body()
            except Exception:
                self._json(400, {"detail": "the body is not ours to read"})
                return
            username = str(body.get("username") or claims.get("username", ""))
            new_password = str(body.get("new_password", ""))
            if len(new_password) < 8:
                self._json(400, {"detail": "the password needs at least 8 characters"})
                return
            if not STORE.change_password(
                username, str(body.get("old_password", "")), new_password
            ):
                self._json(403, {"detail": "the old password is not right"})
                return
            self._json(200, {"changed": True, "username": username})
            return

        if self.path == "/auth/logout":
            self._json(200, {"ok": True})
            return

        self._json(404, {"detail": "not found"})


def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", PORT), AuthService)
    print(f"auth: listening on http://127.0.0.1:{PORT} (db: {DB_PATH})")
    server.serve_forever()


if __name__ == "__main__":
    main()
