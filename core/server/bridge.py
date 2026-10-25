

from __future__ import annotations

import base64
import binascii
import codecs
import hashlib
import http.client
import json
import os
import re
import secrets
import shutil
import socket
import struct
import subprocess
import tempfile
import threading
import time
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Optional



BRIDGE_HOST = os.environ.get("AGENT_HUMEN_COMPUTER_BRIDGE_HOST", "127.0.0.1")
BRIDGE_PORT = int(os.environ.get("AGENT_HUMEN_COMPUTER_BRIDGE_PORT", "7071"))


ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = ROOT / ".env"
DOCKER_DIR = Path(os.environ.get("OPEN_COMPUTER_DOCKER_DIR", str(ROOT / "docker")))
SYSTEM_CONF = DOCKER_DIR / "system" / "system.conf"

BASE_IMAGE = os.environ.get("UBUNTU_BASE_IMAGE", "ubuntu:24.04")
COMPUTER_IMAGE = os.environ.get("UBUNTU_IMAGE", "openagenthumencomputer/ubuntu:24.04")
CONTAINER_NAME = os.environ.get("COMPUTER_CONTAINER", "openagentcomputer")


LANGUAGE_LOCALES = {
    "Bangla": "bn_BD.UTF-8",
    "English": "en_US.UTF-8",
    "Hindi": "hi_IN.UTF-8",
    "Urdu": "ur_PK.UTF-8",
    "Nepali": "ne_NP.UTF-8",
    "Sinhala": "si_LK.UTF-8",
    "Arabic": "ar_EG.UTF-8",
    "Indonesian": "id_ID.UTF-8",
    "Malay": "ms_MY.UTF-8",
    "Japanese": "ja_JP.UTF-8",
    "Korean": "ko_KR.UTF-8",
    "Chinese (Simplified)": "zh_CN.UTF-8",
    "Chinese (Traditional)": "zh_TW.UTF-8",
    "Turkish": "tr_TR.UTF-8",
    "French": "fr_FR.UTF-8",
    "German": "de_DE.UTF-8",
    "Dutch": "nl_NL.UTF-8",
    "Spanish": "es_ES.UTF-8",
    "Portuguese": "pt_BR.UTF-8",
    "Italian": "it_IT.UTF-8",
    "Swedish": "sv_SE.UTF-8",
    "Norwegian": "nb_NO.UTF-8",
    "Danish": "da_DK.UTF-8",
    "Finnish": "fi_FI.UTF-8",
    "Polish": "pl_PL.UTF-8",
    "Ukrainian": "uk_UA.UTF-8",
    "Russian": "ru_RU.UTF-8",
    "Swahili": "sw_KE.UTF-8",
}

USERNAME_RULE = re.compile(r"^[a-z][a-z0-9_-]{1,31}$")
TIMEZONE_RULE = re.compile(r"^[A-Za-z0-9_+\-/]+$")




class Making:


    def __init__(self) -> None:
        self._lines: list[dict] = []
        self._lock = threading.Lock()
        self._new_line = threading.Condition(self._lock)

    def say(self, kind: str, text: str) -> None:
        with self._new_line:
            self._lines.append({"kind": kind, "text": text})
            self._new_line.notify_all()

    def step(self, text: str) -> None:
        self.say("step", text)

    def out(self, text: str) -> None:
        self.say("output", text)

    def error(self, text: str) -> None:
        self.say("error", text)

    def snapshot(self) -> list[dict]:
        with self._lock:
            return list(self._lines)

    def wait_since(self, index: int, timeout: float) -> tuple[int, list[dict]]:

        deadline = time.monotonic() + timeout
        with self._new_line:
            while len(self._lines) <= index:
                left = deadline - time.monotonic()
                if left <= 0 or not self._new_line.wait(left):
                    break
            fresh = self._lines[index:]
            return index + len(fresh), list(fresh)


MAKING = Making()
MAKING_LOCK = threading.Lock()
MAKING_RUNNING = False




def read_hardware() -> dict:

    cores: Optional[int] = os.cpu_count()

    ram_gb: Optional[int] = None
    try:
        info = {}
        for line in Path("/proc/meminfo").read_text().splitlines():
            key, _, value = line.partition(":")
            info[key.strip()] = value.strip()
        kb = int(info.get("MemAvailable", "0").split()[0])
        gb = kb // (1024 * 1024)
        ram_gb = gb if gb >= 1 else None
    except Exception:
        ram_gb = None

    storage_gb: Optional[int] = None
    try:
        free = shutil.disk_usage(str(ROOT)).free
        gb = free // (1024**3)
        storage_gb = gb if gb >= 1 else None
    except Exception:
        storage_gb = None

    gpu: Optional[str] = None
    if shutil.which("nvidia-smi"):
        try:
            name = subprocess.run(
                ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
                capture_output=True, text=True, timeout=5,
            ).stdout.strip().splitlines()
            if name and name[0]:
                gpu = name[0]
        except Exception:
            gpu = None
    if gpu is None and shutil.which("lspci"):
        try:
            for line in subprocess.run(
                ["lspci"], capture_output=True, text=True, timeout=5
            ).stdout.splitlines():
                if "VGA compatible controller" in line or "3D controller" in line:
                    gpu = line.split(":", 3)[-1].strip()
                    break
        except Exception:
            gpu = None

    return {"cpuCores": cores, "ramGb": ram_gb, "storageGb": storage_gb, "gpu": gpu}




def write_system_conf(values: dict) -> None:

    updates = {
        "STORAGE_TOTAL_GB": str(values["storageGb"]),
        "CPU_CORES": str(values["cpuCores"]),
        "RAM_TOTAL_GB": str(values["ramGb"]),
        "GPU_ENABLED": "true" if values["gpuPercent"] > 0 else "false",
        "SYSTEM_NAME": values["name"],
        "SYSTEM_USER": values["username"],
        "SYSTEM_HOSTNAME": values["hostname"],
    }
    lines = SYSTEM_CONF.read_text().splitlines()
    seen = set()
    fresh: list[str] = []
    for line in lines:
        key = line.split("=", 1)[0].strip() if "=" in line else None
        if key in updates:
            fresh.append(f"{key}={updates[key]}")
            seen.add(key)
        else:
            fresh.append(line)
    for key, value in updates.items():
        if key not in seen:
            fresh.append(f"{key}={value}")
    SYSTEM_CONF.write_text("\n".join(fresh) + "\n")




def run_and_stream(args: list[str], making: Making) -> bool:

    making.out(f"$ {' '.join(args)}")
    try:
        process = subprocess.Popen(
            args,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=0,
        )
    except FileNotFoundError:
        making.error(f"the command is not on this machine: {args[0]}")
        return False

    assert process.stdout is not None
    pending = b""
    while True:
        chunk = process.stdout.read(512)
        if not chunk:
            break
        pending += chunk
        while True:
            cut = -1
            for mark in (b"\n", b"\r"):
                index = pending.find(mark)
                if index != -1 and (cut == -1 or index < cut):
                    cut = index
            if cut == -1:
                break
            raw, pending = pending[:cut], pending[cut + 1:]
            text = raw.decode("utf-8", "replace").strip()
            if text:
                making.out(text)

    if pending.strip():
        making.out(pending.decode("utf-8", "replace").strip())

    if process.wait() != 0:
        making.error(f"the command failed (exit {process.returncode})")
        return False
    return True


def inspect_container(name: str) -> Optional[dict]:
    try:
        raw = subprocess.run(
            ["docker", "inspect", name], capture_output=True, text=True, timeout=15
        ).stdout
        data = json.loads(raw)
        return data[0] if data else None
    except Exception:
        return None




