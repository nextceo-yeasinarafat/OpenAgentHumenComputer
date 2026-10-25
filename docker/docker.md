# Docker stack (`openagenthumencomputer/docker`)

The container side of the computer. One Ubuntu image is built from these
folders; each folder owns one part of the machine and installs itself into the
image with its own `install.sh`.

## Folders

| Folder | What it owns | Main ports |
| --- | --- | --- |
| `ubuntu/` | the base image, the user, the build scripts | — |
| `ui/` | the small image that serves the web UI (Node.js + Bun, no desktop) | `1010` |
| `system/` | the machine itself: everything that runs inside the computer | — |

The parts of the machine live inside `system/`:

| Folder | What it owns | Main ports |
| --- | --- | --- |
| `system/dependency/` | latest stable curl, Python and Bun | — |
| `system/cdp/` | the DevTools protocol bridge (`9223 → 9222`) | `9223` (internal) |
| `system/novnc/` | Xvfb (4K), x11vnc, noVNC v1.7.0, websockify v0.13.0 — no window manager, on purpose | `6080`, `5900` (loopback) |
| `system/terminal/` | xterm and the real bash terminal | — |
| `system/explorer/` | PCManFM, the real file manager | — |
| `system/vscode/` | the latest stable VS Code Server (web build) | `8989` (loopback) |
| `system/chromium/` | Google Chrome stable, DevTools, forwarder | `9222`, `9223` (internal) |
| `system/font/` | the system fonts and the fontconfig override | — |
| `system/auth/` | the account and the session of the computer | — |
| `system/api/` | the hands and the eyes of the computer: xdotool, the screen observation | — |
| `system/gestures/` | the gestures of the browser: the history swipe taken away | — |

The voice of the machine itself lives beside these, at the top level:

| Folder | What it owns | Main ports |
| --- | --- | --- |
| `mcp/` | the MCP server of the computer — the machine speaks for itself | `7072` |

## The UI image

`ui/` is built and run on its own, because the UI is the first thing that has to
be reachable:

```bash
cd ui
./build.sh      # ubuntu + curl/python/bun + the project, built from GitHub
./run.sh        # container openagenthumencomputer on http://<ip>:1010
```

It contains no desktop: the services of `system/` are a separate image
(`ubuntu/`) and are not needed to serve the UI.

## Build order

`ubuntu/Dockerfile` is the only Dockerfile. It starts from `ubuntu:24.04`,
creates the user, then copies and installs the modules in this order:

```
system/dependency → system/cdp → system/novnc → system/terminal
→ system/explorer → system/vscode → system/chromium → system/font → system/api → mcp
```

The build context is this `docker/` folder, because the Dockerfile copies these
folders:

```bash
cd ubuntu
./ubuntu_img.download.sh    # docker pull ubuntu:24.04
./ubuntu_img.build.sh       # docker build -t openagenthumencomputer/ubuntu:24.04
```

## Runtime

The image has no `ENTRYPOINT` yet; it starts `/bin/bash`. Each module has its
own controller:

```bash
open-computer-cdp start
open-computer-novnc start
open-computer-terminal open
open-computer-explorer open
open-computer-vscode start
open-computer-chromium supervise
open-computer-font            # (re)install the fonts
open-computer-system          # apply system.conf
open-computer-mcp start       # the MCP server of the computer
```

## Documentation

Every folder has its own `.md` file with the file table and the commands:
`ubuntu.md`, and inside `system/`: `system.md`, `dependency.md`, `cdp.md`,
`novnc.md`, `terminal.md`, `explorer.md`, `vscode.md`, `chromium.md`,
`font.md`, `auth.md`, `api.md`.
