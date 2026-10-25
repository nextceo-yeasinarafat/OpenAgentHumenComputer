#!/usr/bin/env bash
set -uo pipefail

SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do
  TARGET="$(readlink "$SOURCE")"
  [[ "$TARGET" != /* ]] && TARGET="$(dirname "$SOURCE")/$TARGET"
  SOURCE="$TARGET"
done
HERE="$(cd "$(dirname "$SOURCE")" && pwd)"
source "$HERE/chromium.conf"


browser_pids() {
  local pid
  pgrep -f "remote-debugging-port=$OPEN_COMPUTER_CDP_PORT" 2>/dev/null | while read -r pid; do
    ps -o stat= -p "$pid" 2>/dev/null | grep -q Z || printf '%s\n' "$pid"
  done
}

browser_running() {
  [[ -n "$(browser_pids)" ]]
}

forwarder_pid() {
  [[ -f "$CDP_FORWARD_PID_FILE" ]] || return 1
  local pid
  pid="$(cat "$CDP_FORWARD_PID_FILE" 2>/dev/null)"
  [[ -n "$pid" ]] || return 1
  kill -0 "$pid" 2>/dev/null || return 1
  ps -o stat= -p "$pid" 2>/dev/null | grep -q Z && return 1
  printf '%s' "$pid"
}

wait_for_browser() {
  local pid="${1:-}"
  for _ in $(seq 1 100); do
    if curl -fs -o /dev/null -m 1 \
      "http://127.0.0.1:$OPEN_COMPUTER_CDP_PORT/json/version" 2>/dev/null; then
      return 0
    fi
    if [[ -n "$pid" ]] && ! kill -0 "$pid" 2>/dev/null && ! browser_running; then
      return 1
    fi
    sleep 0.2
  done
  return 1
}


start() {
  local url="${1:-}"
  local pids
  if pids="$(browser_pids)" && [[ -n "$pids" ]]; then
    echo "chromium: already running (pid $(printf '%s ' $pids | sed 's/ *$//'))"
    return 0
  fi

  rm -f "$ASLEEP_MARK"
  mkdir -p "$OPEN_COMPUTER_LOG_DIR" "$OPEN_COMPUTER_CHROMIUM_PROFILE"

  local args=()
  if [[ -n "$url" ]]; then
    args=("$url")
  elif compgen -G "$CHROMIUM_SESSIONS/*" >/dev/null; then
    args=(--restore)
  fi

  setsid nohup "$HERE/run.sh" "${args[@]}" >>"$CHROMIUM_LOG" 2>&1 </dev/null &
  local pid=$!
  echo "$pid" >"$CHROMIUM_PID_FILE"

  if wait_for_browser "$pid"; then
    echo "chromium: started (pid $pid), DevTools on 127.0.0.1:$OPEN_COMPUTER_CDP_PORT"
    return 0
  fi

  echo "chromium: the browser did not come up; last lines of $CHROMIUM_LOG:" >&2
  tail -n 20 "$CHROMIUM_LOG" >&2 || true
  return 1
}

stop() {
  local pids
  pids="$(browser_pids)"
  if [[ -z "$pids" ]]; then
    rm -f "$CHROMIUM_PID_FILE"
    echo "chromium: not running"
    return 0
  fi

  kill -TERM $pids 2>/dev/null || true
  for _ in $(seq 1 25); do
    [[ -z "$(browser_pids)" ]] && break
    sleep 0.2
  done

  pids="$(browser_pids)"
  if [[ -n "$pids" ]]; then
    kill -KILL $pids 2>/dev/null || true
  fi

  rm -f "$CHROMIUM_PID_FILE"
  echo "chromium: stopped"
}

wake() {
  rm -f "$ASLEEP_MARK"
  if [[ "$OPEN_COMPUTER_START_BROWSER" != "1" ]]; then
    return 0
  fi
  if browser_running; then
    echo "chromium: awake (already running)"
    return 0
  fi
  start
}

sleep_browser() {
  touch "$ASLEEP_MARK"
  stop
}

status() {
  local pids
  pids="$(browser_pids)"
  if [[ -n "$pids" ]]; then
    echo "chromium: running (pid $(printf '%s ' $pids | sed 's/ *$//'))"
  else
    echo "chromium: not running"
  fi
  echo "chromium: DevTools on 127.0.0.1:$OPEN_COMPUTER_CDP_PORT, forwarded on $OPEN_COMPUTER_CDP_FORWARD_PORT"
  if [[ -f "$ASLEEP_MARK" ]]; then
    echo "chromium: asleep (the sleep mark is set)"
  fi
  if compgen -G "$CHROMIUM_SESSIONS/*" >/dev/null; then
    echo "chromium: a session is kept, so the pinned tabs come back"
  fi
  version
}

version() {
  if command -v "$OPEN_COMPUTER_CHROMIUM_BIN" >/dev/null 2>&1; then
    printf 'chromium: installed %s\n' \
      "$("$OPEN_COMPUTER_CHROMIUM_BIN" --version 2>/dev/null | head -n 1)"
  elif [[ -f "$HERE/version" ]]; then
    printf 'chromium: installed %s\n' "$(head -n 1 "$HERE/version")"
  else
    echo "chromium: not installed"
  fi
}

logs() {
  mkdir -p "$OPEN_COMPUTER_LOG_DIR"
  touch "$CHROMIUM_LOG"
  tail -n 50 -f "$CHROMIUM_LOG"
}

forward_start() {
  local pid
  if pid="$(forwarder_pid)"; then
    echo "chromium: the DevTools forwarder is running (pid $pid) on $OPEN_COMPUTER_CDP_FORWARD_PORT"
    return 0
  fi

  if ! command -v python3 >/dev/null 2>&1; then
    echo "chromium: python3 is missing, the DevTools forwarder cannot start" >&2
    return 1
  fi

  mkdir -p "$OPEN_COMPUTER_LOG_DIR"
  setsid nohup python3 "$HERE/cdp-forward.py" \
    "$OPEN_COMPUTER_CDP_FORWARD_PORT" "$OPEN_COMPUTER_CDP_PORT" \
    >>"$CDP_FORWARD_LOG" 2>&1 </dev/null &
  pid=$!
  echo "$pid" >"$CDP_FORWARD_PID_FILE"
  echo "chromium: the DevTools forwarder started (pid $pid) on $OPEN_COMPUTER_CDP_FORWARD_PORT"
}

forward_stop() {
  local pid
  if ! pid="$(forwarder_pid)"; then
    rm -f "$CDP_FORWARD_PID_FILE"
    echo "chromium: the DevTools forwarder is not running"
    return 0
  fi
  kill -TERM -"$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
  rm -f "$CDP_FORWARD_PID_FILE"
  echo "chromium: the DevTools forwarder stopped"
}

supervise() {
  if [[ "$OPEN_COMPUTER_START_CDP_FORWARD" == "1" ]]; then
    forward_start >/dev/null 2>&1 || true
  fi

  rm -f "$ASLEEP_MARK"

  local last_start=0 now
  while true; do
    if [[ "$OPEN_COMPUTER_START_CDP_FORWARD" == "1" ]] && \
      ! forwarder_pid >/dev/null 2>&1; then
      forward_start >/dev/null 2>&1 || true
    fi

    if [[ "$OPEN_COMPUTER_START_BROWSER" == "1" ]] && \
      [[ ! -f "$ASLEEP_MARK" ]] && ! browser_running; then
      now="$(date +%s)"
      if (( now - last_start >= OPEN_COMPUTER_CHROMIUM_RESTART_DELAY )); then
        last_start=$now
        start >>"$CHROMIUM_LOG" 2>&1 || true
      fi
    fi

    sleep 1
  done
}

case "${1:-status}" in
  start) shift; start "$@" ;;
  stop) stop ;;
  restart) shift; stop; start "$@" ;;
  status) status ;;
  version) version ;;
  logs) logs ;;
  wake) wake ;;
  sleep) sleep_browser ;;
  forward) forward_start ;;
  forward-stop) forward_stop ;;
  supervise) supervise ;;
  *)
    echo "usage: $(basename "$0") {start [url]|stop|restart|status|logs|wake|sleep|forward|forward-stop|supervise|version}" >&2
    exit 2
    ;;
esac
