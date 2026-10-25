#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/dependency.conf"

LOG() { printf 'python: %s\n' "$*"; }
die() { printf 'python: %s\n' "$*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || die "root is needed to install Python"

listing="$(curl -fsSL --max-time 30 https://www.python.org/ftp/python/ 2>/dev/null || true)"
version=""
for candidate in $(printf '%s' "$listing" \
  | grep -oE '3\.[0-9]+\.[0-9]+/' \
  | tr -d '/' \
  | sort -V -r); do
  if curl -fsI --max-time 15 \
    "https://www.python.org/ftp/python/${candidate}/Python-${candidate}.tar.xz" \
    >/dev/null 2>&1; then
    version="$candidate"
    break
  fi
done
[[ "$version" =~ ^3\.[0-9]+\.[0-9]+$ ]] || version="$PYTHON_VERSION_FALLBACK"

short="${version%.*}"

if [[ -x "$PYTHON_PREFIX/current/bin/python$short" ]] && \
  "$PYTHON_PREFIX/current/bin/python$short" --version 2>&1 | grep -q "$version"; then
  LOG "already installed: $version"
  printf 'Python %s\n' "$version" >"$HERE/python.version"
  exit 0
fi

LOG "installing build dependencies"
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  build-essential \
  ca-certificates \
  curl \
  libbz2-dev \
  libffi-dev \
  libgdbm-dev \
  liblzma-dev \
  libncurses-dev \
  libnss3-dev \
  libreadline-dev \
  libsqlite3-dev \
  libssl-dev \
  pkg-config \
  tk-dev \
  uuid-dev \
  xz-utils \
  zlib1g-dev
rm -rf /var/lib/apt/lists/*

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

LOG "downloading Python $version"
curl -fsSL --retry 3 --retry-delay 2 \
  -o "$tmp/python.tar.xz" "https://www.python.org/ftp/python/${version}/Python-${version}.tar.xz"
tar -xJf "$tmp/python.tar.xz" -C "$tmp"

src="$tmp/Python-${version}"
[[ -d "$src" ]] || die "the Python archive did not contain Python-$version"

LOG "building Python $version (this takes a few minutes)"
(
  cd "$src"
  ./configure \
    --prefix="$PYTHON_PREFIX/$version" \
    --with-ensurepip=install \
    --disable-test-modules
  make -j"$(nproc)"
  make altinstall
)

bin="$PYTHON_PREFIX/$version/bin"
[[ -e "$bin/python3" ]] || ln -s "python$short" "$bin/python3"
[[ -e "$bin/pip3" ]] || ln -s "pip$short" "$bin/pip3"
[[ -e "$bin/pip" ]] || ln -s "pip$short" "$bin/pip"

ln -sfn "$PYTHON_PREFIX/$version" "$PYTHON_PREFIX/current"
ln -sfn "$PYTHON_PREFIX/current/bin/python3" /usr/local/bin/python3
ln -sfn "$PYTHON_PREFIX/current/bin/pip3" /usr/local/bin/pip3

printf '%s\n' 'export PATH="/opt/python/current/bin:$PATH"' \
  >/etc/profile.d/11-dependency-python.sh
chmod 0644 /etc/profile.d/11-dependency-python.sh

printf 'Python %s\n' "$version" >"$HERE/python.version"
"$PYTHON_PREFIX/current/bin/python$short" --version >/dev/null 2>&1 || \
  die "the new Python did not start"
LOG "installed: $(cat "$HERE/python.version")"
LOG "path: /opt/python/current/bin (python3, pip3)"
