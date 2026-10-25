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

RESTORE=0
case "${1:-}" in
  --restore) RESTORE=1 ;;
  -h|--help)
    printf 'usage: %s [--force]\n' "$(basename "$0")"
    exit 0
    ;;
esac

URL="${1:-$OPEN_COMPUTER_CHROMIUM_URL}"

if [[ "$URL" != "about:"* && ! "$URL" =~ ^[a-zA-Z][a-zA-Z0-9+.-]*: ]]; then
  URL="https://$URL"
fi

browser_running() {
  pgrep -f "remote-debugging-port=$OPEN_COMPUTER_CDP_PORT" >/dev/null 2>&1
}

if browser_running; then
  if (( RESTORE )); then
    exit 0
  fi
  if curl -s --max-time 3 -X PUT \
    "http://127.0.0.1:$OPEN_COMPUTER_CDP_PORT/json/new?$URL" >/dev/null 2>&1; then
    exit 0
  fi
fi

mkdir -p "$OPEN_COMPUTER_LOG_DIR"

LOG="$CHROMIUM_LOG"
if [[ -e "$LOG" && ! -w "$LOG" ]]; then
  LOG="${TMPDIR:-/tmp}/open-computer-chromium-$(id -u).log"
fi

if (( RESTORE )); then
  setsid nohup "$HERE/run.sh" --restore >>"$LOG" 2>&1 </dev/null &
else
  setsid nohup "$HERE/run.sh" "$URL" >>"$LOG" 2>&1 </dev/null &
fi
exit 0
