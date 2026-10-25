# Ubuntu base image (`openagenthumencomputer/docker/ubuntu`)

The operating-system layer of the computer: a real Ubuntu 24.04 with the core
tools and the `open-computer` user. The desktop modules are installed into this
image by the Dockerfile, so one image is the whole machine.

## Files

| File | What it does | When it runs |
| --- | --- | --- |
| `Dockerfile` | starts from `ubuntu:24.04`, installs the core packages, creates the user, then copies and installs the dependency, cdp, noVNC, terminal, explorer, VS Code, Chromium, font and system modules | `docker build` |
| `ubuntu_img.download.sh` | pulls the `ubuntu:24.04` base image from Docker Hub | manually, before the build |
| `ubuntu_img.build.sh` | builds `openagenthumencomputer/ubuntu:24.04` from the Dockerfile | manually, after the download |
| `ubuntu.md` | this document | a person reading the folder |

## What is inside the image

- **Base:** `ubuntu:24.04`, UTF-8 (`C.UTF-8`), `TZ=UTC`.
- **Core tools:** `ca-certificates`, `curl`, `wget`, `gnupg`, `locales`,
  `sudo`, `python3`, `python3-pip`, `git`, `unzip`, `jq`, `procps`.
- **User:** `open-computer` (uid 1000), `/bin/bash`, passwordless sudo,
  home `/home/open-computer`, with `.local/bin`, `.config` and `workspace`.
- **Modules copied into the image:**
  - `../system/dependency` → latest stable curl, Python, Bun
  - `../system/cdp` → the DevTools protocol bridge (`9223 → 9222`)
  - `../system/novnc` → Xvfb (4K), x11vnc, noVNC, websockify
  - `../system/terminal` → xterm and the terminal controller
  - `../system/explorer` → PCManFM and the explorer controller
  - `../system/vscode` → the VS Code Server (web build)
  - `../system/chromium` → Google Chrome stable and the DevTools forwarder
  - `../system/font` → the system fonts and the fontconfig override
  - `../system/api` → xdotool and the screen observation (the hands and the eyes)
  - `../system/auth` → the door of the account (PBKDF2 in SQLite, JWT sessions)
  - `../mcp` → the MCP server of the computer (7072)
  - `../system` → `system.conf`, the virtual hardware of the computer

## Build

The build context is the `docker/` folder (one level up), because the Dockerfile
copies sibling modules.

```bash
./ubuntu_img.download.sh     # docker pull ubuntu:24.04
./ubuntu_img.build.sh        # docker build -t openagenthumencomputer/ubuntu:24.04
```

`ubuntu_img.build.sh` refuses to build when the base image is not present; it
never pulls by itself and never starts a container.

## Ports

| Port | What |
| --- | --- |
| `6080` | noVNC, the picture of the computer |
| `8989` | VS Code Server, under `/vscode` |
| `5900` | raw VNC, bound to loopback only by `novnc/run.sh` |

## Runtime

There is no `ENTRYPOINT` yet. The image starts `/bin/bash`; the services are
started with their controllers:

```bash
open-computer-cdp start
open-computer-novnc start
open-computer-terminal open
open-computer-explorer open
open-computer-vscode start
open-computer-chromium start
open-computer-font            # (re)install the fonts
open-computer-mcp start       # the MCP server of the computer
open-computer-system          # apply system.conf
```
