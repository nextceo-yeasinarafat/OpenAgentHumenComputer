#!/usr/bin/env bash
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/mcp.conf"

PY="/opt/python/current/bin/python3"

server_pid() {
  [[ -f "$MCP_PID_FILE" ]] || return 1
  local pid
  pid="$(cat "$MCP_PID_FILE" 2>/dev/null)"
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  ps -o stat= -p "$pid" 2>/dev/null | grep -q Z && return 1
  printf '%s' "$pid"
}

port_open() {
  (echo > "/dev/tcp/127.0.0.1/$OPEN_COMPUTER_MCP_PORT") 2>/dev/null && return 0
  return 1
}

start() {
  local pid
  if pid="$(server_pid)"; then
    echo "mcp: already running (pid $pid)"
    return 0
  fi

  mkdir -p "$OPEN_COMPUTER_LOG_DIR"
  setsid nohup bash "$HERE/run.sh" >>"$MCP_LOG" 2>&1 </dev/null &
  echo $! >"$MCP_PID_FILE"

  for _ in $(seq 1 60); do
    port_open && {
      echo "mcp: started on $OPEN_COMPUTER_MCP_HOST:$OPEN_COMPUTER_MCP_PORT"
      return 0
    }
    sleep 0.3
  done

  echo "mcp: the server did not come up; last lines of $MCP_LOG:" >&2
  tail -n 15 "$MCP_LOG" >&2 || true
  return 1
}

stop() {
  local pid
  if ! pid="$(server_pid)"; then
    rm -f "$MCP_PID_FILE"
    echo "mcp: not running"
    return 0
  fi
  kill -TERM "$pid" 2>/dev/null || true
  for _ in $(seq 1 20); do
    server_pid >/dev/null 2>&1 || break
    sleep 0.2
  done
  server_pid >/dev/null 2>&1 && kill -KILL "$pid" 2>/dev/null || true
  rm -f "$MCP_PID_FILE"
  echo "mcp: stopped"
}

status() {
  local pid
  if pid="$(server_pid)"; then
    if port_open; then
      echo "mcp: running (pid $pid) on port $OPEN_COMPUTER_MCP_PORT"
    else
      echo "mcp: the process is there (pid $pid) but the port is not open yet"
    fi
  else
    port_open && echo "mcp: not ours, but port $OPEN_COMPUTER_MCP_PORT is open" \
      || echo "mcp: not running"
  fi
}

version() {
  "$PY" -c 'import importlib.metadata as md; print("mcp", md.version("mcp"))' 2>/dev/null \
    || echo "mcp: the SDK is not installed (run install.sh)"
}

case "${1:-status}" in
  start) start ;;
  stop) stop ;;
  restart) stop; start ;;
  status) status ;;
  version) version ;;
  *)
    echo "usage: $(basename "$0") {start|stop|restart|status|version}" >&2
    exit 2
    ;;
esac
