#!/usr/bin/env bash
set -uo pipefail

SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do
  TARGET="$(readlink "$SOURCE")"
  [[ "$TARGET" != /* ]] && TARGET="$(dirname "$SOURCE")/$TARGET"
  SOURCE="$TARGET"
done
HERE="$(cd "$(dirname "$SOURCE")" && pwd)"
source "$HERE/cdp.conf"

port_open() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") >/dev/null 2>&1
}

running_pid() {
  [[ -f "$CDP_PID_FILE" ]] || return 1
  local pid
  pid="$(cat "$CDP_PID_FILE" 2>/dev/null)"
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  printf '%s' "$pid"
}

wait_port() {
  local port="$1" tries="${2:-100}"
  for _ in $(seq 1 "$tries"); do
    port_open "$port" && return 0
    sleep 0.1
  done
  return 1
}

start() {
  local pid
  if port_open "$OPEN_COMPUTER_CDP_FORWARD_PORT"; then
    echo "cdp: already listening on $OPEN_COMPUTER_CDP_FORWARD_PORT"
    return 0
  fi

  mkdir -p "$OPEN_COMPUTER_LOG_DIR"
  nohup python3 "$HERE/cdp-forward.py" \
    "$OPEN_COMPUTER_CDP_FORWARD_PORT" "$OPEN_COMPUTER_CDP_BROWSER_PORT" \
    >>"$CDP_LOG" 2>&1 </dev/null &
  pid=$!
  echo "$pid" >"$CDP_PID_FILE"

  if wait_port "$OPEN_COMPUTER_CDP_FORWARD_PORT"; then
    echo "cdp: started (pid $pid): $OPEN_COMPUTER_CDP_FORWARD_PORT -> $OPEN_COMPUTER_CDP_BROWSER_PORT"
    return 0
  fi

  echo "cdp: the forwarder did not start; last lines of $CDP_LOG:" >&2
  tail -n 20 "$CDP_LOG" >&2 || true
  return 1
}

stop() {
  local pid
  if ! pid="$(running_pid)"; then
    rm -f "$CDP_PID_FILE"
    echo "cdp: not running"
    return 0
  fi

  kill -TERM "$pid" 2>/dev/null || true
  for _ in $(seq 1 20); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.1
  done
  kill -KILL "$pid" 2>/dev/null || true

  rm -f "$CDP_PID_FILE"
  echo "cdp: stopped"
}

live_version() {
  curl -fsS --max-time 3 \
    "http://127.0.0.1:$OPEN_COMPUTER_CDP_BROWSER_PORT/json/version" 2>/dev/null || return 1
}

status() {
  if port_open "$OPEN_COMPUTER_CDP_FORWARD_PORT"; then
    echo "cdp: forwarder listening on $OPEN_COMPUTER_CDP_FORWARD_PORT -> $OPEN_COMPUTER_CDP_BROWSER_PORT"
  else
    echo "cdp: forwarder not running"
  fi
  if port_open "$OPEN_COMPUTER_CDP_BROWSER_PORT"; then
    echo "cdp: browser DevTools on 127.0.0.1:$OPEN_COMPUTER_CDP_BROWSER_PORT"
  else
    echo "cdp: browser DevTools is not up"
  fi
  version
}

version() {
  if [[ -f "$HERE/version" ]]; then
    printf 'cdp: %s\n' "$(cat "$HERE/version")"
  else
    echo "cdp: forwarder not installed"
  fi
  local info
  if info="$(live_version)"; then
    printf 'cdp: browser %s\n' \
      "$(printf '%s' "$info" | sed -n 's/.*"Browser":"\([^"]*\)".*/\1/p')"
    printf 'cdp: protocol %s\n' \
      "$(printf '%s' "$info" | sed -n 's/.*"Protocol-Version":"\([^"]*\)".*/\1/p')"
  else
    echo "cdp: browser protocol version unavailable (browser not running)"
  fi
}

logs() {
  mkdir -p "$OPEN_COMPUTER_LOG_DIR"
  touch "$CDP_LOG"
  tail -n 50 -f "$CDP_LOG"
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
