#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="$HERE/app"
REF="${OPEN_COMPUTER_UI_REF:-main}"

log() { printf 'ui: %s\n' "$*"; }
die() { printf 'ui: %s\n' "$*" >&2; exit 1; }

[[ -d "$APP/.git" ]] || die "no checkout in $APP: start.sh clones one on boot"

cd "$APP"

before="$(git rev-parse --short HEAD)"
log "fetching $REF"
git fetch --depth 1 origin "$REF"
git reset --hard "origin/$REF" >/dev/null

after="$(git rev-parse --short HEAD)"
if [[ "$before" == "$after" ]]; then
  log "already at $after"
else
  log "updated: $before -> $after"
fi

log "installing the packages (bun install)"
bun install

log "building the UI (bun run build)"
bun run build

"$HERE/status.py" || true

log "restart the container to serve the new build: docker restart openagenthumencomputer"
