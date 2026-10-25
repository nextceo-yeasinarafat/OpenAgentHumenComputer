#!/usr/bin/env bash
set -euo pipefail
SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do TARGET="$(readlink "$SOURCE")"; [[ "$TARGET" != /* ]] && TARGET="$(dirname "$SOURCE")/$TARGET"; SOURCE="$TARGET"; done
HERE="$(cd "$(dirname "$SOURCE")" && pwd)"
source "$HERE/system.conf"
LOG_DIR="${LOG_DIR:-/var/log/open-computer}"; mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/ram.log"
log(){ echo "[$(date -Iseconds)] [ram] $*" >> "$LOG"; echo "ram: $*"; }
log "Applying RAM configuration"; log "RAM_TOTAL_GB=${RAM_TOTAL_GB} RAM_SHARED=${RAM_SHARED}"
cat > "$HERE/ram.resolved" <<EOF
RAM_TOTAL_GB=${RAM_TOTAL_GB}
RAM_SHARED=${RAM_SHARED}
RAM_SWAP_GB=${RAM_SWAP_GB}
RAM_TYPE=${RAM_TYPE}
APPLIED_AT=$(date -Iseconds)
EOF
chmod 0644 "$HERE/ram.resolved"
log "Done"; exit 0
