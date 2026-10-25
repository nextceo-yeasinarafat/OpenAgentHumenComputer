# auth

The door of the account: a real login for the computer, the way the first
version kept it — PBKDF2 passwords in SQLite, sessions signed with
HMAC-SHA256 — all of it on the standard library, so the image installs it
with nothing but a copy.

## Files

| File | What it does | When it runs |
| --- | --- | --- |
| `auth.conf` | port 8988, the account, the paths | sourced by every script |
| `store.py` | the account book: users, PBKDF2-HMAC-SHA256 (100k rounds, per-user salt), profiles, the login log — SQLite, WAL | imported by the service |
| `jwt.py` | the session word: HS256, hand-rolled, constant-time; the secret born once (0600) | imported by the service |
| `auth_service.py` | the door itself on `127.0.0.1:8988`: `POST /auth/login`, `GET /auth/me`, `POST /auth/change-password`, `POST /auth/logout` | `control.sh start` |
| `init_user.py` | gives one account its door (database + secret, owned by the account) | `install.sh`, `computer_setup.sh` |
| `install.sh` | copies the folder into `/opt/open-computer/auth`, the built-in account's door | `ubuntu/Dockerfile` build |
| `control.sh` | start / stop / restart / status | a shell of the computer |
| `auth.md` | this document | a person reading the folder |

## The endpoints (loopback of the computer only)

| Endpoint | What it says |
| --- | --- |
| `POST /auth/login` | `{username, password}` → `{token, tokenType, username, role}` — or 401 |
| `GET /auth/me` | Bearer → the account and its theme — or 401 |
| `POST /auth/change-password` | Bearer + `{old_password, new_password}` → `{changed}` |
| `POST /auth/logout` | `{ok}` (the word simply expires) |

## Commands

```bash
open-computer-auth start
bash /opt/open-computer/auth/control.sh status
```

## Notes

- The account is chosen when the computer is made, so `computer_setup.sh`
  gives the chosen account its door at first boot
  (`AUTH_USER`/`AUTH_PASSWORD` → `init_user.py`); the built-in
  `open-computer` account gets one at build time.
- The signing secret is born once per account and kept in its home (0600);
  it is never written into any image.
- The bridge may carry words to this door (8988 is loopback-only); it does
  not speak for it.
