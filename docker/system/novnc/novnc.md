# noVNC / remote screen (`openagenthumencomputer/docker/system/novnc`)

The picture of the computer. This module owns the whole display stack:

```
Xvfb (:1, 3840x2160)  →  x11vnc (127.0.0.1:5900)  →  websockify  →  noVNC (:6080)
(no window manager, on purpose: the browser of the computer is the whole screen)
```

## Files

| File | What it does | When it runs |
| --- | --- | --- |
| `novnc.conf` | display, screen size, ports and versions | sourced by every script |
| `install.sh` | installs Xvfb, x11vnc, Python venv, noVNC and websockify | `ubuntu/Dockerfile` build |
| `run.sh` | starts the display, the window manager, the VNC server and noVNC | `control.sh start` |
| `control.sh` | start, stop, restart, status, logs, version | a shell inside the computer |
| `novnc.md` | this document | a person reading the folder |

## Versions and paths

| Thing | Version / path |
| --- | --- |
| noVNC | **v1.7.0** (latest stable), `/opt/open-computer/novnc/app` |
| websockify | **v0.13.0** (latest stable), own venv at `/opt/open-computer/novnc/venv` |
| Xvfb / x11vnc | Ubuntu 24.04 archive |
| noVNC URL | `http://<computer>:6080/vnc.html` |

## Ports

- **6080** — noVNC, published (`0.0.0.0`).
- **5900** — raw VNC, bound to **127.0.0.1 only**; the image has no VNC
  password, so it must never leave the machine.

## Commands

```bash
open-computer-novnc start
open-computer-novnc stop
open-computer-novnc restart
open-computer-novnc status
open-computer-novnc logs
open-computer-novnc version
```

`run.sh` skips every part that is already running, so it is safe to call again.
The X server is started before the window manager, and the VNC server before
noVNC.
