#!/usr/bin/env bash
set -uo pipefail

SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do
  TARGET="$(readlink "$SOURCE")"
  [[ "$TARGET" != /* ]] && TARGET="$(dirname "$SOURCE")/$TARGET"
  SOURCE="$TARGET"
done
HERE="$(cd "$(dirname "$SOURCE")" && pwd)"
source "$HERE/vscode.conf"

running_pid() {
  [[ -f "$VSCODE_PID_FILE" ]] || return 1
  local pid
  pid="$(cat "$VSCODE_PID_FILE" 2>/dev/null)"
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  printf '%s' "$pid"
}

wait_for_server() {
  local pid="$1"
  for _ in $(seq 1 60); do
    kill -0 "$pid" 2>/dev/null || return 1
    if curl -fs -o /dev/null -m 2 "http://127.0.0.1:$OPEN_COMPUTER_VSCODE_PORT$OPEN_COMPUTER_VSCODE_BASE_PATH"; then
      return 0
    fi
    sleep 0.5
  done
  return 1
}

start() {
  local pid
  if pid="$(running_pid)"; then
    echo "vscode: already running (pid $pid) on port $OPEN_COMPUTER_VSCODE_PORT"
    return 0
  fi

  mkdir -p "$OPEN_COMPUTER_LOG_DIR"
  setsid nohup "$HERE/run.sh" >>"$VSCODE_LOG" 2>&1 </dev/null &
  pid=$!
  echo "$pid" >"$VSCODE_PID_FILE"

  if wait_for_server "$pid"; then
    echo "vscode: started (pid $pid) on http://127.0.0.1:$OPEN_COMPUTER_VSCODE_PORT$OPEN_COMPUTER_VSCODE_BASE_PATH"
    return 0
  fi

  echo "vscode: the server did not come up; last lines of $VSCODE_LOG:" >&2
  tail -n 20 "$VSCODE_LOG" >&2 || true
  stop >/dev/null 2>&1
  return 1
}

stop() {
  local pid
  if ! pid="$(running_pid)"; then
    rm -f "$VSCODE_PID_FILE"
    echo "vscode: not running"
    return 0
  fi

  kill -TERM -"$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
  for _ in $(seq 1 20); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.5
  done
  if kill -0 "$pid" 2>/dev/null; then
    kill -KILL -"$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
  fi

  rm -f "$VSCODE_PID_FILE"
  echo "vscode: stopped"
}

status() {
  local pid
  if pid="$(running_pid)"; then
    echo "vscode: running (pid $pid) on http://127.0.0.1:$OPEN_COMPUTER_VSCODE_PORT$OPEN_COMPUTER_VSCODE_BASE_PATH"
  else
    echo "vscode: not running (port $OPEN_COMPUTER_VSCODE_PORT)"
  fi
  version
}

version() {
  if [[ -f "$VSCODE_SERVER_DIR/version" ]]; then
    echo "vscode: installed $(cat "$VSCODE_SERVER_DIR/version")"
  else
    echo "vscode: not installed"
  fi
}

logs() {
  mkdir -p "$OPEN_COMPUTER_LOG_DIR"
  touch "$VSCODE_LOG"
  tail -n 50 -f "$VSCODE_LOG"
}

case "${1:-status}" in
  start) start ;;
  stop) stop ;;
  restart) stop; start ;;
  status) status ;;
  version) version ;;
  logs) logs ;;
  *)
    echo "usage: $(basename "$0") {start|stop|restart|status|logs|version}" >&2
    exit 2
    ;;
esac
