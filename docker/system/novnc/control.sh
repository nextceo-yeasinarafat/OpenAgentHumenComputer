#!/usr/bin/env bash
set -uo pipefail

SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do
  TARGET="$(readlink "$SOURCE")"
  [[ "$TARGET" != /* ]] && TARGET="$(dirname "$SOURCE")/$TARGET"
  SOURCE="$TARGET"
done
HERE="$(cd "$(dirname "$SOURCE")" && pwd)"
source "$HERE/novnc.conf"

port_open() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") >/dev/null 2>&1
}

wait_port() {
  local port="$1" tries="${2:-150}"
  for _ in $(seq 1 "$tries"); do
    port_open "$port" && return 0
    sleep 0.1
  done
  return 1
}

start() {
  if port_open "$OPEN_COMPUTER_NOVNC_PORT"; then
    echo "novnc: already running on port $OPEN_COMPUTER_NOVNC_PORT"
    return 0
  fi

  mkdir -p "$OPEN_COMPUTER_LOG_DIR"
  nohup "$HERE/run.sh" >>"$NOVNC_LOG" 2>&1 </dev/null &
  local pid=$!

  if wait_port "$OPEN_COMPUTER_NOVNC_PORT"; then
    echo "novnc: started (pid $pid) on http://$OPEN_COMPUTER_BIND:$OPEN_COMPUTER_NOVNC_PORT/vnc.html"
    return 0
  fi

  echo "novnc: the screen did not start; last lines of $NOVNC_LOG:" >&2
  tail -n 20 "$NOVNC_LOG" >&2 || true
  return 1
}

stop_one() {
  local name="$1" file="$2" pid
  [[ -f "$file" ]] || return 0
  pid="$(cat "$file" 2>/dev/null)"
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    kill -TERM "$pid" 2>/dev/null || true
    for _ in $(seq 1 20); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.1
    done
    kill -KILL "$pid" 2>/dev/null || true
    echo "novnc: stopped $name (pid $pid)"
  fi
  rm -f "$file"
}

stop() {
  stop_one websockify "$WEBSOCKIFY_PID_FILE"
  stop_one x11vnc "$X11VNC_PID_FILE"
  stop_one fluxbox "$FLUXBOX_PID_FILE"
  stop_one xvfb "$XVFB_PID_FILE"
}

status() {
  if port_open "$OPEN_COMPUTER_NOVNC_PORT"; then
    echo "novnc: running on http://$OPEN_COMPUTER_BIND:$OPEN_COMPUTER_NOVNC_PORT/vnc.html"
  else
    echo "novnc: not running"
  fi
  if port_open "$OPEN_COMPUTER_VNC_PORT"; then
    echo "novnc: VNC server on 127.0.0.1:$OPEN_COMPUTER_VNC_PORT"
  else
    echo "novnc: no VNC server"
  fi
  if xdpyinfo -display "$DISPLAY" >/dev/null 2>&1; then
    echo "novnc: display $DISPLAY is up ($(xdpyinfo -display "$DISPLAY" | awk '/dimensions:/{print $2; exit}'))"
  else
    echo "novnc: display $DISPLAY is not up"
  fi
  version
}

logs() {
  mkdir -p "$OPEN_COMPUTER_LOG_DIR"
  touch "$NOVNC_LOG"
  tail -n 100 -f "$NOVNC_LOG"
}

version() {
  if [[ -f "$HERE/version" ]]; then
    sed 's/^/novnc: /' "$HERE/version"
  else
    echo "novnc: not installed"
  fi
}

case "${1:-status}" in
  start) start ;;
  stop) stop ;;
  restart) stop; start ;;
  status) status ;;
  logs) logs ;;
  version) version ;;
  *)
    echo "usage: $(basename "$0") {start|stop|restart|status|logs|version}" >&2
    exit 2
    ;;
esac
