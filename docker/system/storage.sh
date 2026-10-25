#!/usr/bin/env bash
set -euo pipefail
SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do TARGET="$(readlink "$SOURCE")"; [[ "$TARGET" != /* ]] && TARGET="$(dirname "$SOURCE")/$TARGET"; SOURCE="$TARGET"; done
HERE="$(cd "$(dirname "$SOURCE")" && pwd)"
source "$HERE/system.conf"
LOG_DIR="${LOG_DIR:-/var/log/open-computer}"; mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/storage.log"
log(){ echo "[$(date -Iseconds)] [storage] $*" >> "$LOG"; echo "storage: $*"; }
log "Applying storage configuration"; log "STORAGE_TOTAL_GB=${STORAGE_TOTAL_GB}"; log "STORAGE_TYPE=${STORAGE_TYPE}"
mkdir -p "$STORAGE_MOUNT_ROOT" 2>/dev/null || true
[[ "$(id -u)" -eq 0 ]] && id "$SYSTEM_USER" >/dev/null 2>&1 && chown "$SYSTEM_USER:$SYSTEM_USER" "$STORAGE_MOUNT_ROOT" 2>/dev/null || true
cat > "$HERE/storage.resolved" <<EOF
STORAGE_TOTAL_GB=${STORAGE_TOTAL_GB}
STORAGE_TYPE=${STORAGE_TYPE}
STORAGE_MOUNT_ROOT=${STORAGE_MOUNT_ROOT}
STORAGE_AUTO_RESIZE=${STORAGE_AUTO_RESIZE}
APPLIED_AT=$(date -Iseconds)
EOF
chmod 0644 "$HERE/storage.resolved"
log "Done"; exit 0