def make_computer(values: dict) -> None:
    making = MAKING
    try:
        making.step(f"creating the computer {values['name']}")


        making.step("writing the chosen hardware into system.conf")
        write_system_conf(values)
        making.out(
            f"storage {values['storageGb']} GB · ram {values['ramGb']} GB · "
            f"cpu {values['cpuCores']} cores · gpu {values['gpuPercent']}%"
        )


        if subprocess.run(
            ["docker", "image", "inspect", BASE_IMAGE],
            capture_output=True, timeout=30,
        ).returncode != 0:
            making.step(f"downloading the base image {BASE_IMAGE}")
            if not run_and_stream(["docker", "pull", BASE_IMAGE], making):
                raise RuntimeError("the base image could not be downloaded")
        else:
            making.out(f"base image {BASE_IMAGE} is already on the machine")


        making.step("building the image of the computer (this is the long part)")
        if not run_and_stream([
            "docker", "build",
            "-t", COMPUTER_IMAGE, "-f", str(DOCKER_DIR / "ubuntu" / "Dockerfile"),
            str(DOCKER_DIR),
        ], making):
            raise RuntimeError("the image could not be built")



        making.step(f"starting the container {CONTAINER_NAME}")
        if inspect_container(CONTAINER_NAME) is not None:
            making.out(f"removing the old {CONTAINER_NAME}")
            run_and_stream(["docker", "rm", "-f", CONTAINER_NAME], making)

        base_args = [
            "docker", "run", "-d",
            "--name", CONTAINER_NAME,
            "--hostname", values["hostname"],



            "--security-opt", "seccomp=unconfined",
            "--cpus", str(values["cpuCores"]),
            "--memory", f"{values['ramGb']}g",
            "-e", f"OPEN_COMPUTER_NAME={values['name']}",
            "-e", f"OPEN_COMPUTER_USER={values['username']}",
            "-e", f"OPEN_COMPUTER_PASSWORD={values['password']}",
            "-e", f"OPEN_COMPUTER_TIMEZONE={values['timezone']}",
            "-e", f"TZ={values['timezone']}",
            "-e", f"OPEN_COMPUTER_LOCALE={values['locale']}",
            "-e", f"OPEN_COMPUTER_COUNTRY={values['country']}",
            "-e", f"OPEN_COMPUTER_LANGUAGE={values['language']}",
        ]
        tail = [
            COMPUTER_IMAGE,
            "bash", "-c",
            "/opt/open-computer/system/computer_setup.sh && exec sleep infinity",
        ]
        started = False


        for args in (base_args + ["--storage-opt", f"size={values['storageGb']}GB"] + tail,
                     base_args + tail):
            probe = subprocess.run(args, capture_output=True, text=True, timeout=60)
            if probe.returncode == 0:
                started = True
                break
            making.out((probe.stderr or probe.stdout).strip())
            if "--storage-opt" not in args:
                break
        if not started:
            raise RuntimeError("the container could not be started")


        info = inspect_container(CONTAINER_NAME)
        if info is not None:
            nanocpus = info.get("HostConfig", {}).get("NanoCpus", 0)
            memory = info.get("HostConfig", {}).get("Memory", 0)
            making.out(
                f"limits: {round(nanocpus / 1e9)} cpus · "
                f"{round(memory / (1024**3))} GB memory"
            )
        check = subprocess.run(
            ["docker", "exec", CONTAINER_NAME, "cat", "/etc/open-computer/computer.env"],
            capture_output=True, text=True, timeout=30,
        )
        for line in check.stdout.splitlines():
            if line.strip():
                making.out(line.strip())



        token = read_agent_token()
        making.out(f"agent api token: {token}")
        making.step(f"the computer is up: {CONTAINER_NAME}")
    except Exception as problem:
        making.error(str(problem))
        making.step("the making stopped")
    finally:
        global MAKING_RUNNING
        with MAKING_LOCK:
            MAKING_RUNNING = False




















DOCKER_SOCKET = Path("/var/run/docker.sock")
WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"


def read_system_value(key: str) -> str | None:

    try:
        for line in SYSTEM_CONF.read_text().splitlines():
            name, _, value = line.partition("=")
            if name.strip() == key and value.strip():
                return value.strip()
    except OSError:
        pass
    return None


def read_system_user() -> str:

    return read_system_value("SYSTEM_USER") or "open-computer"


def read_system_storage_gb() -> float:

    try:
        return float(read_system_value("STORAGE_TOTAL_GB") or "8")
    except ValueError:
        return 8.0


class _UnixHTTPConnection(http.client.HTTPConnection):


    def __init__(self, socket_path: Path) -> None:
        super().__init__("localhost")
        self._socket_path = socket_path

    def connect(self) -> None:
        sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        sock.connect(str(self._socket_path))
        self.sock = sock


def docker_exec_create(
    container: str,
    command: list[str],
    user: Optional[str] = None,
    workdir: Optional[str] = None,
    env: Optional[list[str]] = None,
    attach_stdin: bool = False,
) -> str:

    asked: dict = {
        "AttachStdin": attach_stdin,
        "AttachStdout": True,
        "AttachStderr": True,
        "Tty": True,
        "Cmd": command,
    }
    if user:
        asked["User"] = user
    if workdir:
        asked["WorkingDir"] = workdir
    if env:
        asked["Env"] = env
    body = json.dumps(asked).encode()
    connection = _UnixHTTPConnection(DOCKER_SOCKET)
    try:
        connection.request(
            "POST", f"/containers/{container}/exec", body=body,
            headers={"Content-Type": "application/json"},
        )
        answer = connection.getresponse()
        payload = answer.read()
        if answer.status != 201:
            raise RuntimeError(payload.decode("utf-8", "replace") or answer.reason)
        return json.loads(payload)["Id"]
    finally:
        connection.close()


def docker_exec_resize(exec_id: str, cols: int, rows: int) -> None:

    connection = _UnixHTTPConnection(DOCKER_SOCKET)
    try:
        connection.request(
            "POST",
            f"/exec/{exec_id}/resize?h={int(rows)}&w={int(cols)}",
            body=b"",
            headers={"Content-Length": "0"},
        )
        connection.getresponse().read()
    except OSError:
        pass
    finally:
        connection.close()


def docker_exec_inspect(exec_id: str) -> Optional[int]:

    connection = _UnixHTTPConnection(DOCKER_SOCKET)
    try:
        connection.request("GET", f"/exec/{exec_id}/json")
        answer = connection.getresponse()
        payload = answer.read()
        if answer.status != 200:
            return None
        return json.loads(payload).get("ExitCode")
    except (OSError, ValueError):
        return None
    finally:
        connection.close()


def docker_exec_output(
    command: list[str],
    timeout: float = 30.0,
    user: Optional[str] = None,
    env: Optional[list[str]] = None,
) -> tuple[int, str]:










    exec_id = docker_exec_create(
        CONTAINER_NAME, command, user=user or read_system_user(), env=env
    )
    stream = DockerExecStream(exec_id)
    chunks: list[bytes] = []
    try:
        stream.set_read_timeout(timeout)
        while True:
            try:
                chunk = stream.read()
            except TimeoutError:
                raise RuntimeError(
                    f"the computer did not answer within {int(timeout)} seconds"
                ) from None
            except OSError:
                break
            if not chunk:
                break
            chunks.append(chunk)
    finally:
        stream.close()
    code = docker_exec_inspect(exec_id)
    return (
        code if code is not None else 0
    ), b"".join(chunks).decode("utf-8", "replace")


def docker_write_file(
    target: str,
    content: bytes,
    timeout: float = 60.0,
    append: bool = False,
    user: Optional[str] = None,
) -> tuple[int, str]:







    command = [
        "bash", "-c", 'cat >> "$1"' if append else 'cat > "$1"', "bash", target
    ]
    exec_id = docker_exec_create(
        CONTAINER_NAME, command, user=user or read_system_user(), attach_stdin=True
    )
    stream = DockerExecStream(exec_id)
    chunks: list[bytes] = []
    try:
        stream.set_read_timeout(timeout)
        if content:
            stream.write(content)
        stream.close_write()
        while True:
            try:
                chunk = stream.read()
            except TimeoutError:
                raise RuntimeError(
                    f"the computer did not answer within {int(timeout)} seconds"
                ) from None
            except OSError:
                break
            if not chunk:
                break
            chunks.append(chunk)
    finally:
        stream.close()
    code = docker_exec_inspect(exec_id)
    return (
        code if code is not None else 0
    ), b"".join(chunks).decode("utf-8", "replace")


def docker_exec_output_raw(
    command: list[str], timeout: float = 30.0, user: Optional[str] = None
) -> tuple[int, bytes]:





    exec_id = docker_exec_create(
        CONTAINER_NAME, command, user=user or read_system_user()
    )
    stream = DockerExecStream(exec_id)
    chunks: list[bytes] = []
    try:
        stream.set_read_timeout(timeout)
        while True:
            try:
                chunk = stream.read()
            except TimeoutError:
                raise RuntimeError(
                    f"the computer did not answer within {int(timeout)} seconds"
                ) from None
            except OSError:
                break
            if not chunk:
                break
            chunks.append(chunk)
    finally:
        stream.close()
    code = docker_exec_inspect(exec_id)
    return (code if code is not None else 0), b"".join(chunks)


def read_system_home() -> str:

    return f"/home/{read_system_user()}"


def read_agent_token() -> str:







    line = f"AGENT_HUMEN_COMPUTER_TOKEN="
    existing = ""
    if ENV_FILE.exists():
        for row in ENV_FILE.read_text().splitlines():
            if row.startswith(line):
                existing = row[len(line):].strip().strip('"').strip("'")
                break
    if existing:
        return existing
    return write_agent_token()


def write_agent_token() -> str:

    token = "octk_live_" + secrets.token_urlsafe(32)
    for path in (ENV_FILE, ROOT / ".env.token"):
        if not path.exists():
            continue
        rows = path.read_text().splitlines()
        fresh = [
            row for row in rows
            if not row.startswith("AGENT_HUMEN_COMPUTER_TOKEN=")
        ]
        fresh.append(f"AGENT_HUMEN_COMPUTER_TOKEN={token}")
        path.write_text("\n".join(fresh) + "\n")
    if not ENV_FILE.exists():
        ENV_FILE.write_text(f"AGENT_HUMEN_COMPUTER_TOKEN={token}\n")
    return token


def explorer_target(raw: str) -> str:






    home = read_system_home()
    value = (raw or "").strip()
    if not value or value == "~":
        return home
    if value.startswith("~/"):
        value = home + value[1:]
    candidate = os.path.normpath(value)
    if not candidate.startswith("/"):
        candidate = f"{home}/{candidate}"
    if candidate != home and not candidate.startswith(home + "/"):
        raise ValueError("path is outside the computer")
    return candidate


