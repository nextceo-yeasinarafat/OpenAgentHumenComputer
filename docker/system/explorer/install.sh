#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/explorer.conf"

LOG() { printf 'explorer: %s\n' "$*"; }
die() { printf 'explorer: %s\n' "$*" >&2; exit 1; }

force=0
for arg in "$@"; do
  case "$arg" in
    --force) force=1 ;;
    -h|--help)
      sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) die "unknown argument: $arg" ;;
  esac
done

[[ "$(id -u)" -eq 0 ]] || die "root is needed to install the explorer"
command -v apt-get >/dev/null 2>&1 || die "this script installs the explorer on Debian or Ubuntu"

LOG "installing $OPEN_COMPUTER_EXPLORER_BIN"
apt-get update
apt_args=(install -y --no-install-recommends)
if (( force )); then
  apt_args+=(--reinstall)
fi
DEBIAN_FRONTEND=noninteractive apt-get "${apt_args[@]}" \
  "$OPEN_COMPUTER_EXPLORER_BIN" \
  adwaita-icon-theme \
  shared-mime-info
rm -rf /var/lib/apt/lists/*

if command -v "$OPEN_COMPUTER_EXPLORER_BIN" >/dev/null 2>&1; then
  "$OPEN_COMPUTER_EXPLORER_BIN" --version 2>&1 | head -n 1 >"$HERE/version" || true
fi

chmod 0755 "$HERE/install.sh" "$HERE/run.sh" "$HERE/control.sh"
ln -sf "$HERE/control.sh" /usr/local/bin/open-computer-explorer
ln -sf "$HERE/run.sh" /usr/local/bin/open-computer-explorer-window

printf '%s\n' 'export PATH="/opt/open-computer/explorer:$PATH"' \
  >/etc/profile.d/05-open-computer-explorer.sh
chmod 0644 /etc/profile.d/05-open-computer-explorer.sh

LOG "installed: $(head -n 1 "$HERE/version" 2>/dev/null || echo "$OPEN_COMPUTER_EXPLORER_BIN")"
LOG "controller: open-computer-explorer {open|close|restart|status|logs|version}"
