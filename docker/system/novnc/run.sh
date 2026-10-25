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

die() { printf 'novnc: %s\n' "$*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || die "root is needed to start the screen"
[[ -f "$NOVNC_APP/vnc.html" ]] || die "noVNC is not installed; run $HERE/install.sh"
[[ -x "$WEBSOCKIFY" ]] || die "websockify is not installed; run $HERE/install.sh"

mkdir -p "$OPEN_COMPUTER_LOG_DIR"

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

if ! xdpyinfo -display "$DISPLAY" >/dev/null 2>&1; then
  rm -f "/tmp/.X${DISPLAY#:}-lock" "/tmp/.X11-unix/X${DISPLAY#:}" 2>/dev/null || true
  setsid nohup Xvfb "$DISPLAY" -screen 0 "$OPEN_COMPUTER_SCREEN" \
    -ac +extension RANDR +render -noreset \
    >>"$XVFB_LOG" 2>&1 &
  echo $! >"$XVFB_PID_FILE"

  ready=0
  for _ in $(seq 1 150); do
    if xdpyinfo -display "$DISPLAY" >/dev/null 2>&1; then
      ready=1
      break
    fi
    sleep 0.1
  done
  (( ready )) || die "the X server did not start; see $XVFB_LOG"
fi

DISPLAY="$DISPLAY" fbsetroot -solid "#000000" >/dev/null 2>&1 || true

if ! port_open "$OPEN_COMPUTER_VNC_PORT"; then
  setsid nohup x11vnc -display "$DISPLAY" -forever -shared -nopw \
    -rfbport "$OPEN_COMPUTER_VNC_PORT" -localhost -xkb -ncache 0 -noxdamage \
    >>"$X11VNC_LOG" 2>&1 &
  echo $! >"$X11VNC_PID_FILE"

  wait_port "$OPEN_COMPUTER_VNC_PORT" || {
    tail -n 20 "$X11VNC_LOG" >&2 || true
    die "the VNC server did not start"
  }
fi

if ! port_open "$OPEN_COMPUTER_NOVNC_PORT"; then
  setsid nohup "$WEBSOCKIFY" --heartbeat=10 --web="$NOVNC_APP" \
    "$OPEN_COMPUTER_BIND:$OPEN_COMPUTER_NOVNC_PORT" "127.0.0.1:$OPEN_COMPUTER_VNC_PORT" \
    >>"$NOVNC_LOG" 2>&1 &
  echo $! >"$WEBSOCKIFY_PID_FILE"

  wait_port "$OPEN_COMPUTER_NOVNC_PORT" || {
    tail -n 20 "$NOVNC_LOG" >&2 || true
    die "noVNC did not start"
  }
fi

printf 'novnc: screen ready on http://%s:%s/vnc.html (display %s)\n' \
  "$OPEN_COMPUTER_BIND" "$OPEN_COMPUTER_NOVNC_PORT" "$DISPLAY"