def computer_not_running() -> Optional[str]:

    info = inspect_container(CONTAINER_NAME)
    if info is None:
        return "the computer does not exist on this machine"
    if not info.get("State", {}).get("Running"):
        return "the computer is not running"
    return None





FOLDER_SCRIPT = """
import json, os, stat, sys
target = sys.argv[1]
try:
    names = os.listdir(target)
except FileNotFoundError:
    raise SystemExit(3)
except NotADirectoryError:
    raise SystemExit(4)
except PermissionError:
    raise SystemExit(5)
entries = []
for name in names:
    full = os.path.join(target, name)
    try:
        info = os.lstat(full)
    except OSError:
        continue
    entries.append({
        "name": name,
        "path": full,
        "is_dir": stat.S_ISDIR(info.st_mode),
        "is_symlink": stat.S_ISLNK(info.st_mode),
        "size": info.st_size,
        "modified": int(info.st_mtime),
    })
print(json.dumps(entries))
"""


class DockerExecStream:








    def __init__(self, exec_id: str) -> None:
        self._sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self._sock.connect(str(DOCKER_SOCKET))
        body = b'{"Detach": false, "Tty": true}'
        request = (
            f"POST /exec/{exec_id}/start HTTP/1.1\r\n"
            "Host: docker\r\n"
            "Content-Type: application/json\r\n"
            "Connection: Upgrade\r\n"
            "Upgrade: tcp\r\n"
            f"Content-Length: {len(body)}\r\n"
            "\r\n"
        ).encode() + body
        self._sock.sendall(request)

        response = b""
        while b"\r\n\r\n" not in response:
            byte = self._sock.recv(1)
            if not byte:
                raise RuntimeError("docker closed the connection before the stream")
            response += byte
        head, _, _rest = response.partition(b"\r\n\r\n")
        status = int(head.split(b"\r\n")[0].split()[1])
        if status not in (101, 200):
            raise RuntimeError(head.decode("utf-8", "replace"))

    def set_read_timeout(self, seconds: float) -> None:
        self._sock.settimeout(seconds)

    def write(self, data: bytes) -> None:
        self._sock.sendall(data)

    def close_write(self) -> None:

        try:
            self._sock.shutdown(socket.SHUT_WR)
        except OSError:
            pass

    def read(self, size: int = 65536) -> bytes:
        return self._sock.recv(size)

    def close(self) -> None:
        try:
            self._sock.shutdown(socket.SHUT_RDWR)
        except OSError:
            pass
        self._sock.close()


def _ws_accept(key: str) -> str:
    digest = hashlib.sha1((key + WS_GUID).encode()).digest()
    return base64.b64encode(digest).decode()


def _ws_send_text(sock: socket.socket, lock: threading.Lock, text: str) -> bool:

    payload = text.encode("utf-8")
    length = len(payload)
    if length < 126:
        head = bytes([0x81, length])
    elif length < 65536:
        head = bytes([0x81, 126]) + struct.pack(">H", length)
    else:
        head = bytes([0x81, 127]) + struct.pack(">Q", length)
    try:
        with lock:
            sock.sendall(head + payload)
        return True
    except OSError:
        return False


def _ws_send_close(sock: socket.socket, lock: threading.Lock) -> None:
    try:
        with lock:
            sock.sendall(bytes([0x88, 0x00]))
    except OSError:
        pass


def stream_pty_session(handler: "Bridge", cols: int, rows: int) -> None:







    key = handler.headers.get("Sec-WebSocket-Key")
    upgrade = (handler.headers.get("Upgrade") or "").lower()
    if key is None or "websocket" not in upgrade:
        return

    handler.send_response(101, "Switching Protocols")
    handler.send_header("Upgrade", "websocket")
    handler.send_header("Connection", "Upgrade")
    handler.send_header("Sec-WebSocket-Accept", _ws_accept(key))
    handler.end_headers()
    handler.close_connection = True

    wire = handler.connection
    wire_lock = threading.Lock()

    def tell(text: str) -> bool:
        return _ws_send_text(wire, wire_lock, text)

    info = inspect_container(CONTAINER_NAME)
    if info is None or not info.get("State", {}).get("Running"):
        tell('{"type": "error", "detail": "the computer is not running"}')
        _ws_send_close(wire, wire_lock)
        return

    user = read_system_user()
    home = f"/home/{user}"
    env = [
        "TERM=xterm-256color",
        f"HOME={home}",
        f"USER={user}",
        f"LOGNAME={user}",



        'PROMPT_COMMAND=printf \'\\033]7;file://%s%s\\007\' "$HOSTNAME" "$PWD"',
    ]
    try:
        exec_id = docker_exec_create(
            CONTAINER_NAME,
            ["/bin/bash", "--login"],
            user=user,
            workdir=home,
            env=env,
            attach_stdin=True,
        )
        stream = DockerExecStream(exec_id)
    except (OSError, RuntimeError, ValueError, KeyError) as problem:
        tell(json.dumps({"type": "error", "detail": str(problem)}))
        _ws_send_close(wire, wire_lock)
        return

    docker_exec_resize(exec_id, cols, rows)
    decoder = codecs.getincrementaldecoder("utf-8")("replace")
    session_over = threading.Event()

    def pump_shell_to_browser() -> None:
        while not session_over.is_set():
            try:
                chunk = stream.read()
            except OSError:
                chunk = b""
            if not chunk:
                break
            text = decoder.decode(chunk)
            if text and not tell(json.dumps({"type": "output", "data": text})):
                break
        if not session_over.is_set():
            tell(json.dumps({"type": "exit", "code": 0}))
            _ws_send_close(wire, wire_lock)


            time.sleep(1.0)
            session_over.set()
            try:
                wire.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass

    threading.Thread(
        target=pump_shell_to_browser, daemon=True
    ).start()

    def fit(cols: int, rows: int) -> None:


        for _ in range(4):
            docker_exec_resize(exec_id, cols, rows)
            time.sleep(0.25)


    fragmented: list[bytes] | None = None
    try:
        while not session_over.is_set():
            head = handler.rfile.read(2)
            if len(head) < 2:
                break
            opcode = head[0] & 0x0F
            masked = bool(head[1] & 0x80)
            length = head[1] & 0x7F
            if length == 126:
                extended = handler.rfile.read(2)
                if len(extended) < 2:
                    break
                length = struct.unpack(">H", extended)[0]
            elif length == 127:
                extended = handler.rfile.read(8)
                if len(extended) < 8:
                    break
                length = struct.unpack(">Q", extended)[0]
            mask = handler.rfile.read(4) if masked else None
            payload = handler.rfile.read(length) if length else b""
            if len(payload) < length:
                break
            if mask:
                payload = bytes(
                    byte ^ mask[index % 4] for index, byte in enumerate(payload)
                )

            if opcode == 0x8:
                break
            if opcode == 0x9:
                try:
                    with wire_lock:
                        wire.sendall(bytes([0x8A, len(payload)]) + payload)
                except OSError:
                    break
                continue
            if opcode in (0x1, 0x2, 0x0):
                if opcode == 0x0 and fragmented is not None:
                    fragmented.append(payload)
                elif opcode == 0x0:
                    continue
                elif head[0] & 0x80:
                    message = payload
                else:
                    fragmented = [payload]
                    continue
                if head[0] & 0x80 and opcode != 0x0 and fragmented is not None:
                    message = b"".join(fragmented)
                    fragmented = None
                try:
                    note = json.loads(message.decode("utf-8"))
                except (UnicodeDecodeError, json.JSONDecodeError):
                    continue
                kind = note.get("type")
                if kind == "input":
                    try:
                        stream.write(str(note.get("data", "")).encode("utf-8"))
                    except OSError:
                        break
                elif kind == "resize":
                    threading.Thread(
                        target=fit,
                        args=(int(note.get("cols", cols)), int(note.get("rows", rows))),
                        daemon=True,
                    ).start()
    finally:
        session_over.set()
        stream.close()

















CHROME_DIR = "/opt/open-computer/chromium"
CORE_SYSTEAM_DIR = ROOT / "docker" / "core_systeam"
KNOWN_SERVICES = ("bridge", "computer", "screen", "browser", "mcp", "vscode")
NOVNC_DIR = "/opt/open-computer/novnc"
CDP_FORWARD_PORT = 9223
NOVNC_PORT = 6080




MAX_UPLOAD_BYTES = 32 * 1024 * 1024



MAX_TEXT_FILE_BYTES = 2 * 1024 * 1024


MAX_MEDIA_BYTES = 64 * 1024 * 1024


MEDIA_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".bmp": "image/bmp",
    ".ico": "image/x-icon",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ogv": "video/ogg",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".m4a": "audio/mp4",
    ".flac": "audio/flac",
}




BROWSER_ASLEEP_MARK = "/tmp/open-computer-browser-asleep"


WS_CONT, WS_TEXT, WS_BINARY, WS_CLOSE, WS_PING, WS_PONG = 0, 1, 2, 8, 9, 10


