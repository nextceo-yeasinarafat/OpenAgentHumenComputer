#!/usr/bin/env bash
set -euo pipefail

SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do
  TARGET="$(readlink "$SOURCE")"
  [[ "$TARGET" != /* ]] && TARGET="$(dirname "$SOURCE")/$TARGET"
  SOURCE="$TARGET"
done
HERE="$(cd "$(dirname "$SOURCE")" && pwd)"
source "$HERE/vscode.conf"

BIN="$VSCODE_SERVER_DIR/bin/code-server"
if [[ ! -x "$BIN" ]]; then
  echo "run.sh: the VS Code Server is not installed in $VSCODE_SERVER_DIR" >&2
  echo "run.sh: install it with $HERE/install.sh" >&2
  exit 1
fi

mkdir -p "$VSCODE_SERVER_DATA" "$OPEN_COMPUTER_LOG_DIR"

if [[ "$(id -u)" -eq 0 ]] && id "$OPEN_COMPUTER_USER" >/dev/null 2>&1; then
  chown -R "$OPEN_COMPUTER_USER:$OPEN_COMPUTER_USER" "$VSCODE_SERVER_DATA" 2>/dev/null || true
  exec runuser -u "$OPEN_COMPUTER_USER" -- \
    env HOME="$OPEN_COMPUTER_USER_HOME" \
    "$BIN" \
      --host "$OPEN_COMPUTER_VSCODE_HOST" \
      --port "$OPEN_COMPUTER_VSCODE_PORT" \
      --server-base-path "$OPEN_COMPUTER_VSCODE_BASE_PATH" \
      --without-connection-token \
      --accept-server-license-terms \
      --disable-telemetry \
      --server-data-dir "$VSCODE_SERVER_DATA"
fi

exec "$BIN" \
  --host "$OPEN_COMPUTER_VSCODE_HOST" \
  --port "$OPEN_COMPUTER_VSCODE_PORT" \
  --server-base-path "$OPEN_COMPUTER_VSCODE_BASE_PATH" \
  --without-connection-token \
  --accept-server-license-terms \
  --disable-telemetry \
  --server-data-dir "$VSCODE_SERVER_DATA"
