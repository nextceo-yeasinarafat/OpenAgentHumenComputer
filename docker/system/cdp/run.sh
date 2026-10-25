#!/usr/bin/env bash
set -euo pipefail

SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do
  TARGET="$(readlink "$SOURCE")"
  [[ "$TARGET" != /* ]] && TARGET="$(dirname "$SOURCE")/$TARGET"
  SOURCE="$TARGET"
done
HERE="$(cd "$(dirname "$SOURCE")" && pwd)"
source "$HERE/cdp.conf"

command -v python3 >/dev/null 2>&1 || {
  echo "run.sh: python3 is missing" >&2
  exit 1
}

exec python3 "$HERE/cdp-forward.py" \
  "$OPEN_COMPUTER_CDP_FORWARD_PORT" "$OPEN_COMPUTER_CDP_BROWSER_PORT"
