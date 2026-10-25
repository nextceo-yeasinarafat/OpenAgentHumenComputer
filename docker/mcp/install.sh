#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$HERE/mcp.conf"

LOG() { printf 'mcp: %s\n' "$*"; }
die() { printf 'mcp: %s\n' "$*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || die "root is needed to install the MCP of the computer"

PY="/opt/python/current/bin/python3"
PIP="/opt/python/current/bin/pip3"
[[ -x "$PIP" ]] || die "the Python of the computer is missing: run system/dependency/python_install.sh first"

have="$("$PY" -c 'import importlib.metadata as md; print(md.version("mcp"))' 2>/dev/null || true)"

version="$(curl -fsSL --max-time 30 https://pypi.org/pypi/mcp/json 2>/dev/null \
  | python3 -c 'import json,sys; print(json.load(sys.stdin)["info"]["version"])' 2>/dev/null || true)"
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.a-z0-9]*)$ ]] || version="$MCP_VERSION_FALLBACK"

if [[ -n "$have" ]] && [[ "$have" == "$version" ]]; then
  LOG "already installed: mcp $have"
else
  LOG "installing mcp $version (cli extras)"
  "$PIP" install --upgrade --no-cache-dir --disable-pip-version-check \
    "mcp[cli]==$version" >/dev/null
fi

"$PY" - <<'PY' >"$HERE/mcp.version"
import importlib.metadata as md
print("mcp", md.version("mcp"))
PY

printf '%s\n' 'export PATH="/opt/python/current/bin:$PATH"' \
  >/etc/profile.d/15-mcp.sh
chmod 0644 /etc/profile.d/15-mcp.sh
ln -sf "$HERE/control.sh" /usr/local/bin/open-computer-mcp

"$PY" -c 'import mcp' >/dev/null 2>&1 || die "the MCP SDK did not import"
LOG "installed: $(tr '\n' ' ' <"$HERE/mcp.version")"
LOG "path: /opt/python/current/bin (python3, mcp)"
