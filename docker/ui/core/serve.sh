#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$HERE/app"
PORT="${OPEN_COMPUTER_UI_PORT:-1010}"
HOST="${OPEN_COMPUTER_UI_HOST:-0.0.0.0}"

[[ -f "$APP/dist/index.html" ]] || {
  echo "ui: no build in $APP/dist: run $HERE/start.sh (bun run build)" >&2
  exit 1
}

cd "$APP"
printf 'ui: serving %s on %s:%s\n' "$APP/dist" "$HOST" "$PORT"
exec bun x vite preview --host "$HOST" --port "$PORT" --strictPort
