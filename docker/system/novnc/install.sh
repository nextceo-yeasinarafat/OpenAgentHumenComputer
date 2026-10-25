#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/novnc.conf"

LOG() { printf 'novnc: %s\n' "$*"; }
die() { printf 'novnc: %s\n' "$*" >&2; exit 1; }

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

[[ "$(id -u)" -eq 0 ]] || die "root is needed to install the screen"
command -v apt-get >/dev/null 2>&1 || die "this script installs the screen on Debian or Ubuntu"

LOG "installing Xvfb, fluxbox, x11vnc and python3-venv"
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  tar \
  xvfb \
  x11-utils \
  x11vnc \
  fluxbox \
  python3 \
  python3-venv \
  python3-pip
rm -rf /var/lib/apt/lists/*

if (( force )) || [[ ! -f "$NOVNC_APP/vnc.html" ]]; then
  LOG "downloading noVNC v${NOVNC_VERSION}"
  tmp="$(mktemp -d)"
  trap 'rm -rf "$tmp"' EXIT

  url="https://github.com/novnc/noVNC/archive/refs/tags/v${NOVNC_VERSION}.tar.gz"
  curl -fsSL --retry 3 --retry-delay 2 -o "$tmp/novnc.tar.gz" "$url"
  tar -xzf "$tmp/novnc.tar.gz" -C "$tmp"

  src="$tmp/noVNC-${NOVNC_VERSION}"
  if [[ ! -d "$src" ]]; then
    src="$(find "$tmp" -maxdepth 1 -type d -name 'noVNC-*' -print -quit)"
  fi
  [[ -n "$src" && -d "$src" ]] || die "the noVNC archive did not contain the client"

  rm -rf "$NOVNC_APP"
  mkdir -p "$NOVNC_APP"
  cp -a "$src"/. "$NOVNC_APP"/
fi

[[ -f "$NOVNC_APP/vnc.html" ]] || die "noVNC is not in $NOVNC_APP"

if (( force )) || [[ ! -x "$WEBSOCKIFY" ]]; then
  LOG "installing websockify v${WEBSOCKIFY_VERSION}"
  python3 -m venv "$NOVNC_VENV"
  "$NOVNC_VENV/bin/pip" install --quiet --upgrade pip
  "$NOVNC_VENV/bin/pip" install --quiet "websockify==${WEBSOCKIFY_VERSION}"
fi

chmod 0755 "$HERE/install.sh" "$HERE/run.sh" "$HERE/control.sh"
ln -sf "$HERE/control.sh" /usr/local/bin/open-computer-novnc
ln -sf "$HERE/run.sh" /usr/local/bin/open-computer-novnc-start

printf '%s\n' 'export PATH="/opt/open-computer/novnc:$PATH"' \
  >/etc/profile.d/04-open-computer-novnc.sh
chmod 0644 /etc/profile.d/04-open-computer-novnc.sh

printf 'noVNC %s\nwebsockify %s\n' "$NOVNC_VERSION" "$WEBSOCKIFY_VERSION" \
  >"$HERE/version"

LOG "installed noVNC v${NOVNC_VERSION} and websockify v${WEBSOCKIFY_VERSION}"
LOG "controller: open-computer-novnc {start|stop|restart|status|logs|version}"
