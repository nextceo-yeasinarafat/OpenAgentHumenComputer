#!/usr/bin/env bash
set -uo pipefail

SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do
  TARGET="$(readlink "$SOURCE")"
  [[ "$TARGET" != /* ]] && TARGET="$(dirname "$SOURCE")/$TARGET"
  SOURCE="$TARGET"
done
HERE="$(cd "$(dirname "$SOURCE")" && pwd)"
source "$HERE/gestures.conf"

CHROMIUM_CONF="/opt/open-computer/chromium/chromium.conf"
MARK="OPEN_COMPUTER_CHROMIUM_EXTRA_ARGS"

case "${1:-status}" in
  apply)
    [[ -f "$CHROMIUM_CONF" ]] || {
      echo "gestures: the settings of the browser are not there" >&2
      exit 1
    }
    if grep -q "^: \"\${${MARK}:=" "$CHROMIUM_CONF"; then
      echo "gestures: already applied"
      exit 0
    fi
    printf '\n# The gestures of the browser (docker/system/gestures).\n: "${%s:=%s}"\n' \
      "$MARK" "$GESTURES_CHROMIUM_EXTRA_ARGS" >>"$CHROMIUM_CONF"
    echo "gestures: applied — the browser is restarted to take the word"
    ;;
  status)
    if grep -q "^: \"\${${MARK}:=" "$CHROMIUM_CONF" 2>/dev/null; then
      echo "gestures: applied ($GESTURES_CHROMIUM_EXTRA_ARGS)"
    else
      echo "gestures: not applied"
    fi
    ;;
  *)
    echo "usage: $(basename "$0") {apply|status}" >&2
    exit 2
    ;;
esac
