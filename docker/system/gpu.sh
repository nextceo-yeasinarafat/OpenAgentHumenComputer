#!/usr/bin/env bash
set -euo pipefail
SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do TARGET="$(readlink "$SOURCE")"; [[ "$TARGET" != /* ]] && TARGET="$(dirname "$SOURCE")/$TARGET"; SOURCE="$TARGET"; done
HERE="$(cd "$(dirname "$SOURCE")" && pwd)"
source "$HERE/system.conf"
LOG_DIR="${LOG_DIR:-/var/log/open-computer}"; mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/gpu.log"
log(){ echo "[$(date -Iseconds)] [gpu] $*" >> "$LOG"; echo "gpu: $*"; }
log "Applying GPU configuration"; log "GPU_ENABLED=${GPU_ENABLED} GPU_COUNT=${GPU_COUNT} GPU_CORES=${GPU_CORES}"
cat > "$HERE/gpu.resolved" <<EOF
GPU_ENABLED=${GPU_ENABLED}
GPU_COUNT=${GPU_COUNT}
GPU_CORES=${GPU_CORES}
GPU_MODEL=${GPU_MODEL}
GPU_MEMORY_GB=${GPU_MEMORY_GB}
GPU_SHARED=${GPU_SHARED}
APPLIED_AT=$(date -Iseconds)
EOF
chmod 0644 "$HERE/gpu.resolved"
log "Done"; exit 0
