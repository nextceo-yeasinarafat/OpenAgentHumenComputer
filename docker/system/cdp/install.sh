#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/cdp.conf"

LOG() { printf 'cdp: %s\n' "$*"; }
die() { printf 'cdp: %s\n' "$*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || die "root is needed to install the CDP bridge"
command -v python3 >/dev/null 2>&1 || die "python3 is missing from the image"

chmod 0755 "$HERE/install.sh" "$HERE/run.sh" "$HERE/control.sh" "$HERE/cdp-forward.py"

ln -sfn "$HERE/control.sh" /usr/local/bin/open-computer-cdp
ln -sfn "$HERE/run.sh" /usr/local/bin/open-computer-cdp-forward

printf '%s\n' 'export PATH="/opt/open-computer/cdp:$PATH"' \
  >/etc/profile.d/07-open-computer-cdp.sh
chmod 0644 /etc/profile.d/07-open-computer-cdp.sh

printf 'cdp-forward %s\n' "$CDP_FORWARD_VERSION" >"$HERE/version"

LOG "installed: cdp-forward $CDP_FORWARD_VERSION (9223 -> 9222)"
LOG "controller: open-computer-cdp {start|stop|restart|status|logs|version}"
