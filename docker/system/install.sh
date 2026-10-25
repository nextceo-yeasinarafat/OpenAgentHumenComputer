#!/usr/bin/env bash
set -euo pipefail
SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do TARGET="$(readlink "$SOURCE")"; [[ "$TARGET" != /* ]] && TARGET="$(dirname "$SOURCE")/$TARGET"; SOURCE="$TARGET"; done
HERE="$(cd "$(dirname "$SOURCE")" && pwd)"
source "$HERE/system.conf"
log(){ printf 'system: %s\n' "$*"; }
log "applying all system modules from system.conf"
"$HERE/storage.sh"
"$HERE/cpu_core.sh"
"$HERE/gpu.sh"
"$HERE/ram.sh"
chmod 0755 "$HERE"/*.sh 2>/dev/null || true
if [[ -w /usr/local/bin ]]; then
  ln -sf "$HERE/install.sh" /usr/local/bin/open-computer-system 2>/dev/null || true
fi
if [[ -w /etc/profile.d ]]; then
  printf '%s\n' 'export PATH="/opt/open-computer/system:$PATH"' \
    >/etc/profile.d/05-open-computer-system.sh 2>/dev/null || true
  chmod 0644 /etc/profile.d/05-open-computer-system.sh 2>/dev/null || true
fi
log "done"
