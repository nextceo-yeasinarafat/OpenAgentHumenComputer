#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/chromium.conf"

LOG() { printf 'chromium: %s\n' "$*"; }
die() { printf 'chromium: %s\n' "$*" >&2; exit 1; }

force=0
for arg in "$@"; do
  case "$arg" in
    --force) force=1 ;;
    -h|--help)
      sed -n '2,24p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) die "unknown argument: $arg" ;;
  esac
done

[[ "$(id -u)" -eq 0 ]] || die "root is needed to install the browser"
command -v apt-get >/dev/null 2>&1 || die "this script installs the browser on Debian or Ubuntu"

install -d -m 0755 /etc/apt/keyrings
if [[ ! -s /etc/apt/keyrings/google-chrome.gpg ]]; then
  LOG "fetching the signing key of Google's repository"
  curl -fsSL --retry 3 --retry-delay 2 \
    https://dl.google.com/linux/linux_signing_key.pub \
    | gpg --dearmor -o /etc/apt/keyrings/google-chrome.gpg
  chmod 0644 /etc/apt/keyrings/google-chrome.gpg
fi

printf '%s\n' \
  "deb [arch=amd64 signed-by=/etc/apt/keyrings/google-chrome.gpg] https://dl.google.com/linux/chrome/deb/ stable main" \
  >/etc/apt/sources.list.d/google-chrome.list

LOG "installing $OPEN_COMPUTER_CHROMIUM_BIN"
apt-get update
apt_args=(install -y --no-install-recommends)
if (( force )); then
  apt_args+=(--reinstall)
fi
DEBIAN_FRONTEND=noninteractive apt-get "${apt_args[@]}" "$OPEN_COMPUTER_CHROMIUM_BIN"
rm -rf /var/lib/apt/lists/*

if command -v "$OPEN_COMPUTER_CHROMIUM_BIN" >/dev/null 2>&1; then
  "$OPEN_COMPUTER_CHROMIUM_BIN" --version 2>/dev/null | head -n 1 >"$HERE/version" || true
fi

chmod 0755 "$HERE/install.sh" "$HERE/run.sh" "$HERE/control.sh" "$HERE/open.sh"
chmod 0755 "$HERE/cdp-forward.py" 2>/dev/null || true

ln -sf "$HERE/control.sh" /usr/local/bin/open-computer-chromium
ln -sf "$HERE/open.sh" /usr/local/bin/open-computer-open-browser
ln -sf "$HERE/cdp-forward.py" /usr/local/bin/open-computer-cdp-forward

printf '%s\n' 'export PATH="/opt/open-computer/chromium:$PATH"' \
  >/etc/profile.d/02-open-computer-chromium.sh
chmod 0644 /etc/profile.d/02-open-computer-chromium.sh

LOG "installed: $(head -n 1 "$HERE/version" 2>/dev/null || echo "$OPEN_COMPUTER_CHROMIUM_BIN")"
LOG "controller: open-computer-chromium {start|stop|restart|status|logs|wake|sleep|forward|forward-stop|supervise|version}"
