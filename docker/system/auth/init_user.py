
from __future__ import annotations

import os
import pwd
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from jwt import new_secret
from store import UserStore

username = os.environ.get("AUTH_USER", "").strip()
password = os.environ.get("AUTH_PASSWORD", "")

if not username or not password:
    print("auth: AUTH_USER and AUTH_PASSWORD are needed", file=sys.stderr)
    sys.exit(1)

home = Path("/home") / username
auth_dir = home / ".auth"
auth_dir.mkdir(parents=True, exist_ok=True)

store = UserStore(auth_dir / "auth.db")
store.create_user(username, password)

secret_path = auth_dir / "jwt.secret"
if not secret_path.exists():
    secret_path.write_text(new_secret())
os.chmod(secret_path, 0o600)


owner = pwd.getpwnam(username)
for path in (auth_dir, auth_dir / "auth.db", auth_dir / "auth.db-wal",
             auth_dir / "auth.db-shm", secret_path):
    if path.exists():
        os.chown(path, owner.pw_uid, owner.pw_gid)

print(f"auth: the account {username} has its door at {auth_dir / 'auth.db'}")
