---
status: approved
project: OpenHumenComputer
repo: OpenAgentHumenComputer
---

# Technical spec — OpenHumenComputer

## Architecture

```
browser ──► bridge (one process, :1010, serves the UI and the API)
                │  /                 static build of the desktop
                │  /api/*            state, create, files, token, services
                │  /ws/pty           a real terminal inside the computer
                │  /ws/cdp           the DevTools socket of its Chrome
                │  /websockify       the picture of its screen
                │  /novnc/*          the noVNC client assets
                ▼
        docker socket (mounted into the UI container)
                ▼
        computer container (Ubuntu 24.04)
          Xvfb :1 3840x2160 · x11vnc · noVNC/websockify (6080)
          Chrome 156 + CDP (9222) + forwarder (9223)
          xterm · PCManFM · VS Code Server · MCP server
          an account with password and passwordless sudo
```

The UI and the bridge are the same process, on the same port. There is no
proxy between the browser and the streams — the hop that used to break them is
gone.

## One command to a computer

```
curl -fsSL https://raw.githubusercontent.com/nextceo-yeasinarafat/OpenAgentHumenComputer/main/docker/script/setup.sh | bash
```

`setup.sh` installs Docker if needed, clones the repository to
`~/.openagenthumencomputer`, builds the UI image (which clones the repository
again inside the build, so the image always carries a checkout it did not take
from the local disk), starts the UI container on `1010` with the Docker socket
mounted, waits for the page, and opens it.

## The making of a computer

`POST /api/create` receives the identity and the hardware, validates them, and
starts a thread. The thread:

1. writes the chosen hardware into `system.conf`;
2. pulls `ubuntu:24.04` if it is missing, then builds the computer image from
   the checkout inside the UI container (`docker build`, streamed);
3. runs `docker run --cpus N --memory Ng [--storage-opt size=…]` with the
   account, password, time zone and locale;
4. reads `/etc/open-computer/computer.env` back, starts the screen, and says
   `the computer is up`.

Every line of the thread is an SSE event on `/api/create/logs`; the box paints
them as they arrive, plus a fixed 44-cell bar (`+` filled, `-` left) and a
percentage derived from the phase.

## The agent's door

- **API token** — `GET /api/token`, reset with `POST /api/token/reset`. Every
  agent endpoint requires it.
- **Endpoints** — `/api/exec` (run a command in the computer), `/api/file`
  (read/write), `/api/fs`, `/api/upload`, `/api/media`, `/api/disk`,
  `/api/screenshot`, `/api/desktop`, `/api/open-url`, `/api/state`.
- **MCP** — `/api/mcp/config` and `/api/mcp/status` expose the computer's MCP
  server; an agent can attach with terminal, files, browser and desktop tools.
- **Streams** — `/ws/pty` for a terminal, `/ws/cdp` for Chrome, `/websockify`
  for the screen.

The door opens into the computer, never into the host. No host directory is
mounted into the computer by default.

## Isolation and privacy

- The computer is a container with its own users, home, root and network; the
  host filesystem is not part of it.
- The password chosen in the box is used for the account and for the lock
  screen. The API token is a second, independent door.
- The repository carries no user data: `.env`, `.env.token`, `.venv`,
  `__pycache__`, `node_modules`, `dist`, `.vscode-server` are ignored. Only the
  code and the two fonts the image needs are committed.
- The image installs its dependencies from public sources at build time; a
  computer is not a copy of anybody's machine.

## Failure handling (tested, not promised)

- **Screen self-heal** — `ensure_computer_screen` calls the computer's
  `novnc/control.sh start`, which verifies the display, VNC (5900) and noVNC
  (6080) together; a stale proxy with a dead X server is stopped and rebuilt.
- **Browser self-start** — opening the Chromium window starts Chrome and its
  CDP forwarder (9223); the window receives the picture over `/websockify` and
  the page events over `/ws/cdp`.
- **Process detachment** — Xvfb, x11vnc and websockify run detached, so the end
  of a shell session does not kill the screen.
- **Single origin** — the bridge serves the build, the API and every stream on
  one port, so a missing proxy cannot silently break the streams.
- **Visible failure** — a failed step keeps its real error line, and the making
  ends with `INCOMPLETE` rather than a screen that pretends to be ready.

## Build, run, verify

```bash
# host
docker/script/setup.sh                 # UI image + container + page
docker/ui/run.sh --logs                # follow the UI and the bridge

# inside the computer
/opt/open-computer/novnc/control.sh status
/opt/open-computer/chromium/control.sh status
```

Measured on the reference machine:

- UI `http://<host>:1010/` → `200 text/html`, `/api/health` → `{"ok": true}`.
- `WS /ws/cdp` and `WS /websockify` → `101 Switching Protocols`.
- Screen: display `:1` at 3840×2160, VNC on 5900, noVNC on 6080.
- Chrome 156.0.8078.47, DevTools 9222, forwarder 9223.
- `/api/services` → bridge, computer, screen and browser `on`.
- Killing x11vnc by hand and calling the bridge's ensure brings it back.

The reference commit is `497cfd3` (FourteenthCommit).

## Limits, said out loud

- The first computer image build takes 15–25 minutes (curl and Python are built
  from source, Chrome and VS Code are downloaded); later computers start in
  seconds.
- One computer per host, one human at the desktop, one agent door per computer.
- The storage quota is requested from the Docker driver and is best-effort;
  when the driver refuses it, the computer still starts without the quota.
- Snapshots, clones and team sharing are not in this version.
- Docker itself may need admin rights to install once; after that, the computer
  has its own root and needs nothing from the host.
