
from __future__ import annotations

import argparse
import json
from typing import Any

from mcp.server.mcpserver import MCPServer

from . import tools

mcp = MCPServer(
    name="OpenAgentHumenComputer",
    instructions=(
        "You are connected to a real Linux computer. Use 'terminal_exec' to run "
        "bash commands inside it, 'file_read' / 'file_write' / 'list_directory' "
        "for its files, and 'computer_state' / 'computer_disk' for its health. "
        "The screen and browser tools arrive when the bridge grows those "
        "endpoints; the tools say so honestly until then."
    ),
)


@mcp.tool()
def terminal_exec(command: str, timeout: float = 60.0) -> str:




    return json.dumps(tools.terminal_exec(command=command, timeout=timeout))


@mcp.tool()
def list_directory(path: str | None = None) -> str:

    return json.dumps(tools.list_directory(path))


@mcp.tool()
def file_read(path: str) -> str:

    return json.dumps(tools.file_read(path))


@mcp.tool()
def file_write(path: str, content: str, append: bool = False) -> str:

    return json.dumps(tools.file_write(path, content, append=append))


@mcp.tool()
def computer_state() -> str:

    return json.dumps(tools.computer_state())


@mcp.tool()
def computer_disk() -> str:

    return json.dumps(tools.computer_disk())


@mcp.tool()
def browser_open(url: str) -> str:

    return json.dumps(tools.browser_open(url))


@mcp.tool()
def browser_search(query: str) -> str:

    return json.dumps(tools.browser_search(query))


@mcp.tool()
def computer_observe() -> str:

    return json.dumps(tools.computer_observe())


@mcp.tool()
def computer_act(actions: list[dict[str, Any]], settle_ms: int = 100) -> str:

    return json.dumps(tools.computer_act(actions, settle_ms=settle_ms))


def main() -> None:
    parser = argparse.ArgumentParser(description="OpenAgentHumenComputer MCP server")
    parser.add_argument(
        "--transport",
        choices=["stdio", "sse", "streamable-http"],
        default="stdio",
        help="how the AI client reaches this server (default: stdio)",
    )
    parser.add_argument(
        "--host", default="127.0.0.1", help="bind address for sse / streamable-http"
    )
    parser.add_argument(
        "--port", type=int, default=7072, help="port for sse / streamable-http"
    )
    args = parser.parse_args()

    if args.transport == "stdio":
        mcp.run(transport="stdio")
    else:
        mcp.run(transport=args.transport, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
