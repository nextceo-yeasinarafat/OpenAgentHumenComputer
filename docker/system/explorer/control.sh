#!/usr/bin/env bash
set -uo pipefail

SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do
  TARGET="$(readlink "$SOURCE")"
  [[ "$TARGET" != /* ]] && TARGET="$(dirname "$SOURCE")/$TARGET"
  SOURCE="$TARGET"
done
HERE="$(cd "$(dirname "$SOURCE")" && pwd)"
source "$HERE/explorer.conf"

running_pid() {
  [[ -f "$EXPLORER_PID_FILE" ]] || return 1
  local pid
  pid="$(cat "$EXPLORER_PID_FILE" 2>/dev/null)"
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  printf '%s' "$pid"
}

window_count() {
  pgrep -u "$OPEN_COMPUTER_USER" -x "$OPEN_COMPUTER_EXPLORER_BIN" 2>/dev/null | wc -l | tr -d ' '
}

open() {
  local pid
  if pid="$(running_pid)"; then
    echo "explorer: already open (pid $pid)"
    return 0
  fi

  mkdir -p "$OPEN_COMPUTER_LOG_DIR"
  nohup "$HERE/run.sh" "$@" >>"$EXPLORER_LOG" 2>&1 </dev/null &
  pid=$!
  echo "$pid" >"$EXPLORER_PID_FILE"

  sleep 0.5
  if kill -0 "$pid" 2>/dev/null; then
    echo "explorer: opened (pid $pid) on $DISPLAY"
    return 0
  fi

  echo "explorer: the window did not open; last lines of $EXPLORER_LOG:" >&2
  tail -n 20 "$EXPLORER_LOG" >&2 || true
  rm -f "$EXPLORER_PID_FILE"
  return 1
}

close() {
  local pid
  if ! pid="$(running_pid)"; then
    rm -f "$EXPLORER_PID_FILE"
    echo "explorer: no window of this controller is open"
    return 0
  fi

  kill -TERM "$pid" 2>/dev/null || true
  for _ in $(seq 1 20); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.1
  done
  kill -KILL "$pid" 2>/dev/null || true

  rm -f "$EXPLORER_PID_FILE"
  echo "explorer: closed"
}

status() {
  local pid
  if pid="$(running_pid)"; then
    echo "explorer: open (pid $pid) on $DISPLAY"
  else
    echo "explorer: no window of this controller is open"
  fi
  echo "explorer: $OPEN_COMPUTER_EXPLORER_BIN windows on the desktop: $(window_count)"
  version
}

version() {
  if command -v "$OPEN_COMPUTER_EXPLORER_BIN" >/dev/null 2>&1; then
    printf 'explorer: installed %s\n' \
      "$("$OPEN_COMPUTER_EXPLORER_BIN" --version 2>&1 | head -n 1)"
  elif [[ -f "$HERE/version" ]]; then
    printf 'explorer: installed %s\n' "$(head -n 1 "$HERE/version")"
  else
    echo "explorer: not installed"
  fi
}

logs() {
  mkdir -p "$OPEN_COMPUTER_LOG_DIR"
  touch "$EXPLORER_LOG"
  tail -n 50 -f "$EXPLORER_LOG"
}

case "${1:-status}" in
  open) shift; open "$@" ;;
  close) close ;;
  restart) close; open ;;
  status) status ;;
  version) version ;;
  logs) logs ;;
  *)
    echo "usage: $(basename "$0") {open [path]|close|restart|status|logs|version}" >&2
    exit 2
    ;;
esac
