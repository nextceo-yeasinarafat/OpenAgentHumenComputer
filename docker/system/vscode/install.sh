#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/vscode.conf"

API_URL="https://update.code.visualstudio.com/api/update/linux-x64/stable/latest"
ARCHIVE_URL="https://update.code.visualstudio.com/commit:%s/server-linux-x64-web/stable"

LOG() { printf 'vscode: %s\n' "$*"; }
die() { printf 'vscode: %s\n' "$*" >&2; exit 1; }

force=0
for arg in "$@"; do
  case "$arg" in
    --force) force=1 ;;
    -h|--help)
      sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) die "unknown argument: $arg" ;;
  esac
done

[[ "$(id -u)" -eq 0 ]] || die "root is needed to install the editor"

installed_version() {
  if [[ -f "$VSCODE_SERVER_DIR/version" ]]; then
    head -n 1 "$VSCODE_SERVER_DIR/version"
  fi
}

LOG "resolving the latest stable release"
release="$(curl -fsSL --retry 3 --retry-delay 2 "$API_URL")"
version="$(printf '%s' "$release" | sed -n 's/.*"productVersion":"\([^"]*\)".*/\1/p')"
commit="$(printf '%s' "$release" | sed -n 's/.*"version":"\([^"]*\)".*/\1/p')"

[[ -n "$version" && -n "$commit" ]] || die "could not read the latest stable release"

if (( force == 0 )) && [[ -x "$VSCODE_SERVER_DIR/bin/code-server" ]] && \
  [[ "$(installed_version)" == "$version $commit" ]]; then
  LOG "already installed: $version ($commit)"
  exit 0
fi

url="$(printf "$ARCHIVE_URL" "$commit")"
archive="$(mktemp /tmp/vscode-server-XXXXXX.tar.gz)"
staging=""

cleanup() {
  rm -f "$archive"
  if [[ -n "$staging" ]]; then rm -rf "$staging"; fi
}
trap cleanup EXIT

LOG "downloading $version ($commit)"
curl -fL --retry 5 --retry-delay 2 --retry-all-errors \
  --progress-bar -o "$archive" "$url"

LOG "checking the archive"
tar -tzf "$archive" >/dev/null

LOG "unpacking into $VSCODE_SERVER_DIR"
staging="$(mktemp -d /tmp/vscode-server-XXXXXX)"
tar -xzf "$archive" -C "$staging" --strip-components=1

[[ -x "$staging/bin/code-server" ]] || die "the archive has no bin/code-server"

printf '%s %s\n' "$version" "$commit" >"$staging/version"
rm -rf "$VSCODE_SERVER_DIR"
mkdir -p "$(dirname "$VSCODE_SERVER_DIR")"
mv "$staging" "$VSCODE_SERVER_DIR"
staging=""

chmod 0755 "$HERE/install.sh" "$HERE/run.sh" "$HERE/control.sh"
chmod a+rx "$VSCODE_SERVER_DIR" "$VSCODE_SERVER_DIR/bin"
chmod -R a+rX "$VSCODE_SERVER_DIR"
ln -sf "$HERE/control.sh" /usr/local/bin/open-computer-vscode
ln -sf "$HERE/run.sh" /usr/local/bin/open-computer-vscode-server

printf '%s\n' 'export PATH="/opt/open-computer/vscode:$PATH"' \
  >/etc/profile.d/06-open-computer-vscode.sh
chmod 0644 /etc/profile.d/06-open-computer-vscode.sh

LOG "installed: $version ($commit)"
LOG "controller: open-computer-vscode {start|stop|restart|status|logs|version}"
