#!/usr/bin/env bash
set -euo pipefail
SOURCE="${BASH_SOURCE[0]}"
while [[ -L "$SOURCE" ]]; do TARGET="$(readlink "$SOURCE")"; [[ "$TARGET" != /* ]] && TARGET="$(dirname "$SOURCE")/$TARGET"; SOURCE="$TARGET"; done
HERE="$(cd "$(dirname "$SOURCE")" && pwd)"
cmd="${1:-status}"; shift || true
case "$cmd" in
  start|apply) "$HERE/install.sh" "$@" ;;
  stop) echo "system: configuration applied, nothing to stop" ;;
  restart) "$HERE/install.sh" "$@" ;;
  status)
    echo "system.conf: $HERE/system.conf"
    for f in storage cpu_core gpu ram; do
      if [[ -f "$HERE/${f}.resolved" ]]; then echo "--- $f.resolved ---"; cat "$HERE/${f}.resolved"; echo; else echo "--- $f: not applied ---"; fi
    done
    ;;
  logs)
    for f in /var/log/open-computer/storage.log /var/log/open-computer/cpu_core.log /var/log/open-computer/gpu.log /var/log/open-computer/ram.log; do
      [[ -f "$f" ]] && echo "=== $(basename $f) ===" && tail -10 "$f" && echo
    done
    ;;
  *) echo "usage: $(basename "$0") {start|apply|stop|restart|status|logs}" >&2; exit 2 ;;
esac