def container_address() -> Optional[str]:

    info = inspect_container(CONTAINER_NAME)
    if info is None:
        return None
    networks = info.get("NetworkSettings", {}).get("Networks") or {}
    for setting in networks.values():
        address = setting.get("IPAddress")
        if address:
            return address
    return info.get("NetworkSettings", {}).get("IPAddress") or None


def container_port_open(address: str, port: int, timeout: float = 0.6) -> bool:
    try:
        with socket.create_connection((address, port), timeout=timeout):
            return True
    except OSError:
        return False


def http_get_raw(address: str, port: int, path: str, timeout: float = 10.0):

    with socket.create_connection((address, port), timeout=timeout) as wire:
        wire.sendall(
            f"GET {path} HTTP/1.1\r\nHost: {address}:{port}\r\n"
            "Connection: close\r\nAccept: */*\r\n\r\n".encode()
        )
        chunks = []
        wire.settimeout(timeout)
        while True:
            try:
                chunk = wire.recv(65536)
            except OSError:
                break
            if not chunk:
                break
            chunks.append(chunk)
    raw = b"".join(chunks)
    head, _, body = raw.partition(b"\r\n\r\n")
    lines = head.decode("utf-8", "replace").splitlines()
    status = int(lines[0].split()[1]) if lines and len(lines[0].split()) > 1 else 0
    headers = {}
    for line in lines[1:]:
        key, _, value = line.partition(":")
        headers[key.strip().lower()] = value.strip()


    if headers.get("transfer-encoding", "").lower() == "chunked":
        joined = bytearray()
        rest = body
        while True:
            line_end = rest.find(b"\r\n")
            if line_end < 0:
                break
            try:
                size = int(bytes(rest[:line_end]).split(b";")[0], 16)
            except ValueError:
                break
            if size == 0:
                break
            joined += rest[line_end + 2 : line_end + 2 + size]
            rest = rest[line_end + 2 + size + 2 :]
        body = bytes(joined)
    return status, headers, body


def ensure_computer_screen(address: str) -> None:






    if container_port_open(address, NOVNC_PORT):
        return
    try:
        docker_exec_output(
            ["bash", f"{NOVNC_DIR}/control.sh", "start"],
            timeout=90.0,
            user="root",
        )
    except (OSError, RuntimeError):
        pass


def computer_browser_asleep(address: str) -> bool:

    try:
        code, _output = docker_exec_output(
            ["bash", "-lc", f"test -f {BROWSER_ASLEEP_MARK}"],
            timeout=10.0,
            user="root",
        )
    except (OSError, RuntimeError):
        return False
    return code == 0


def ensure_computer_browser(address: str) -> None:














    if computer_browser_asleep(address):
        return

    ensure_computer_screen(address)
    user = read_system_user()
    home = read_system_home()



    browser_env = [
        f"OPEN_COMPUTER_USER={user}",
        f"OPEN_COMPUTER_USER_HOME={home}",
    ]
    try:
        docker_exec_output(
            [
                "bash", "-lc",




                "pid=\"$(cat /tmp/open-computer/cdp-forward.pid 2>/dev/null)\"; "
                "if [ -n \"$pid\" ] && ps -o stat= -p \"$pid\" 2>/dev/null | grep -q Z; then "
                "rm -f /tmp/open-computer/cdp-forward.pid; fi; "
                "pgrep -f 'chromium/control.sh supervise' >/dev/null 2>&1 || "
                f"setsid nohup bash {CHROME_DIR}/control.sh supervise "
                ">/dev/null 2>&1 </dev/null & exit 0",
            ],
            timeout=15.0,
            user="root",
            env=browser_env,
        )
        docker_exec_output(
            ["bash", f"{CHROME_DIR}/control.sh", "forward"],
            timeout=30.0,
            user="root",
            env=browser_env,
        )
        docker_exec_output(
            ["bash", f"{CHROME_DIR}/control.sh", "wake"],
            timeout=90.0,
            user="root",
            env=browser_env,
        )
    except (OSError, RuntimeError):
        pass


class WSClient:








    def __init__(self, address: str, port: int, resource: str, timeout: float = 15.0):
        self._sock = socket.create_connection((address, port), timeout=timeout)
        key = base64.b64encode(os.urandom(16)).decode()
        self._sock.sendall(
            (
                f"GET {resource} HTTP/1.1\r\n"
                f"Host: {address}:{port}\r\n"
                "Upgrade: websocket\r\n"
                "Connection: Upgrade\r\n"
                f"Sec-WebSocket-Key: {key}\r\n"
                "Sec-WebSocket-Version: 13\r\n"
                "\r\n"
            ).encode()
        )
        answer = bytearray()
        while b"\r\n\r\n" not in answer:
            byte = self._sock.recv(1)
            if not byte:
                raise RuntimeError("the computer closed the stream before it began")
            answer += byte
        raw = bytes(answer)
        head = raw.split(b"\r\n\r\n")[0].decode("utf-8", "replace")
        status = head.splitlines()[0] if head else ""
        if " 101" not in status:
            raise RuntimeError(f"the computer refused the stream: {status.strip()}")
        self._buffer = raw.split(b"\r\n\r\n", 1)[1]




        self._sock.settimeout(None)

    def _need(self, size: int) -> bytes:
        while len(self._buffer) < size:
            chunk = self._sock.recv(65536)
            if not chunk:
                raise OSError("the stream ended")
            self._buffer += chunk
        out, self._buffer = self._buffer[:size], self._buffer[size:]
        return out

    def recv_frame(self, timeout: Optional[float] = None):








        self._sock.settimeout(timeout)
        try:
            head = self._need(2)
            fin = bool(head[0] & 0x80)
            opcode = head[0] & 0x0F
            masked = bool(head[1] & 0x80)
            length = head[1] & 0x7F
            if length == 126:
                length = struct.unpack(">H", self._need(2))[0]
            elif length == 127:
                length = struct.unpack(">Q", self._need(8))[0]
            mask = self._need(4) if masked else None
            payload = self._need(length) if length else b""
            if mask:
                payload = bytes(
                    byte ^ mask[index % 4] for index, byte in enumerate(payload)
                )
            return fin, opcode, payload
        except TimeoutError:


            raise
        except OSError:
            return None

    def send_frame(self, fin: bool, opcode: int, payload: bytes) -> bool:

        length = len(payload)
        first = (0x80 if fin else 0x00) | opcode
        if length < 126:
            head = bytes([first, 0x80 | length])
        elif length < 65536:
            head = bytes([first, 0x80 | 126]) + struct.pack(">H", length)
        else:
            head = bytes([first, 0x80 | 127]) + struct.pack(">Q", length)
        mask = os.urandom(4)
        shielded = bytes(byte ^ mask[index % 4] for index, byte in enumerate(payload))
        try:
            self._sock.sendall(head + mask + shielded)
            return True
        except OSError:
            return False

    def close(self) -> None:
        try:
            self.send_frame(True, WS_CLOSE, b"")
        except OSError:
            pass


        try:
            self._sock.shutdown(socket.SHUT_RDWR)
        except OSError:
            pass
        try:
            self._sock.close()
        except OSError:
            pass


def read_ws_frame(rfile):

    head = rfile.read(2)
    if not head or len(head) < 2:
        return None
    fin = bool(head[0] & 0x80)
    opcode = head[0] & 0x0F
    masked = bool(head[1] & 0x80)
    length = head[1] & 0x7F
    if length == 126:
        extended = rfile.read(2)
        if len(extended) < 2:
            return None
        length = struct.unpack(">H", extended)[0]
    elif length == 127:
        extended = rfile.read(8)
        if len(extended) < 8:
            return None
        length = struct.unpack(">Q", extended)[0]
    mask = rfile.read(4) if masked else None
    payload = rfile.read(length) if length else b""
    if len(payload) < length:
        return None
    if mask:
        payload = bytes(byte ^ mask[index % 4] for index, byte in enumerate(payload))
    return fin, opcode, payload


def _ws_send_frame(sock: socket.socket, lock: threading.Lock, fin: bool, opcode: int, payload: bytes) -> bool:

    length = len(payload)
    first = (0x80 if fin else 0x00) | opcode
    if length < 126:
        head = bytes([first, length])
    elif length < 65536:
        head = bytes([first, 126]) + struct.pack(">H", length)
    else:
        head = bytes([first, 127]) + struct.pack(">Q", length)
    try:
        with lock:
            sock.sendall(head + payload)
        return True
    except OSError:
        return False


def ws_accept(handler: "Bridge") -> Optional[socket.socket]:

    key = handler.headers.get("Sec-WebSocket-Key")
    upgrade = (handler.headers.get("Upgrade") or "").lower()
    if key is None or "websocket" not in upgrade:
        return None
    handler.send_response(101, "Switching Protocols")
    handler.send_header("Upgrade", "websocket")
    handler.send_header("Connection", "Upgrade")
    handler.send_header("Sec-WebSocket-Accept", _ws_accept(key))

    offered = handler.headers.get("Sec-WebSocket-Protocol")
    if offered:
        handler.send_header("Sec-WebSocket-Protocol", offered.split(",")[0].strip())
    handler.end_headers()
    handler.close_connection = True
    return handler.connection


