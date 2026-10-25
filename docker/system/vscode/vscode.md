# VS Code Server (`openagenthumencomputer/docker/system/vscode`)

The editor of the computer: the latest stable **Visual Studio Code Server**
(the web build) inside the Ubuntu image, on port **8989** under the
**`/vscode`** base path. It is a real server with a real workbench, not a
picture of an editor.

Microsoft ships this server prebuilt as `server-linux-x64-web`, so there is
nothing to compile: `install.sh` downloads and unpacks it, `run.sh` serves it.

## Files

| File | What it does | When it runs |
| --- | --- | --- |
| `vscode.conf` | port, base path, install dir, data dir, paths | sourced by every script |
| `install.sh` | resolves the latest stable build, downloads ~230 MB, unpacks to `/opt/vscode-server`, writes the version | `ubuntu/Dockerfile` build |
| `run.sh` | serves one server on `0.0.0.0:8989` with base path `/vscode` | `control.sh start` |
| `control.sh` | start, stop, restart, status, logs, version | a shell inside the computer |
| `vscode.md` | this document | a person reading the folder |

The bridge carries the editor to the UI: `/vscode/*` is passed through to
port 8989 (HTTP word for word, WebSocket upgrades as a raw splice), and the
lifecycle is `/api/vscode`, `/api/vscode/start`, `/api/vscode/stop` — closing
the window of the UI stops the server.

It is called once at build time, so a fresh container serves the editor
without downloading anything at boot. A second `install.sh` run does nothing
unless a newer stable build exists; `--force` replaces it.

## Paths

| Path | What it is |
| --- | --- |
| `/opt/vscode-server` | the installed server (`bin/code-server`) |
| `/opt/vscode-server/version` | `productVersion commit` of the installed build |
| `<home>/.vscode-server` | user data: settings, extensions, workspace storage — the home of the account the server runs as |
| `/tmp/open-computer/vscode.log` | the log |
| `/tmp/open-computer/vscode.pid` | the pid file used by `control.sh` |

## Commands

```bash
open-computer-vscode start
open-computer-vscode stop
open-computer-vscode restart
open-computer-vscode status
open-computer-vscode logs
open-computer-vscode version
```

## Security and the port

- The server runs with `--without-connection-token`, because the port is meant
  to be reached on loopback only. **Do not publish `0.0.0.0:8989`**; if the
  port must leave the machine, give the server a connection token first.
- `--disable-telemetry` is set, and the server license terms are accepted at
  start (`--accept-server-license-terms`).
- It runs as `open-computer`, so the files it writes have the same owner as the
  terminal and the explorer.

## The UI window

This folder only installs and serves the server. The stream that shows the
editor inside the desktop UI belongs to the UI layer (`core/apps/vscode`) and
is wired there, not here.
