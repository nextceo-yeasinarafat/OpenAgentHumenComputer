#!/usr/bin/env bash
set -uo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/core_systeam.conf"

LOG() { printf 'core: %s\n' "$*"; }
die() { printf 'core: %s\n' "$*" >&2; exit 1; }

command -v systemctl >/dev/null 2>&1 || die "systemd is not on this machine"

UNIT_DIR="$HOME/.config/systemd/user"
UNIT="$UNIT_DIR/core-systeam.service"

mkdir -p "$UNIT_DIR"
cat >"$UNIT" <<EOF
[Unit]
Description=The watchman of the OpenAgentHumenComputer (bridge + container)

[Service]
Type=simple
ExecStart=$HERE/recover.sh _watch
Restart=always
RestartSec=3

[Install]
WantedBy=default.target
EOF

chmod 0644 "$UNIT"
systemctl --user daemon-reload
systemctl --user enable --now core-systeam.service >/dev/null 2>&1 || {
  bash "$HERE/recover.sh" start >/dev/null 2>&1 || true
}

loginctl enable-linger "$USER" >/dev/null 2>&1 || true

sleep 1
if systemctl --user is-active --quiet core-systeam.service 2>/dev/null; then
  LOG "the watchman is running (systemd: core-systeam)"
elif [[ -n "$(bash "$HERE/recover.sh" status 2>/dev/null | grep running)" ]]; then
  LOG "the watchman is running (by hand)"
else
  LOG "the watchman was installed; start it with: bash $HERE/recover.sh start"
fi
