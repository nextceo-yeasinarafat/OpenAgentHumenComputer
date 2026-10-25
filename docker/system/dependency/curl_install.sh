#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/dependency.conf"

LOG() { printf 'curl: %s\n' "$*"; }
die() { printf 'curl: %s\n' "$*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || die "root is needed to install curl"

release="$(curl -fsSL --max-time 20 https://api.github.com/repos/curl/curl/releases/latest 2>/dev/null || true)"
tag="$(printf '%s' "$release" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"curl-\([^"]*\)".*/\1/p' | head -n 1)"
version="${tag//_/.}"
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || version="$CURL_VERSION_FALLBACK"

if [[ -x "$CURL_PREFIX/bin/curl" ]] && \
  "$CURL_PREFIX/bin/curl" --version 2>/dev/null | head -n 1 | grep -q "curl $version "; then
  LOG "already installed: $version"
  "$CURL_PREFIX/bin/curl" --version | head -n 1 >"$HERE/curl.version"
  exit 0
fi

LOG "installing build dependencies"
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  build-essential \
  ca-certificates \
  libssl-dev \
  zlib1g-dev \
  libzstd-dev \
  libbrotli-dev \
  libpsl-dev \
  libidn2-dev \
  libnghttp2-dev \
  xz-utils
rm -rf /var/lib/apt/lists/*

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

LOG "downloading curl $version"
curl -fsSL --retry 3 --retry-delay 2 \
  -o "$tmp/curl.tar.xz" "https://curl.se/download/curl-${version}.tar.xz"
tar -xJf "$tmp/curl.tar.xz" -C "$tmp"

src="$tmp/curl-${version}"
[[ -d "$src" ]] || die "the curl archive did not contain curl-$version"

LOG "building curl $version"
(
  cd "$src"
  ./configure \
    --prefix="$CURL_PREFIX" \
    --with-openssl \
    --with-zlib \
    --with-zstd \
    --with-brotli \
    --with-libpsl \
    --with-libidn2 \
    --with-nghttp2 \
    --disable-ldap \
    --disable-ldaps \
    --disable-manual
  make -j"$(nproc)"
  make install
)

ln -sfn "$CURL_PREFIX/bin/curl" /usr/local/bin/curl

printf '%s\n' 'export PATH="/opt/curl/bin:$PATH"' \
  >/etc/profile.d/10-dependency-curl.sh
chmod 0644 /etc/profile.d/10-dependency-curl.sh

"$CURL_PREFIX/bin/curl" --version | head -n 1 >"$HERE/curl.version"
LOG "installed: $(head -n 1 "$HERE/curl.version")"
LOG "path: /opt/curl/bin/curl (linked at /usr/local/bin/curl)"
