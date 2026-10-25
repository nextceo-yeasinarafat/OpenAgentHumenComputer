#!/usr/bin/env bash
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/core_systeam.conf"

say() { printf 'core: %s\n' "$*"; }

container_up() {
  docker start "$AGENT_HUMEN_COMPUTER_CONTAINER" >/dev/null 2>&1
}

start_service() {
  case "$1" in
    bridge)
      if pgrep -f "python3 core/server/bridge.py" >/dev/null 2>&1; then
        return 0
      fi
      local squatter
      squatter="$(ss -tlnp 2>/dev/null | grep ":$AGENT_HUMEN_COMPUTER_BRIDGE_PORT " | grep -oE "pid=[0-9]+" | cut -d= -f2 | head -1 || true)"
      [[ -n "$squatter" ]] && kill "$squatter" 2>/dev/null; sleep 0.5
      mkdir -p "$OPEN_COMPUTER_LOG_DIR"
      (
        cd "$AGENT_HUMEN_COMPUTER_HOME" || exit 1
        nohup python3 core/server/bridge.py >>"$BRIDGE_LOG" 2>&1 &
      )
      for _ in $(seq 1 30); do
        (echo > "/dev/tcp/127.0.0.1/$AGENT_HUMEN_COMPUTER_BRIDGE_PORT") 2>/dev/null && return 0
        sleep 0.3
      done
      return 1
      ;;
    computer)
      docker container inspect "$AGENT_HUMEN_COMPUTER_CONTAINER" >/dev/null 2>&1 || {
        say "the computer does not exist; make one from the page"
        return 1
      }
      container_up
      ;;
    screen|browser|mcp|vscode)
      local dir
      case "$1" in
        screen)  dir=/opt/open-computer/novnc ;;
        browser) dir=/opt/open-computer/chromium ;;
        mcp)     dir=/opt/open-computer/mcp ;;
        vscode)  dir=/opt/open-computer/vscode ;;
      esac
      docker exec "$AGENT_HUMEN_COMPUTER_CONTAINER" \
        bash -c "OPEN_COMPUTER_USER=openhume-computer \
                 OPEN_COMPUTER_USER_HOME=/home/openhume-computer \
                 bash $dir/control.sh start" >/dev/null 2>&1
      ;;
    *)
      return 1
      ;;
  esac
}

stop_service() {
  case "$1" in
    bridge)
      local pid
      pid="$(pgrep -f "python3 core/server/bridge.py" | head -1 || true)"
      [[ -n "$pid" ]] && kill "$pid" 2>/dev/null
      ;;
    computer)
      docker stop "$AGENT_HUMEN_COMPUTER_CONTAINER" >/dev/null 2>&1
      ;;
    screen|browser|mcp|vscode)
      local dir command=stop
      case "$1" in
        screen)  dir=/opt/open-computer/novnc ;;
        browser) dir=/opt/open-computer/chromium ;;
        mcp)     dir=/opt/open-computer/mcp ;;
        vscode)  dir=/opt/open-computer/vscode ;;
      esac
      [[ "$1" == "browser" ]] && command=sleep
      docker exec "$AGENT_HUMEN_COMPUTER_CONTAINER" \
        bash -c "bash $dir/control.sh $command" >/dev/null 2>&1
      ;;
    *)
      return 1
      ;;
  esac
}

action="${1:-}"
service="${2:-}"

if [[ -z "$action" || -z "$service" ]]; then
  echo "usage: control.sh {start|stop|restart} {bridge|computer|screen|browser|mcp|vscode|all}" >&2
  exit 2
fi

if [[ "$service" == "all" ]]; then
  if [[ "$action" == "restart" ]]; then
    for one in vscode browser screen mcp computer bridge; do
      stop_service "$one"
    done
  fi
  failed=""
  for one in bridge computer screen browser mcp vscode; do
    start_service "$one" || failed="$failed $one"
  done
  [[ -n "$failed" ]] && { say "did not come up:$failed"; exit 1; }
  say "everything is up"
  exit 0
fi

case "$action" in
  start)   start_service "$service" && say "$service is up" || { say "$service did not come up"; exit 1; } ;;
  stop)    stop_service "$service" && say "$service is down" ;;
  restart) stop_service "$service"; start_service "$service" && say "$service is new" || { say "$service did not come up"; exit 1; } ;;
  *) echo "usage: control.sh {start|stop|restart} <service>" >&2; exit 2 ;;
esac
