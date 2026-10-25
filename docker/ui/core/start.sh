#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$HERE/app"
PORT="${OPEN_COMPUTER_UI_PORT:-1010}"
HOST="${OPEN_COMPUTER_UI_HOST:-0.0.0.0}"
REPO_URL="${OPEN_COMPUTER_UI_REPO:-https://github.com/nextceo-yeasinarafat/OpenAgentHumenComputer.git}"
REF="${OPEN_COMPUTER_UI_REF:-main}"

log() { printf 'ui: %s\n' "$*"; }

if [[ ! -d "$APP/.git" ]]; then
  log "cloning $REPO_URL into $APP"
  rm -rf "$APP"
  git clone --depth 1 --branch "$REF" "$REPO_URL" "$APP"
fi

cd "$APP"

if [[ ! -d node_modules ]]; then
  log "installing the packages (npm install)"
  npm install --include=dev --no-audit --no-fund
fi

if [[ ! -f dist/index.html ]]; then
  log "building the UI (npm run build)"
  npm run build
fi

log "serving $APP/dist and the bridge on $HOST:$PORT"

export OPEN_COMPUTER_DOCKER_DIR="$APP/docker"
export OPEN_COMPUTER_UI_DIST="$APP/dist"
export AGENT_HUMEN_COMPUTER_BRIDGE_HOST="$HOST"
export AGENT_HUMEN_COMPUTER_BRIDGE_PORT="$PORT"

exec python3 "$APP/core/server/bridge.py"
