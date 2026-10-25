
from __future__ import annotations

import base64
import json
import os
import socket
import subprocess
from pathlib import Path

from mcp.server.mcpserver import MCPServer

mcp = MCPServer(
    name="open-computer",
    instructions=(
        "You are on a real Linux computer. Run bash commands with "
        "'terminal_exec', read and write its files with the file tools, and "
        "ask 'computer_info' for what this machine is."
    ),
)


def _record() -> dict:

    record = {"hostname": socket.gethostname()}
    env_file = Path("/etc/open-computer/computer.env")
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            key, _, value = line.partition("=")
            if key.strip():
                record[key.strip().lower()] = value.strip()
    return record


@mcp.tool()
def terminal_exec(command: str, timeout: float = 60.0) -> str:

    trimmed = command.strip()
    if not trimmed:
        return json.dumps({"error": "a command is needed"})
    try:
        finished = subprocess.run(
            ["/bin/bash", "-lc", trimmed],
            capture_output=True,
            text=True,
            timeout=timeout,
        )
    except subprocess.TimeoutExpired:
        return json.dumps({
            "error": f"the command did not end within {int(timeout)} seconds",
            "exit_code": 124,
        })
    return json.dumps({
        "exit_code": finished.returncode,
        "stdout": finished.stdout,
        "stderr": finished.stderr,
    })


@mcp.tool()
def file_read(path: str) -> str:

    try:
        data = Path(path).read_bytes()
    except FileNotFoundError:
        return json.dumps({"error": "the file is not there", "path": path})
    except PermissionError:
        return json.dumps({"error": "the file cannot be read", "path": path})
    try:
        content = data.decode("utf-8")
        binary = False
    except UnicodeDecodeError:
        content = base64.b64encode(data).decode("ascii")
        binary = True
    return json.dumps({
        "path": path,
        "content": content,
        "binary": binary,
        "size": len(data),
    })


@mcp.tool()
def file_write(path: str, content: str, append: bool = False) -> str:

    target = Path(path)
    try:
        if append:
            with target.open("a", encoding="utf-8") as handle:
                handle.write(content)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
    except PermissionError:
        return json.dumps({"error": "the file cannot be written", "path": path})
    except OSError as problem:
        return json.dumps({"error": str(problem), "path": path})
    return json.dumps({"path": path, "size": len(content.encode("utf-8"))})


@mcp.tool()
def list_directory(path: str = ".") -> str:

    try:
        names = sorted(os.listdir(path))
    except FileNotFoundError:
        return json.dumps({"error": "the folder is not there", "path": path})
    except NotADirectoryError:
        return json.dumps({"error": "the path is not a folder", "path": path})
    entries = []
    for name in names:
        full = os.path.join(path, name)
        info = os.stat(full, follow_symlinks=False)
        entries.append({
            "name": name,
            "is_dir": os.path.isdir(full),
            "size": info.st_size,
            "modified": int(info.st_mtime),
        })
    return json.dumps({"path": path, "entries": entries})


@mcp.tool()
def computer_info() -> str:

    return json.dumps(_record())


if __name__ == "__main__":


    mcp.run(
        transport=os.environ.get("MCP_TRANSPORT", "streamable-http"),
        host=os.environ.get("MCP_HOST", "0.0.0.0"),
        port=int(os.environ.get("MCP_PORT", "7072")),
    )
