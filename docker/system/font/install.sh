#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/font.conf"

VERSION_FILE="$HERE/version"

force=0
for arg in "$@"; do
  case "$arg" in
    --force) force=1 ;;
    -h|--help)
      printf 'usage: %s [--force]\n' "$(basename "$0")"
      exit 0
      ;;
    *) echo "install.sh: unknown argument: $arg" >&2; exit 2 ;;
  esac
done

log() { printf 'font: %s\n' "$*"; }

if [[ "$(id -u)" -ne 0 ]]; then
  echo "install.sh: root is needed to install fonts" >&2
  exit 1
fi

command -v fc-cache >/dev/null 2>&1 || {
  echo "install.sh: fontconfig is required (fc-cache missing)" >&2
  exit 1
}

log "installing fonts to $OPEN_COMPUTER_FONT_DIR"
install -d -m 0755 "$OPEN_COMPUTER_FONT_DIR"

for f in "$HERE"/*.ttf "$HERE"/*.otf "$HERE"/*.TTF "$HERE"/*.OTF; do
  [[ -e "$f" ]] || continue
  install -m 0644 "$f" "$OPEN_COMPUTER_FONT_DIR/"
done

if [[ -f "$HERE/fonts.conf" ]]; then
  install -m 0644 "$HERE/fonts.conf" "$OPEN_COMPUTER_FONTS_CONF"
elif [[ -f "$HERE/fontconfig.conf" ]]; then
  install -m 0644 "$HERE/fontconfig.conf" "$OPEN_COMPUTER_FONTS_CONF"
fi

log "rebuilding font cache"
fc-cache -f "$OPEN_COMPUTER_FONT_DIR" >/dev/null 2>&1 || fc-cache -f >/dev/null 2>&1 || true

{
  echo "# Open Computer fonts"
  for f in "$OPEN_COMPUTER_FONT_DIR"/*.ttf "$OPEN_COMPUTER_FONT_DIR"/*.otf; do
    [[ -e "$f" ]] || continue
    basename "$f"
  done
} > "$VERSION_FILE"

chmod 0755 "$HERE/install.sh" 2>/dev/null || true

ln -sf "$HERE/install.sh" /usr/local/bin/open-computer-font 2>/dev/null || true
printf '%s\n' 'export PATH="/opt/open-computer/font:$PATH"' >/etc/profile.d/02-open-computer-font.sh 2>/dev/null || true
chmod 0644 /etc/profile.d/02-open-computer-font.sh 2>/dev/null || true

log "installed: $(wc -l < "$VERSION_FILE" 2>/dev/null | tr -d ' ') fonts"
log "controller: open-computer-font [--force]"
