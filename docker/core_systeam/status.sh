#!/usr/bin/env bash
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/core_systeam.conf"

port_open() {
  (echo > "/dev/tcp/127.0.0.1/$1") 2>/dev/null && return 0 || return 1
}

if pgrep -f "python3 core/server/bridge.py" >/dev/null 2>&1; then
  echo "bridge: on"
else
  echo "bridge: off"
fi

if docker container inspect "$AGENT_HUMEN_COMPUTER_CONTAINER" >/dev/null 2>&1; then
  state="$(docker inspect -f '{{.State.Running}}' "$AGENT_HUMEN_COMPUTER_CONTAINER" 2>/dev/null)"
  if [[ "$state" == "true" ]]; then
    echo "computer: on"
  else
    echo "computer: off"
  fi
else
  echo "computer: none"
fi

if [[ "$state" != "true" ]]; then
  echo "screen: off"
  echo "browser: off"
  echo "mcp: off"
  echo "vscode: off"
  exit 0
fi

for pair in "screen:6080" "browser:9222" "mcp:7072" "vscode:8989"; do
  name="${pair%%:*}"
  port="${pair##*:}"
  if docker exec "$AGENT_HUMEN_COMPUTER_CONTAINER" \
      bash -c "(echo > /dev/tcp/127.0.0.1/$port) 2>/dev/null"; then
    echo "$name: on"
  else
    echo "$name: off"
  fi
done
