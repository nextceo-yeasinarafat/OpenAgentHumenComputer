#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/auth.conf"

LOG() { printf 'auth: %s\n' "$*"; }
die() { printf 'auth: %s\n' "$*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || die "root is needed to install the auth of the computer"

DEST="/opt/open-computer/auth"
if [[ "$HERE" != "$DEST" ]]; then
  mkdir -p "$DEST"
  cp "$HERE"/jwt.py "$HERE"/store.py "$HERE"/auth_service.py \
     "$HERE"/init_user.py "$HERE"/auth.conf "$HERE"/auth.md "$DEST"/
fi
chmod 0755 "$DEST"/*.sh "$DEST"/*.py 2>/dev/null || true

ln -sf "$DEST/control.sh" /usr/local/bin/open-computer-auth

if id open-computer >/dev/null 2>&1; then
  AUTH_USER=open-computer \
  AUTH_PASSWORD="${OPEN_COMPUTER_PASSWORD:-computer123}" \
    /opt/python/current/bin/python3 "$DEST/init_user.py" || true
fi

LOG "installed: $DEST"
LOG "controller: open-computer-auth start"
