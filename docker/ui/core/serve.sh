#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$HERE/app"
PORT="${OPEN_COMPUTER_UI_PORT:-1010}"
HOST="${OPEN_COMPUTER_UI_HOST:-0.0.0.0}"

[[ -f "$APP/dist/index.html" ]] || {
  echo "ui: no build in $APP/dist: run $HERE/start.sh (npm run build)" >&2
  exit 1
}

cd "$APP"
printf 'ui: serving %s and the bridge on %s:%s\n' "$APP/dist" "$HOST" "$PORT"
export OPEN_COMPUTER_UI_DIST="$APP/dist"
export AGENT_HUMEN_COMPUTER_BRIDGE_HOST="$HOST"
export AGENT_HUMEN_COMPUTER_BRIDGE_PORT="$PORT"
exec python3 "$APP/core/server/bridge.py"
