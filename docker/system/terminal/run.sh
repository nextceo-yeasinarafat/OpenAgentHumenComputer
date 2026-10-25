#!/usr/bin/env bash
set -uo pipefail

SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do
  TARGET="$(readlink "$SOURCE")"
  [[ "$TARGET" != /* ]] && TARGET="$(dirname "$SOURCE")/$TARGET"
  SOURCE="$TARGET"
done
HERE="$(cd "$(dirname "$SOURCE")" && pwd)"
source "$HERE/terminal.conf"

if ! command -v "$OPEN_COMPUTER_TERMINAL_BIN" >/dev/null 2>&1; then
  echo "run.sh: $OPEN_COMPUTER_TERMINAL_BIN is not installed" >&2
  echo "run.sh: install it with $HERE/install.sh" >&2
  exit 1
fi

mkdir -p "$OPEN_COMPUTER_LOG_DIR"

if [[ "$(id -u)" -eq 0 ]] && id "$OPEN_COMPUTER_USER" >/dev/null 2>&1; then
  exec runuser -u "$OPEN_COMPUTER_USER" -- \
    env DISPLAY="$DISPLAY" HOME="$OPEN_COMPUTER_USER_HOME" TERM=xterm-256color \
    "$OPEN_COMPUTER_TERMINAL_BIN" -ls "$@"
fi

exec env DISPLAY="$DISPLAY" TERM=xterm-256color "$OPEN_COMPUTER_TERMINAL_BIN" -ls "$@"
