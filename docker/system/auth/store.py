
from __future__ import annotations

import hashlib
import hmac
import secrets
import sqlite3
import time
from pathlib import Path

ITERATIONS = 100_000


class UserStore:
    def __init__(self, db_path: Path) -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._connection = sqlite3.connect(self.db_path, check_same_thread=False)
        self._connection.execute("PRAGMA journal_mode=WAL")
        self._connection.execute("PRAGMA foreign_keys=ON")
        self._create_tables()

    def _create_tables(self) -> None:
        self._connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                username      TEXT PRIMARY KEY,
                password_hash TEXT NOT NULL,
                salt          TEXT NOT NULL,
                iterations    INTEGER NOT NULL DEFAULT 100000,
                role          TEXT NOT NULL DEFAULT 'admin',
                is_active     INTEGER NOT NULL DEFAULT 1,
                created_at    INTEGER NOT NULL,
                updated_at    INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS user_profiles (
                username TEXT PRIMARY KEY,
                theme    TEXT NOT NULL DEFAULT 'macos-dark',
                FOREIGN KEY (username) REFERENCES users (username)
                    ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS login_log (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                username  TEXT NOT NULL,
                at        INTEGER NOT NULL,
                client    TEXT NOT NULL DEFAULT ''
            );
            """
        )
        self._connection.commit()



    @staticmethod
    def _digest(password: str, salt: str, iterations: int) -> str:
        return hashlib.pbkdf2_hmac(
            "sha256", password.encode(), bytes.fromhex(salt), iterations
        ).hex()



    def create_user(self, username: str, password: str, role: str = "admin") -> None:
        salt = secrets.token_hex(16)
        now = int(time.time())
        self._connection.execute(
            "INSERT OR REPLACE INTO users "
            "(username, password_hash, salt, iterations, role, is_active, created_at, updated_at) "
            "VALUES (?, ?, ?, ?, ?, 1, ?, ?)",
            (username, self._digest(password, salt, ITERATIONS), salt,
             ITERATIONS, role, now, now),
        )
        self._connection.execute(
            "INSERT OR IGNORE INTO user_profiles (username) VALUES (?)", (username,)
        )
        self._connection.commit()

    def authenticate(self, username: str, password: str) -> dict | None:
        row = self._connection.execute(
            "SELECT username, password_hash, salt, iterations, role, is_active "
            "FROM users WHERE username = ?",
            (username,),
        ).fetchone()
        if row is None:
            return None
        name, password_hash, salt, iterations, role, is_active = row
        if not is_active:
            return None
        if not hmac.compare_digest(self._digest(password, salt, iterations), password_hash):
            return None
        return {"username": name, "role": role}

    def change_password(self, username: str, old: str, new: str) -> bool:
        if self.authenticate(username, old) is None:
            return False
        salt = secrets.token_hex(16)
        self._connection.execute(
            "UPDATE users SET password_hash = ?, salt = ?, iterations = ?, updated_at = ? "
            "WHERE username = ?",
            (self._digest(new, salt, ITERATIONS), salt, ITERATIONS, int(time.time()), username),
        )
        self._connection.commit()
        return True

    def set_active(self, username: str, active: bool) -> None:
        self._connection.execute(
            "UPDATE users SET is_active = ?, updated_at = ? WHERE username = ?",
            (1 if active else 0, int(time.time()), username),
        )
        self._connection.commit()

    def profile(self, username: str) -> dict:
        row = self._connection.execute(
            "SELECT username, theme FROM user_profiles WHERE username = ?",
            (username,),
        ).fetchone()
        return {"username": row[0], "theme": row[1]} if row else {}

    def record_login(self, username: str, client: str = "") -> None:
        self._connection.execute(
            "INSERT INTO login_log (username, at, client) VALUES (?, ?, ?)",
            (username, int(time.time()), client),
        )
        self._connection.commit()