def ws_pass_through(handler: "Bridge", upstream: WSClient) -> None:

    wire = handler.connection
    wire_lock = threading.Lock()
    over = threading.Event()

    def to_computer() -> None:
        while not over.is_set():
            frame = read_ws_frame(handler.rfile)
            if frame is None:
                break
            fin, opcode, payload = frame
            if opcode == WS_CLOSE:
                break
            if not upstream.send_frame(fin, opcode, payload):
                break
        over.set()

    def to_browser() -> None:
        while not over.is_set():
            try:
                frame = upstream.recv_frame()
            except TimeoutError:


                continue
            if frame is None:
                break
            fin, opcode, payload = frame
            if opcode == WS_CLOSE:
                break
            if not _ws_send_frame(wire, wire_lock, fin, opcode, payload):
                break
        over.set()

    pumps = [
        threading.Thread(target=to_computer, daemon=True),
        threading.Thread(target=to_browser, daemon=True),
    ]
    for pump in pumps:
        pump.start()
    over.wait()
    upstream.close()
    try:
        wire.shutdown(socket.SHUT_RDWR)
    except OSError:
        pass


def stream_browser_cdp(handler: "Bridge") -> None:

    wire = ws_accept(handler)
    if wire is None:
        return

    def fail(detail: str) -> None:
        lock = threading.Lock()
        _ws_send_frame(
            wire, lock, True, WS_TEXT,
            json.dumps({"type": "error", "detail": detail}).encode(),
        )
        _ws_send_close(wire, lock)

    address = container_address()
    if address is None:
        fail("the computer does not exist on this machine")
        return
    not_running = computer_not_running()
    if not_running:
        fail(not_running)
        return

    ensure_computer_browser(address)

    try:
        status, _headers, body = http_get_raw(address, CDP_FORWARD_PORT, "/json/version")
        debugger = json.loads(body)["webSocketDebuggerUrl"]
        resource = "/" + debugger.split("/", 3)[3]
    except (OSError, ValueError, KeyError, IndexError) as problem:
        fail(f"the browser did not answer: {problem}")
        return

    try:
        upstream = WSClient(address, CDP_FORWARD_PORT, resource)
    except (OSError, RuntimeError) as problem:
        fail(f"the browser did not answer: {problem}")
        return

    ws_pass_through(handler, upstream)


def stream_browser_screen(handler: "Bridge") -> None:

    wire = ws_accept(handler)
    if wire is None:
        return

    address = container_address()
    if address is None:
        _ws_send_close(wire, threading.Lock())
        return

    ensure_computer_screen(address)

    try:
        upstream = WSClient(address, NOVNC_PORT, "/websockify")
    except (OSError, RuntimeError):
        _ws_send_close(wire, threading.Lock())
        return

    ws_pass_through(handler, upstream)


def pass_through_novnc(handler: "Bridge", path: str) -> None:

    address = container_address()
    if address is None:
        handler._json(503, {"detail": "the computer does not exist on this machine"})
        return
    ensure_computer_screen(address)
    try:
        status, headers, body = http_get_raw(address, NOVNC_PORT, path, timeout=30.0)
    except OSError:
        handler._json(503, {"detail": "the screen of the computer is not reachable"})
        return
    if status != 200:
        handler._json(503 if status >= 500 else 404, {"detail": f"the computer answered {status}"})
        return
    handler.send_response(200)
    handler.send_header("Content-Type", headers.get("content-type", "application/octet-stream"))
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-cache")
    handler.end_headers()
    handler.wfile.write(body)











API_SCRIPTS = "/opt/open-computer/api"
PY_IN_COMPUTER = "/opt/python/current/bin/python3"
CHROMIUM_OPEN = "/opt/open-computer/chromium/open.sh"


def agent_user() -> str:
    return read_system_user()


def screen_step_shell(steps: list[dict], settle_ms: int) -> str:





    lines = ["export DISPLAY=:1", "set +e"]
    for step in steps:
        action = str(step.get("action", "")).strip()
        if not action and step.get("argv"):
            words = " ".join(
                "'" + str(word).replace("'", "'\\''") + "'"
                for word in step["argv"]
            )
            lines.append(words)
            continue

        x = int(step.get("x", 0))
        y = int(step.get("y", 0))
        button = 3 if str(step.get("button", "")).lower() in ("right", "3") else             int(step.get("button", 1) or 1)

        if action == "move":
            lines.append(f"xdotool mousemove -- {x} {y}")
        elif action == "click":
            repeat = "--repeat 2 --delay 100 " if step.get("double") else ""
            lines.append(f"xdotool click --clearmodifiers {repeat}{button}")
        elif action == "down":
            lines.append(f"xdotool mousedown {button}")
        elif action == "up":
            lines.append(f"xdotool mouseup {button}")
        elif action == "type":
            text = str(step.get("text", "")).replace("'", "'\\''")
            lines.append(f"xdotool type --clearmodifiers -- '{text}'")
        elif action == "key":
            key = str(step.get("key", "")).replace("'", "'\\''")
            lines.append(f"xdotool key --clearmodifiers '{key}'")
        elif action == "scroll":
            amount = max(1, int(step.get("amount", 3)))
            wheel = 4 if str(step.get("direction", "down")).lower() == "up" else 5
            for _ in range(amount):
                lines.append(f"xdotool click --clearmodifiers {wheel}")
        elif action == "wait":
            lines.append(f"sleep {max(0, int(step.get('waitMs', 0))) / 1000:.3f}")
    lines.append(f"sleep {max(0, int(settle_ms)) / 1000:.3f}")
    return "\n".join(lines)


def agent_guard(handler: "Bridge") -> Optional[str]:

    address = container_address()
    not_running = computer_not_running()
    if address is None:
        handler._json(503, {"detail": "the computer does not exist on this machine"})
        return None
    if not_running:
        handler._json(503, {"detail": not_running})
        return None
    return address












VSCODE_PORT = 8989
VSCODE_CONTROL = "/opt/open-computer/vscode/control.sh"
HOP_BY_HOP = (
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "proxy-connection", "te", "trailer", "transfer-encoding", "upgrade",
)


def vscode_running(address: str) -> bool:
    return container_port_open(address, VSCODE_PORT, timeout=1.0)


def vscode_control(action: str, timeout: float) -> dict:






    code, output = docker_exec_output(
        ["bash", VSCODE_CONTROL, action],
        timeout=timeout,
        user="root",
        env=[
            f"OPEN_COMPUTER_USER={read_system_user()}",
            f"OPEN_COMPUTER_USER_HOME={read_system_home()}",
        ],
    )
    address = container_address()
    running = bool(address and vscode_running(address))
    return {
        "action": action,
        "running": running,
        "exit_code": code,
        "stdout": output[:2000],
    }


def http_splice_request(address: str, port: int, raw_request: bytes, timeout: float = 60.0):

    with socket.create_connection((address, port), timeout=timeout) as wire:
        wire.settimeout(timeout)
        wire.sendall(raw_request)
        chunks = []
        while True:
            try:
                chunk = wire.recv(65536)
            except OSError:
                break
            if not chunk:
                break
            chunks.append(chunk)
    raw = b"".join(chunks)
    head, _, body = raw.partition(b"\r\n\r\n")
    lines = head.decode("utf-8", "replace").splitlines()
    status = int(lines[0].split()[1]) if lines and len(lines[0].split()) > 1 else 0
    headers = {}
    for line in lines[1:]:
        key, _, value = line.partition(":")
        headers[key.strip().lower()] = value.strip()
    if headers.get("transfer-encoding", "").lower() == "chunked":
        joined = bytearray()
        rest = body
        while True:
            line_end = rest.find(b"\r\n")
            if line_end < 0:
                break
            try:
                size = int(bytes(rest[:line_end]).split(b";")[0], 16)
            except ValueError:
                break
            if size == 0:
                break
            joined += rest[line_end + 2 : line_end + 2 + size]
            rest = rest[line_end + 2 + size + 2 :]
        body = bytes(joined)
        headers.pop("transfer-encoding", None)
    return status, headers, body


def vscode_http_pass_through(handler: "Bridge", method: str) -> None:

    address = container_address()
    if address is None:
        handler._json(503, {"detail": "the computer does not exist on this machine"})
        return

    lines = [f"{method} {handler.path} HTTP/1.1"]
    for key, value in handler.headers.items():
        if key.lower() in HOP_BY_HOP:
            continue
        lines.append(f"{key}: {value}")
    lines.append("Connection: close")

    body = b""
    length = handler.headers.get("Content-Length")
    if length and method in ("POST", "PUT"):
        body = handler.rfile.read(int(length))
    raw_request = ("\r\n".join(lines) + "\r\n\r\n").encode("utf-8", "replace") + body

    try:
        status, headers, answer = http_splice_request(
            address, VSCODE_PORT, raw_request, timeout=60.0
        )
    except OSError:
        handler._json(503, {"detail": "the editor of the computer is not reachable"})
        return

    handler.send_response(status if status else 502)
    for key, value in headers.items():
        if key in HOP_BY_HOP or key in ("content-length", "connection"):
            continue
        handler.send_header(key, value)
    handler.send_header("Content-Length", str(len(answer)))
    handler.send_header("Connection", "close")
    handler.close_connection = True
    handler.end_headers()
    if method != "HEAD":
        handler.wfile.write(answer)


