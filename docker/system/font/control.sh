#!/usr/bin/env bash
set -euo pipefail

SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do
  TARGET="$(readlink "$SOURCE")"
  [[ "$TARGET" != /* ]] && TARGET="$(dirname "$SOURCE")/$TARGET"
  SOURCE="$TARGET"
done
HERE="$(cd "$(dirname "$SOURCE")" && pwd)"
source "$HERE/font.conf"

cmd="${1:-status}"
shift || true

case "$cmd" in
  start|install)
    "$HERE/install.sh" "$@"
    ;;
  stop)
    echo "font: nothing to stop (fonts are installed)"
    ;;
  restart)
    "$HERE/install.sh" --force "$@"
    ;;
  status)
    echo "font dir: $OPEN_COMPUTER_FONT_DIR"
    if [[ -d "$OPEN_COMPUTER_FONT_DIR" ]]; then
      ls -1 "$OPEN_COMPUTER_FONT_DIR" | wc -l | xargs echo "files:"
    else
      echo "files: 0 (not installed)"
    fi
    if command -v fc-list >/dev/null 2>&1; then
      fc-list | grep -E "Anthropic|NotoSerifBengali" | head -2 || true
    fi
    ;;
  logs)
    echo "font: no persistent logs"
    ;;
  version)
    if [[ -f "$HERE/version" ]]; then
      cat "$HERE/version"
    elif [[ -f "$OPEN_COMPUTER_FONT_DIR/.version" ]]; then
      cat "$OPEN_COMPUTER_FONT_DIR/.version"
    else
      echo "unknown"
    fi
    ;;
  *)
    echo "usage: $(basename "$0") {start|stop|restart|status|logs|version}" >&2
    exit 2
    ;;
esac
