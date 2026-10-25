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
URL=""
for arg in "$@"; do
  case "$arg" in
    --restore) RESTORE=1 ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    -*)
      echo "run.sh: unknown argument: $arg" >&2
      exit 2
      ;;
    *) URL="$arg" ;;
  esac
done

if [[ -n "$URL" && ! "$URL" =~ ^[a-zA-Z][a-zA-Z0-9+.-]*: && "$URL" != "about:"* ]]; then
  URL="https://$URL"
fi

if (( RESTORE )); then
  OPEN_ARGS=(--restore-last-session)
elif [[ -n "$URL" ]]; then
  OPEN_ARGS=("$URL")
else
  OPEN_ARGS=("$OPEN_COMPUTER_CHROMIUM_URL")
fi

if ! command -v "$OPEN_COMPUTER_CHROMIUM_BIN" >/dev/null 2>&1; then
  echo "run.sh: $OPEN_COMPUTER_CHROMIUM_BIN is not installed" >&2
  echo "run.sh: install it with $HERE/install.sh" >&2
  exit 1
fi

mkdir -p "$OPEN_COMPUTER_CHROMIUM_PROFILE" "$OPEN_COMPUTER_LOG_DIR"
if [[ "$(id -u)" -eq 0 ]]; then
  chown -R "$OPEN_COMPUTER_USER:$OPEN_COMPUTER_USER" \
    "$OPEN_COMPUTER_CHROMIUM_PROFILE" 2>/dev/null || true
fi

CHROMIUM_ARGS=(
  --no-first-run
  --no-default-browser-check
  --disable-dev-shm-usage
  --noerrdialogs
  --hide-crash-restore-bubble
  --disable-notifications
  --default-background-color=0E0E0EFF
  --force-dark-mode
  --remote-debugging-address=127.0.0.1
  --remote-debugging-port="$OPEN_COMPUTER_CDP_PORT"
  --force-device-scale-factor="$OPEN_COMPUTER_CHROMIUM_SCALE"
  --user-data-dir="$OPEN_COMPUTER_CHROMIUM_PROFILE"
  --window-position="$OPEN_COMPUTER_CHROMIUM_WINDOW_POSITION"
  --window-size="$OPEN_COMPUTER_CHROMIUM_WINDOW_SIZE"
  "${OPEN_ARGS[@]}"
  ${OPEN_COMPUTER_CHROMIUM_EXTRA_ARGS:-}
)

if [[ "$(id -u)" -eq 0 ]] && id "$OPEN_COMPUTER_USER" >/dev/null 2>&1; then
  exec runuser -u "$OPEN_COMPUTER_USER" -- \
    env DISPLAY="$DISPLAY" \
    GTK_THEME="Adwaita:dark" \
    HOME="$OPEN_COMPUTER_USER_HOME" \
    "$OPEN_COMPUTER_CHROMIUM_BIN" "${CHROMIUM_ARGS[@]}"
fi

exec env DISPLAY="$DISPLAY" GTK_THEME="Adwaita:dark" \
  "$OPEN_COMPUTER_CHROMIUM_BIN" "${CHROMIUM_ARGS[@]}"
