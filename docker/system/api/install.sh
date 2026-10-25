#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

LOG() { printf 'api: %s\n' "$*"; }

[[ "$(id -u)" -eq 0 ]] || { LOG "root is needed to install the tools of the agent API"; exit 1; }

have() { command -v "$1" >/dev/null 2>&1; }

need=()
have xdotool || need+=("xdotool")
have import || need+=("imagemagick")

if [[ ${#need[@]} -eq 0 ]]; then
  LOG "xdotool and imagemagick are already installed"
else
  LOG "installing: ${need[*]}"
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends "${need[@]}"
  rm -rf /var/lib/apt/lists/*
fi

xdotool getdisplaygeometry >/dev/null 2>&1 || true
have import || { echo "api: imagemagick did not install" >&2; exit 1; }
LOG "installed: xdotool $(xdotool version 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+[0-9.]*' | head -1), imagemagick $(convert --version | head -1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
