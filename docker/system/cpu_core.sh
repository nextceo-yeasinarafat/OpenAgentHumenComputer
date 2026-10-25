#!/usr/bin/env bash
set -euo pipefail
SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do TARGET="$(readlink "$SOURCE")"; [[ "$TARGET" != /* ]] && TARGET="$(dirname "$SOURCE")/$TARGET"; SOURCE="$TARGET"; done
HERE="$(cd "$(dirname "$SOURCE")" && pwd)"
source "$HERE/system.conf"
LOG_DIR="${LOG_DIR:-/var/log/open-computer}"; mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/cpu_core.log"
log(){ echo "[$(date -Iseconds)] [cpu_core] $*" >> "$LOG"; echo "cpu_core: $*"; }
log "Applying CPU configuration"; log "CPU_CORES=${CPU_CORES} CPU_THREADS_PER_CORE=${CPU_THREADS_PER_CORE}"
cat > "$HERE/cpu_core.resolved" <<EOF
CPU_CORES=${CPU_CORES}
CPU_THREADS_PER_CORE=${CPU_THREADS_PER_CORE}
CPU_MODEL=${CPU_MODEL}
CPU_GOVERNOR=${CPU_GOVERNOR}
APPLIED_AT=$(date -Iseconds)
EOF
chmod 0644 "$HERE/cpu_core.resolved"
log "Done"; exit 0
