#!/usr/bin/env bash
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/auth.conf"

PY="${AUTH_PYTHON:-/opt/python/current/bin/python3}"

server_pid() {
  [[ -f "$AUTH_PID_FILE" ]] || return 1
  local pid
  pid="$(cat "$AUTH_PID_FILE" 2>/dev/null)"
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  ps -o stat= -p "$pid" 2>/dev/null | grep -q Z && return 1
  printf '%s' "$pid"
}

port_open() {
  (echo > "/dev/tcp/127.0.0.1/$AUTH_PORT") 2>/dev/null && return 0
  return 1
}

start() {
  local pid
  if pid="$(server_pid)"; then
    echo "auth: already running (pid $pid)"
    return 0
  fi

  mkdir -p "$OPEN_COMPUTER_LOG_DIR"
  setsid nohup runuser -u "${AUTH_USER:-open-computer}" -- \
    env HOME="${AUTH_HOME:-/home/${AUTH_USER:-open-computer}}" AUTH_PORT="$AUTH_PORT" \
    "$PY" "$HERE/auth_service.py" >>"$AUTH_LOG" 2>&1 </dev/null &
  echo $! >"$AUTH_PID_FILE"

  for _ in $(seq 1 40); do
    port_open && { echo "auth: started on 127.0.0.1:$AUTH_PORT"; return 0; }
    sleep 0.3
  done

  echo "auth: the service did not come up; last lines of $AUTH_LOG:" >&2
  tail -n 15 "$AUTH_LOG" >&2 || true
  return 1
}

stop() {
  local pid
  if ! pid="$(server_pid)"; then
    rm -f "$AUTH_PID_FILE"
    echo "auth: not running"
    return 0
  fi
  kill -TERM "$pid" 2>/dev/null || true
  for _ in $(seq 1 20); do
    server_pid >/dev/null 2>&1 || break
    sleep 0.2
  done
  server_pid >/dev/null 2>&1 && kill -KILL "$pid" 2>/dev/null || true
  rm -f "$AUTH_PID_FILE"
  echo "auth: stopped"
}

status() {
  local pid
  if pid="$(server_pid)"; then
    port_open && echo "auth: running (pid $pid) on port $AUTH_PORT" \
      || echo "auth: the process is there (pid $pid) but the port is not open yet"
  else
    port_open && echo "auth: not ours, but port $AUTH_PORT is open" || echo "auth: not running"
  fi
}

case "${1:-status}" in
  start) start ;;
  stop) stop ;;
  restart) stop; start ;;
  status) status ;;
  *)
    echo "usage: $(basename "$0") {start|stop|restart|status}" >&2
    exit 2
    ;;
esac
