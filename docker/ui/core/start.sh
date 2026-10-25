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
  log "installing the packages (bun install)"
  bun install
fi

if [[ ! -f dist/index.html ]]; then
  log "building the UI (bun run build)"
  bun run build
fi

log "serving $APP/dist on $HOST:$PORT"

export OPEN_COMPUTER_DOCKER_DIR="$APP/docker"
if [[ -f "$APP/core/server/bridge.py" ]]; then
  log "starting the bridge on 127.0.0.1:7071"
  nohup python3 "$APP/core/server/bridge.py" >>/tmp/openagenthumencomputer-bridge.log 2>&1 &
fi

exec bun x vite preview --host "$HOST" --port "$PORT" --strictPort
