#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/mcp.conf"

PY="/opt/python/current/bin/python3"
[[ -x "$PY" ]] || { echo "mcp: the Python of the computer is missing" >&2; exit 1; }

export MCP_TRANSPORT="$OPEN_COMPUTER_MCP_TRANSPORT"
export MCP_HOST="$OPEN_COMPUTER_MCP_HOST"
export MCP_PORT="$OPEN_COMPUTER_MCP_PORT"

cd "$HERE"
exec "$PY" "$HERE/mcp_server.py"
