#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/dependency.conf"

LOG() { printf 'bun: %s\n' "$*"; }
die() { printf 'bun: %s\n' "$*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || die "root is needed to install Bun"

release="$(curl -fsSL --max-time 20 https://api.github.com/repos/oven-sh/bun/releases/latest 2>/dev/null || true)"
tag="$(printf '%s' "$release" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"bun-v\([^"]*\)".*/\1/p' | head -n 1)"
version="$tag"
[[ -n "$version" ]] || version="$BUN_VERSION_FALLBACK"

if command -v bun >/dev/null 2>&1 && [[ "$(bun --version 2>/dev/null)" == "$version" ]]; then
  LOG "already installed: $version"
  printf '%s\n' "$version" >"$HERE/bun.version"
  exit 0
fi

LOG "installing Bun $version into $BUN_PREFIX"
export BUN_INSTALL="$BUN_PREFIX"
curl -fsSL --retry 3 --retry-delay 2 https://bun.sh/install | bash

ln -sfn "$BUN_PREFIX/bin/bun" /usr/local/bin/bun
if [[ -e "$BUN_PREFIX/bin/bunx" ]]; then
  ln -sfn "$BUN_PREFIX/bin/bunx" /usr/local/bin/bunx
fi

printf '%s\n' 'export PATH="/opt/bun/bin:$PATH"' \
  >/etc/profile.d/13-dependency-bun.sh
chmod 0644 /etc/profile.d/13-dependency-bun.sh

"$BUN_PREFIX/bin/bun" --version >"$HERE/bun.version"
LOG "installed: bun $(cat "$HERE/bun.version")"
LOG "path: /opt/bun/bin/bun"
