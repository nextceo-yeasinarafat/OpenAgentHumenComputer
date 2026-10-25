#!/usr/bin/env bash
set -uo pipefail

SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do
  TARGET="$(readlink "$SOURCE")"
  [[ "$TARGET" != /* ]] && TARGET="$(dirname "$SOURCE")/$TARGET"
  SOURCE="$TARGET"
done
HERE="$(cd "$(dirname "$SOURCE")" && pwd)"
DEST="/opt/open-computer/gestures"

mkdir -p "$DEST"
cp "$HERE"/gestures.conf "$HERE"/control.sh "$HERE"/gestures.md "$DEST"/
chmod 0755 "$DEST"/*.sh 2>/dev/null || true

bash "$DEST/control.sh" apply