def vscode_ws_splice(handler: "Bridge") -> None:







    address = container_address()
    if address is None:
        return

    try:
        upstream = socket.create_connection((address, VSCODE_PORT), timeout=20.0)


        upstream.settimeout(None)
    except OSError:
        return






    keep_always = {"upgrade", "connection", "sec-websocket-key",
                   "sec-websocket-version", "sec-websocket-protocol",
                   "sec-websocket-extensions"}
    lines = [handler.requestline]
    for key, value in handler.headers.items():
        name = key.lower()
        if name in keep_always or name not in HOP_BY_HOP:
            lines.append(f"{key}: {value}")
    lines.append("")
    raw_request = "\r\n".join(lines) + "\r\n"

    try:
        upstream.sendall(raw_request.encode("utf-8", "replace"))
    except OSError:
        upstream.close()
        return

    handler.close_connection = True
    over = threading.Event()

    def to_editor() -> None:
        try:
            while not over.is_set():
                piece = handler.rfile.read1(65536)
                if not piece:
                    break
                upstream.sendall(piece)
        except OSError:
            pass
        over.set()

    def to_browser() -> None:
        try:
            while not over.is_set():
                piece = upstream.recv(65536)
                if not piece:
                    break
                handler.connection.sendall(piece)
        except OSError:
            pass
        over.set()

    pumps = [
        threading.Thread(target=to_editor, daemon=True),
        threading.Thread(target=to_browser, daemon=True),
    ]
    for pump in pumps:
        pump.start()
    over.wait()
    try:
        upstream.close()
    except OSError:
        pass
    try:
        handler.connection.shutdown(socket.SHUT_RDWR)
    except OSError:
        pass




