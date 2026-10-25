#!/usr/bin/env bash
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY="${PYTHON:-python3}"

case "${1:-}" in
  create)
    [[ $# -ge 2 ]] || { echo "usage: token.sh create <agent> [ttl-days] [perms]" >&2; exit 2; }
    "$PY" "$HERE/generate_token.py" create --agent "$2" --ttl-days "${3:-30}" --perms "${4:-terminal,browser,desktop,filesystem}"
    ;;
  list) exec "$PY" "$HERE/generate_token.py" list ;;
  revoke)
    [[ $# -ge 2 ]] || { echo "usage: token.sh revoke <hash-prefix>" >&2; exit 2; }
    exec "$PY" "$HERE/generate_token.py" revoke "$2"
    ;;
  verify)
    [[ $# -ge 2 ]] || { echo "usage: token.sh verify <token> [permission]" >&2; exit 2; }
    exec "$PY" "$HERE/agent_auth.py" --token "$2" ${3:+--perm "$3"}
    ;;
  *)
    echo "usage: token.sh {create <agent> [days] [perms]|list|revoke <hash>|verify <token> [perm]}" >&2
    exit 2
    ;;
esac
