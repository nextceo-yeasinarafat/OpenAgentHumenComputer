#!/usr/bin/env bash
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/core_systeam.conf"

PID_FILE="$OPEN_COMPUTER_LOG_DIR/core-recover.pid"
LOG_FILE="$OPEN_COMPUTER_LOG_DIR/core-recover.log"
HEARTBEAT_S="${CORE_RECOVER_HEARTBEAT_S:-5}"

say() { printf 'recover: %s\n' "$*"; }

is_running() {
  [[ -f "$PID_FILE" ]] || return 1
  local pid
  pid="$(cat "$PID_FILE" 2>/dev/null)"
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  ps -o stat= -p "$pid" 2>/dev/null | grep -q Z && return 1
  printf '%s' "$pid"
}

watch() {
  say "the watchman is awake (every ${HEARTBEAT_S}s)"
  while true; do
    bash "$HERE/control.sh" start computer >/dev/null 2>&1 || true
    bash "$HERE/control.sh" start bridge >/dev/null 2>&1 || true
    sleep "$HEARTBEAT_S"
  done
}

case "${1:-status}" in
  start)
    if is_running >/dev/null; then
      say "already running (pid $(cat "$PID_FILE"))"
      exit 0
    fi
    mkdir -p "$OPEN_COMPUTER_LOG_DIR"
    setsid nohup bash "$HERE/recover.sh" _watch >>"$LOG_FILE" 2>&1 </dev/null &
    echo $! >"$PID_FILE"
    say "started (pid $(cat "$PID_FILE"))"
    ;;
  stop)
    if is_running >/dev/null; then
      kill "$(cat "$PID_FILE")" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
    say "stopped"
    ;;
  status)
    if is_running >/dev/null; then
      echo "recover: running (pid $(cat "$PID_FILE"))"
    elif systemctl --user is-active --quiet core-systeam.service 2>/dev/null; then
      echo "recover: running (systemd: core-systeam)"
    else
      echo "recover: not running"
    fi
    ;;
  _watch)
    watch
    ;;
  *)
    echo "usage: recover.sh {start|stop|status}" >&2
    exit 2
    ;;
esac