class Bridge(BaseHTTPRequestHandler):
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

    def do_GET(self) -> None:
        route = urllib.parse.urlparse(self.path).path
        if route == "/api/health":
            self._json(200, {"ok": True})
            return
        if route == "/ws/pty":
            query = urllib.parse.parse_qs(
                urllib.parse.urlparse(self.path).query
            )
            try:
                cols = int(query.get("cols", ["80"])[0])
                rows = int(query.get("rows", ["24"])[0])
            except ValueError:
                cols, rows = 80, 24
            stream_pty_session(self, cols, rows)
            return
        if route == "/ws/cdp":
            stream_browser_cdp(self)
            return
        if route == "/websockify":
            stream_browser_screen(self)
            return
        if (handler_upgrade := (self.headers.get("Upgrade") or "").lower()) and route.startswith("/vscode"):


            vscode_ws_splice(self)
            return
        if route.startswith("/vscode"):
            vscode_http_pass_through(self, "GET")
            return
        if route.startswith("/novnc/"):


            pass_through_novnc(self, route[len("/novnc"):] or "/")
            return
        if self.path == "/api/system/hardware":
            self._json(200, read_hardware())
            return
        if self.path == "/api/computer/status":



            info = inspect_container(CONTAINER_NAME)
            self._json(200, {
                "exists": info is not None,
                "running": bool(info and info.get("State", {}).get("Running")),
                "making": MAKING_RUNNING,
                "lines": len(MAKING.snapshot()),
                "name": CONTAINER_NAME,
            })
            return
        if self.path.startswith("/api/create/logs"):
            self.stream_logs()
            return
        if self.path.startswith("/api/fs"):
            self.explorer_fs()
            return
        if self.path.startswith("/api/media"):
            self.explorer_media()
            return
        if self.path.startswith("/api/file"):
            self.explorer_file_read()
            return
        if self.path.startswith("/api/disk"):
            self.explorer_disk()
            return
        if self.path.startswith("/api/vscode"):
            self.vscode_status()
            return
        if self.path.startswith("/api/screenshot"):
            self.agent_screenshot()
            return
        if self.path.startswith("/api/state"):
            self.agent_state()
            return
        if self.path.startswith("/api/token"):
            self.agent_token_show()
            return
        if self.path.startswith("/api/mcp/config"):
            self.agent_mcp_config()
            return
        if self.path.startswith("/api/mcp/status"):
            self.agent_mcp_status()
            return
        if self.path.startswith("/api/services"):
            self.services_read()
            return
        if self.path.startswith("/api/analyse"):
            self.agent_analyse()
            return
        self._json(404, {"error": "not found"})

    def do_POST(self) -> None:
        global MAKING_RUNNING
        route = urllib.parse.urlparse(self.path).path
        if route == "/api/mkdir":
            self.explorer_mkdir()
            return
        if route == "/api/upload":
            self.explorer_upload()
            return
        if route == "/api/delete":
            self.explorer_delete()
            return
        if route == "/api/exec":
            self.explorer_exec()
            return
        if route == "/v1/desktop" or route == "/api/desktop":
            self.agent_desktop()
            return
        if route == "/api/open-url":
            self.agent_open_url()
            return
        if route == "/api/token/reset":
            self.agent_token_reset()
            return
        if route == "/api/vscode/start":
            self.vscode_lifecycle("start", 90.0)
            return
        if route == "/api/vscode/stop":
            self.vscode_lifecycle("stop", 30.0)
            return
        if route == "/api/vscode":
            self.vscode_status()
            return
        if route.startswith("/vscode"):
            vscode_http_pass_through(self, "POST")
            return
        if route.startswith("/api/services/"):
            parts = route.split("/")
            self.services_write(parts[3] if len(parts) > 3 else "", parts[4] if len(parts) > 4 else "")
            return
        if route == "/api/mcp/start":
            self.agent_mcp_set(True)
            return
        if route == "/api/mcp/stop":
            self.agent_mcp_set(False)
            return
        if route != "/api/create":
            self._json(404, {"error": "not found"})
            return
        try:
            body = self._read_body()
        except Exception:
            self._json(400, {"error": "the body is not ours to read"})
            return

        values = {
            "name": str(body.get("name", "")).strip(),
            "username": str(body.get("username", "")).strip(),
            "password": str(body.get("password", "")),
            "country": str(body.get("country", "")),
            "language": str(body.get("language", "")),
            "timezone": str(body.get("timezone", "UTC")),
            "locale": LANGUAGE_LOCALES.get(str(body.get("language", "")), ""),
            "cpuCores": body.get("cpuCores"),
            "ramGb": body.get("ramGb"),
            "storageGb": body.get("storageGb"),
            "gpuPercent": body.get("gpuPercent", 0),
        }

        problems = []
        if not USERNAME_RULE.match(values["username"]):
            problems.append("the user name is not a Linux login")
        if len(values["password"]) < 8:
            problems.append("the password needs at least 8 characters")
        if not TIMEZONE_RULE.match(values["timezone"]):
            problems.append("the time zone is not a zone name")
        for key in ("cpuCores", "ramGb", "storageGb"):
            value = values[key]
            if not isinstance(value, (int, float)) or not isinstance(value, int) or value < 1:
                problems.append(f"{key} is missing")
        if problems:
            self._json(422, {"error": "; ".join(problems)})
            return

        values["hostname"] = re.sub(r"[^A-Za-z0-9.-]", "-", values["name"])[:63] or CONTAINER_NAME

        with MAKING_LOCK:
            if MAKING_RUNNING:
                self._json(409, {"error": "a computer is already being made"})
                return
            MAKING_RUNNING = True

        threading.Thread(target=make_computer, args=(values,), daemon=True).start()
        self._json(202, {"accepted": True, "logs": "/api/create/logs"})

    def stream_logs(self) -> None:

        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "close")
        self.end_headers()
        try:
            index = int(self.headers.get("Last-Event-ID", "0") or "0")
        except ValueError:
            index = 0
        try:
            while True:
                index, fresh = MAKING.wait_since(index, timeout=5.0)
                for number, line in enumerate(fresh, start=index - len(fresh)):
                    payload = json.dumps(line)
                    self.wfile.write(f"id: {number}\ndata: {payload}\n\n".encode())
                self.wfile.write(b": still here\n\n")
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            return



    def _read_body(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length) or b"{}")

    def _computer_guard(self) -> bool:

        reason = computer_not_running()
        if reason:
            self._json(503, {"detail": reason})
            return False
        return True

    def _ask_computer(
        self,
        command: list[str],
        timeout: float = 30.0,
        user: Optional[str] = None,
    ) -> Optional[tuple[int, str]]:

        try:
            return docker_exec_output(command, timeout=timeout, user=user)
        except (OSError, RuntimeError) as problem:
            self._json(503, {"detail": str(problem)})
            return None

    def explorer_fs(self) -> None:
        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        try:
            target = explorer_target(query.get("path", [""])[0])
        except ValueError as problem:
            self._json(400, {"detail": str(problem)})
            return
        if not self._computer_guard():
            return
        answer = self._ask_computer(
            ["python3", "-c", FOLDER_SCRIPT, target], timeout=20.0
        )
        if answer is None:
            return
        code, output = answer
        if code == 3:
            self._json(404, {"detail": "path does not exist"})
            return
        if code == 4:
            self._json(400, {"detail": "path is not a directory"})
            return
        if code == 5:
            self._json(403, {"detail": "the folder cannot be read"})
            return
        if code != 0:
            self._json(503, {"detail": output.strip() or "the folder cannot be read"})
            return
        try:
            entries = json.loads(output)
        except ValueError:
            self._json(503, {"detail": "the computer spoke an answer nobody could read"})
            return
        parent = os.path.dirname(target) if target != read_system_home() else None
        self._json(200, {"path": target, "parent": parent, "entries": entries})

    def explorer_file_read(self) -> None:







        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        try:
            target = explorer_target(query.get("path", [""])[0])
        except ValueError as problem:
            self._json(400, {"detail": str(problem)})
            return
        if not self._computer_guard():
            return
        answer = self._ask_computer(
            ["bash", "-c", 'test -f "$1" && test -r "$1"', "bash", target],
            timeout=20.0,
        )
        if answer is None:
            return
        if answer[0] != 0:
            self._json(404, {"detail": "the file does not exist or cannot be read"})
            return
        answer = self._ask_computer(["stat", "-c", "%s", target], timeout=20.0)
        if answer is None:
            return
        code, output = answer
        if code != 0 or not output.strip().isdigit():
            self._json(503, {"detail": "the computer did not report the file"})
            return
        if int(output.strip()) > MAX_TEXT_FILE_BYTES:
            self._json(413, {"detail": "the file is too heavy for the editor"})
            return
        answer = self._ask_computer(["base64", "-w0", target], timeout=90.0)
        if answer is None:
            return
        code, output = answer
        if code != 0:
            self._json(
                503,
                {"detail": output.strip()[:200] or "the file could not be read"},
            )
            return
        try:
            content = base64.b64decode(output.strip(), validate=True)
        except (ValueError, binascii.Error):
            self._json(503, {"detail": "the file did not travel whole"})
            return
        self._json(200, {
            "path": target,
            "content": content.decode("utf-8", "replace"),
            "size": len(content),
        })

    def explorer_media(self) -> None:







        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        try:
            target = explorer_target(query.get("path", [""])[0])
        except ValueError as problem:
            self._json(400, {"detail": str(problem)})
            return
        if not self._computer_guard():
            return
        answer = self._ask_computer(
            ["bash", "-c", 'test -f "$1" && test -r "$1"', "bash", target],
            timeout=20.0,
        )
        if answer is None:
            return
        if answer[0] != 0:
            self._json(404, {"detail": "the file does not exist or cannot be read"})
            return
        answer = self._ask_computer(["stat", "-c", "%s", target], timeout=20.0)
        if answer is None:
            return
        code, output = answer
        if code != 0 or not output.strip().isdigit():
            self._json(503, {"detail": "the computer did not report the file"})
            return
        size = int(output.strip())
        if size > MAX_MEDIA_BYTES:
            self._json(413, {"detail": "the file is too heavy for the viewer"})
            return
        answer = self._ask_computer(["base64", "-w0", target], timeout=120.0)
        if answer is None:
            return
        code, output = answer
        if code != 0:
            self._json(
                503,
                {"detail": output.strip()[:200] or "the file could not be read"},
            )
            return
        try:
            content = base64.b64decode(output.strip(), validate=True)
        except (ValueError, binascii.Error):
            self._json(503, {"detail": "the file did not travel whole"})
            return

        kind = MEDIA_TYPES.get(
            os.path.splitext(target)[1].lower(), "application/octet-stream"
        )
        start, end, status = 0, size - 1, 200
        header = self.headers.get("Range", "")
        if header.startswith("bytes="):
            part = header[len("bytes="):].split(",")[0].strip()
            first, _, last = part.partition("-")
            try:
                if first:
                    start = int(first)
                    end = int(last) if last else size - 1
                elif last:
                    start = max(0, size - int(last))
            except ValueError:
                start, end = 0, size - 1
            if start >= size or start > end:
                self.send_response(416)
                self.send_header("Content-Range", f"bytes */{size}")
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
            end = min(end, size - 1)
            status = 206

        body = content[start : end + 1]
        self.send_response(status)
        self.send_header("Content-Type", kind)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Accept-Ranges", "bytes")


        self.send_header("Cache-Control", "no-store")
        if status == 206:
            self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.end_headers()
        self.wfile.write(body)

    def explorer_disk(self) -> None:










        if not self._computer_guard():
            return


        answer = self._ask_computer(
            ["bash", "-lc",
             "du -sB1 /home /opt /usr /var /root 2>/dev/null | "
             "awk '{s+=$1} END {print s}'"],
            timeout=30.0, user="root",
        )
        if answer is None:
            return
        code, output = answer
        if code != 0 or not output.strip().isdigit():
            self._json(503, {"detail": "the computer did not report its disk"})
            return

        used_bytes = int(output.strip())
        total_bytes = int(read_system_storage_gb() * 1024**3)
        available_bytes = max(0, total_bytes - used_bytes)
        name = read_system_value("SYSTEM_NAME") or "Computer"
        self._json(200, {
            "name": f"{name} disk",
            "source": "quota",
            "total": total_bytes,
            "used": used_bytes,
            "available": available_bytes,
        })

    def explorer_mkdir(self) -> None:
        try:
            body = self._read_body()
        except Exception:
            self._json(400, {"detail": "the body is not ours to read"})
            return
        try:
            target = explorer_target(str(body.get("path", "")))
        except ValueError as problem:
            self._json(400, {"detail": str(problem)})
            return
        if not self._computer_guard():
            return
        answer = self._ask_computer(["mkdir", "-p", "--", target], timeout=20.0)
        if answer is None:
            return
        code, output = answer
        if code != 0:
            self._json(400, {"detail": output.strip() or "the folder could not be made"})
            return
        self._json(200, {"path": target})

    def explorer_delete(self) -> None:
        try:
            body = self._read_body()
        except Exception:
            self._json(400, {"detail": "the body is not ours to read"})
            return
        try:
            target = explorer_target(str(body.get("path", "")))
        except ValueError as problem:
            self._json(400, {"detail": str(problem)})
            return
        if target == read_system_home():
            self._json(400, {"detail": "the home folder cannot be removed"})
            return
        if not self._computer_guard():
            return
        answer = self._ask_computer(["rm", "-rf", "--", target], timeout=60.0)
        if answer is None:
            return
        code, output = answer
        if code != 0:
            self._json(400, {"detail": output.strip() or "the item could not be removed"})
            return
        self._json(200, {"path": target, "trashed": False})

    def explorer_upload(self) -> None:








        try:
            body = self._read_body()
        except Exception:
            self._json(400, {"detail": "the body is not ours to read"})
            return
        name = os.path.basename(str(body.get("name", "")).strip())
        if not name or name in (".", ".."):
            self._json(400, {"detail": "the file has no name"})
            return
        try:
            folder = explorer_target(str(body.get("dir", "")))
        except ValueError as problem:
            self._json(400, {"detail": str(problem)})
            return
        try:
            content = base64.b64decode(str(body.get("data", "")), validate=True)
        except (ValueError, binascii.Error):
            self._json(400, {"detail": "the file did not travel whole"})
            return
        if len(content) > MAX_UPLOAD_BYTES:
            self._json(413, {"detail": "the file is too heavy for one ask"})
            return
        if not self._computer_guard():
            return
        answer = self._ask_computer(
            ["bash", "-c", 'test -d "$1"', "bash", folder], timeout=20.0
        )
        if answer is None:
            return
        if answer[0] != 0:
            self._json(404, {"detail": "the folder does not exist"})
            return

        stem, suffix = os.path.splitext(name)
        target = f"{folder}/{name}"
        for index in range(1, 200):
            answer = self._ask_computer(
                ["bash", "-c", 'test -e "$1"', "bash", target], timeout=20.0
            )
            if answer is None:
                return
            if answer[0] != 0:
                break
            candidate = f"{stem} ({index}){suffix}"
            target = f"{folder}/{candidate}"

        handle = tempfile.NamedTemporaryFile(prefix="open-computer-upload-", delete=False)
        try:
            handle.write(content)
            handle.close()
            carried = subprocess.run(
                ["docker", "cp", handle.name, f"{CONTAINER_NAME}:{target}"],
                capture_output=True, text=True, timeout=180,
            )
            if carried.returncode != 0:
                self._json(
                    503,
                    {"detail": carried.stderr.strip()[:300] or "the file could not be written"},
                )
                return
        finally:
            try:
                os.unlink(handle.name)
            except OSError:
                pass

        owner = read_system_user()
        self._ask_computer(["chown", owner, target], timeout=20.0, user="root")
        self._json(200, {
            "path": target,
            "name": os.path.basename(target),
            "size": len(content),
        })

    def explorer_exec(self) -> None:
        try:
            body = self._read_body()
        except Exception:
            self._json(400, {"detail": "the body is not ours to read"})
            return
        command = str(body.get("command", "")).strip()
        if not command:
            self._json(400, {"detail": "command is empty"})
            return
        try:
            seconds = min(600.0, max(1.0, float(body.get("timeout", 60.0))))
        except (TypeError, ValueError):
            seconds = 60.0
        if not self._computer_guard():
            return


        answer = self._ask_computer(
            ["timeout", f"{int(seconds)}s", "/bin/bash", "-lc", command],
            timeout=seconds + 15.0,
        )
        if answer is None:
            return
        code, output = answer
        self._json(200, {"exit_code": code, "stdout": output, "stderr": ""})

    def agent_state(self) -> None:

        address = agent_guard(self)
        if address is None:
            return
        user = read_system_user()
        self._json(200, {
            "status": "running",
            "host": address,
            "user_home": f"/home/{user}",
            "novnc_url": f"http://{address}:{NOVNC_PORT}/vnc.html",
            "vnc_url": address,
            "novnc_port": NOVNC_PORT,
            "vnc_port": 5900,
        })

    def agent_screenshot(self) -> None:

        address = agent_guard(self)
        if address is None:
            return
        code, raw = docker_exec_output_raw(
            ["bash", "-lc",


             "stty raw -echo 2>/dev/null; "
             f"DISPLAY=:1 {PY_IN_COMPUTER} {API_SCRIPTS}/observe.py --png"],
            timeout=60.0, user=agent_user(),
        )
        if code != 0 or not raw.startswith(b"\x89PNG"):
            detail = raw[:200].decode("utf-8", "replace").strip()
            self._json(503, {"detail": detail or "the screen did not answer"})
            return
        self.send_response(200)
        self.send_header("Content-Type", "image/png")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def agent_desktop(self) -> None:

        try:
            body = self._read_body()
        except Exception:
            self._json(400, {"detail": "the body is not ours to read"})
            return
        address = agent_guard(self)
        if address is None:
            return

        steps = body.get("steps") or []
        if not isinstance(steps, list) or len(steps) > 24:
            self._json(400, {"detail": "the steps are not ours to read (1 to 24)"})
            return
        settle_ms = int(body.get("settleMs", 100) or 0)
        observe = bool(body.get("observe", True))

        script = screen_step_shell(steps, settle_ms)
        code, output = docker_exec_output(
            ["bash", "-lc", script], timeout=60.0, user=agent_user(),
        )
        if code != 0:
            self._json(503, {"detail": output.strip()[:300] or "the screen did not take the actions"})
            return

        observation = None
        if observe:
            obs_code, obs_output = docker_exec_output(
                ["bash", "-lc",
                 f"DISPLAY=:1 {PY_IN_COMPUTER} {API_SCRIPTS}/observe.py"],
                timeout=60.0, user=agent_user(),
            )
            if obs_code == 0:
                try:
                    observation = json.loads(obs_output)
                except ValueError:
                    observation = None

        self._json(200, {
            "completed": True,
            "steps": len(steps),
            "observation": observation,
        })

    def agent_open_url(self) -> None:

        try:
            body = self._read_body()
        except Exception:
            self._json(400, {"detail": "the body is not ours to read"})
            return
        url = str(body.get("url", "")).strip()
        if not url:
            self._json(400, {"detail": "url is empty"})
            return
        if not self._computer_guard():
            return
        quoted = "'" + url.replace("'", "'\\''") + "'"
        code, output = docker_exec_output(
            ["bash", "-lc", f"{CHROMIUM_OPEN} {quoted}"],
            timeout=60.0, user=agent_user(),
        )
        if code != 0:
            self._json(502, {"detail": output.strip()[:300] or "could not open the browser"})
            return
        self._json(200, {"url": url})

    def agent_token_show(self) -> None:

        self._json(200, {"token": read_agent_token()})

    def agent_token_reset(self) -> None:

        self._json(200, {"token": write_agent_token(), "reset": True})

    def agent_mcp_status(self) -> None:

        address = container_address()
        if address is None:
            self._json(200, {"running": False, "detail": "the computer does not exist"})
            return
        running = container_port_open(address, 7072, timeout=1.0)
        self._json(200, {"running": running, "port": 7072})

    def agent_mcp_set(self, wanted: bool) -> None:

        if not self._computer_guard():
            return
        code, output = docker_exec_output(
            ["bash", "/opt/open-computer/mcp/control.sh",
             "start" if wanted else "stop"],
            timeout=90.0,
            user="root",
        )
        if code != 0:
            self._json(503, {"detail": output.strip()[:300] or "the MCP server did not answer"})
            return
        address = container_address() or "127.0.0.1"
        self._json(200, {
            "running": container_port_open(address, 7072, timeout=1.0),
            "wanted": wanted,
        })

    def agent_mcp_config(self) -> None:

        token = read_agent_token()
        config = {
            "mcpServers": {
                "openagenthumencomputer": {
                    "command": "uv",
                    "args": [
                        "run",
                        "--directory",
                        str(ROOT),
                        "python",
                        "-m",
                        "core.tools.mcp.server",
                    ],
                    "env": {
                        "AGENT_HUMEN_COMPUTER_BASE_URL": f"http://127.0.0.1:{BRIDGE_PORT}",
                        "AGENT_HUMEN_COMPUTER_TOKEN": token,
                    },
                }
            }
        }
        self._json(200, {"config": json.dumps(config, indent=2), "token": token})

    def agent_analyse(self) -> None:

        if not self._computer_guard():
            return
        code, output = docker_exec_output(
            ["bash", "-lc",
             f"{PY_IN_COMPUTER} {API_SCRIPTS}/observe_analyse.py"],
            timeout=60.0, user="root",
        )
        if code != 0:
            self._json(503, {"detail": output.strip()[:300] or "the computer did not answer"})
            return
        try:
            self._json(200, json.loads(output))
        except ValueError:
            self._json(503, {"detail": "the computer spoke an answer nobody could read"})

    def vscode_status(self) -> None:

        address = container_address()
        if address is None:
            self._json(200, {"running": False, "detail": "the computer does not exist"})
            return
        self._json(200, {
            "running": vscode_running(address),
            "port": VSCODE_PORT,
        })

    def vscode_lifecycle(self, action: str, timeout: float) -> None:

        if action == "start" and not self._computer_guard():
            return
        report = vscode_control(action, timeout)
        self._json(200, report)

    def services_read(self) -> None:

        try:
            answer = subprocess.run(
                ["bash", str(CORE_SYSTEAM_DIR / "status.sh")],
                capture_output=True, text=True, timeout=30,
            )
        except (OSError, subprocess.SubprocessError) as problem:
            self._json(503, {"detail": f"the machine did not answer: {problem}"})
            return
        services = {}
        for line in answer.stdout.splitlines():
            name, _, state = line.partition(": ")
            if name.strip() in KNOWN_SERVICES:
                services[name.strip()] = state.strip()
        missing = [name for name in KNOWN_SERVICES if name not in services]
        for name in missing:
            services[name] = "off"
        self._json(200, {"services": services})

    def services_write(self, action: str, name: str) -> None:

        if action not in ("start", "stop", "restart"):
            self._json(400, {"detail": "the action is not ours to read"})
            return
        if name != "all" and name not in KNOWN_SERVICES:
            self._json(400, {"detail": f"unknown service: {name}"})
            return
        if name == "bridge" and action in ("stop", "restart"):


            self._json(200, {"accepted": True, "action": action, "service": name})
            subprocess.Popen(
                ["bash", str(CORE_SYSTEAM_DIR / "control.sh"), action, name],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                start_new_session=True,
            )
            return
        try:
            answer = subprocess.run(
                ["bash", str(CORE_SYSTEAM_DIR / "control.sh"), action, name],
                capture_output=True, text=True, timeout=180,
            )
        except (OSError, subprocess.SubprocessError) as problem:
            self._json(503, {"detail": f"the machine did not answer: {problem}"})
            return
        if answer.returncode != 0:
            self._json(
                503,
                {"detail": answer.stdout.strip() or answer.stderr.strip() or "the service did not answer"},
            )
            return
        self._json(200, {"accepted": True, "action": action, "service": name})

    def do_PUT(self) -> None:
        route = urllib.parse.urlparse(self.path).path
        if route != "/api/file":
            self._json(404, {"error": "not found"})
            return
        try:
            body = self._read_body()
        except Exception:
            self._json(400, {"detail": "the body is not ours to read"})
            return
        try:
            target = explorer_target(str(body.get("path", "")))
        except ValueError as problem:
            self._json(400, {"detail": str(problem)})
            return
        if not self._computer_guard():
            return
        content = str(body.get("content", ""))
        data = content.encode("utf-8")
        if len(data) > MAX_TEXT_FILE_BYTES:
            self._json(413, {"detail": "the file is too heavy for this window"})
            return


        try:
            code, output = docker_write_file(
                target, data, timeout=90.0, append=bool(body.get("append")),
            )
        except (OSError, RuntimeError) as problem:
            self._json(503, {"detail": str(problem)})
            return
        if code != 0:
            self._json(400, {"detail": output.strip() or "the file could not be written"})
            return
        self._json(200, {"path": target, "size": len(data)})


def main() -> None:
    server = ThreadingHTTPServer((BRIDGE_HOST, BRIDGE_PORT), Bridge)
    print(f"bridge: listening on http://{BRIDGE_HOST}:{BRIDGE_PORT}")
    print("bridge: the UI proxies /api here (vite.config.ts)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("bridge: stopped")


if __name__ == "__main__":
    main()
