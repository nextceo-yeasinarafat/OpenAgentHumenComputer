# OpenHumenComputer

**A real Linux computer for you and your AI — made by one command, owned by you, isolated from the machine you already use.**

[![The desktop of OpenHumenComputer](public/screens/01-desktop.png)](https://youtu.be/fhSloyFmxl8)

▶ **[Watch the demo on YouTube](https://youtu.be/fhSloyFmxl8)**

*The demo shows the desktop, the terminal with a local model and a coding agent, VS Code, and the settings — all inside the computer.*

---

## What it is

OpenHumenComputer gives an AI its own computer instead of your own.

One command builds a small UI on your machine. From that UI you choose a name, a password, cores, RAM and storage, and it builds a **real Ubuntu 24.04 computer** in a Docker container: a desktop, a browser, a terminal, a file manager, VS Code Server, a screen you can watch, and a door — an API token and an MCP server — through which an agent can work.

You keep your laptop. The AI gets a machine it can use fully: root inside, `sudo`, `apt`, `.deb` packages, files, a browser it can drive, a screen you can see. Nothing of your own disk is mounted into it.

## What you can do with it

| You want to… | Inside OpenHumenComputer |
| --- | --- |
| Give an agent a real target | API token + MCP: run commands, read and write files, open pages, take screenshots |
| Test something risky | a disposable Linux with its own root — a mistake costs a container, not your machine |
| Run a local model | install `llama.cpp`, Ollama or any runtime; the demo shows a local model running in the terminal |
| Use a coding agent | install the CLI you like (the demo uses Kilo) and let it work in a real checkout with VS Code |
| Install desktop software | `sudo apt install`, `dpkg -i` — a real `.deb` system, not a terminal-only VM |
| See what the agent did | the screen, the terminal history, the files, screenshots |
| Work from anywhere | open the same computer from another device on your network |
| Keep your work machine clean | everything lives inside the computer; the host only runs Docker |

## The one command

```bash
curl -fsSL https://raw.githubusercontent.com/nextceo-yeasinarafat/OpenAgentHumenComputer/main/docker/script/setup.sh | bash
```

It installs Docker when it is missing, clones this repository, builds the UI image, starts the UI container on port `1010` with the Docker socket mounted, waits for the page, and opens it.

Then, in the page: choose the name and the hardware, press **CREATE**, and watch the computer being built — every step is streamed, with a progress bar. The first build takes 15–25 minutes (curl and Python are compiled from source, Chrome and VS Code are downloaded); every later computer starts in seconds.

Requirements: Docker, `git`, `curl`, network, about 5 GB of free disk for the images.

## How it works

```
browser ──► one process on :1010 (the bridge)
              /            the built UI
              /api/*       state, create, files, token, services
              /ws/pty      a real terminal in the computer
              /ws/cdp      the DevTools socket of its Chrome
              /websockify  the picture of its screen
              /novnc/*     the noVNC client
                    │
                    ▼
             docker socket
                    │
                    ▼
      computer container (Ubuntu 24.04)
      Xvfb · x11vnc · noVNC · Chrome + CDP
      xterm · PCManFM · VS Code Server · MCP
      an account with a password and sudo
```

The UI and the bridge are the same process on the same port, so there is no proxy between the browser and the streams. The container is created with the resources you chose (`--cpus`, `--memory`, and `--storage-opt` when the Docker driver accepts it).

## Using it with an agent

- **Token** — `GET /api/token` (reset is intentionally not exposed in the UI).
- **Commands** — `POST /api/exec` runs a command inside the computer.
- **Files** — `/api/file`, `/api/fs`, `/api/upload`, `/api/media`, `/api/disk`.
- **Screen** — `/api/screenshot`, `/api/desktop`, `/api/open-url`.
- **MCP** — `/api/mcp/config`, `/api/mcp/status`; attach your agent client and use the computer's terminal, files, browser and desktop as tools.

The agent acts inside the computer. It does not see your host files, your host browser, or your host credentials.

## Screens

**The desktop** — a real Linux desktop in the browser; the dock holds the computer's applications.

![The desktop](public/screens/01-desktop.png)

**Settings → System Details** — the computer, its account and the hardware that was chosen.

![System details](public/screens/02-system-details.png)

**Chrome** — the computer's own browser, painted from its screen and driven through the DevTools protocol.

![Chrome inside the computer](public/screens/03-chrome.png)

**Terminal** — a real PTY inside the computer, opening in the computer user's home.

![The terminal](public/screens/04-terminal.png)

## Security model

- The computer is a container: its own users, home, root and network. No host directory is mounted into it by default.
- The password chosen in the UI is the account's password and the lock-screen password.
- The API token is a second, independent door; the UI deliberately has no "revoke" button.
- The repository carries no user data. `.env`, `.env.token`, `.venv`, `__pycache__`, `node_modules`, `dist` and `.vscode-server` are ignored; only code and the two fonts the image needs are committed.
- Images are built from public sources at build time; a computer is not a copy of anybody's machine.

## Limits, stated honestly

- One computer per host, one human at the desktop, one agent door per computer.
- The first image build is long; the interface says so instead of hiding it.
- The storage quota is requested from the Docker driver and is best-effort; without driver support the computer still starts.
- Snapshots, clones and team sharing are not in this version.
- Docker may need admin rights once to install. After that, the computer has its own root and needs nothing from the host.

## Repository

| Path | What lives there |
| --- | --- |
| `core/apps/` | the desktop: layout, dock, Chrome window, terminal, explorer, editor, media viewer, settings |
| `core/server/bridge.py` | the single server: UI, API, PTY, CDP, screen, files, token, services |
| `docker/system/` | the computer: screen, browser, terminal, explorer, VS Code, MCP, fonts, dependencies |
| `docker/ubuntu/` | the Ubuntu image the computer is built from |
| `docker/ui/` | the UI image and its one-command entrypoint |
| `docker/script/setup.sh` | the short command above |
| `public/` | wallpaper, icons, and the demo video |
| `devpost/` | the planning documents: `scope.md`, `prd.md`, `spec.md` |

## Documentation

- [`devpost/scope.md`](devpost/scope.md) — the problem, the kernel, what "done" means.
- [`devpost/prd.md`](devpost/prd.md) — the product as a person experiences it.
- [`devpost/spec.md`](devpost/spec.md) — how it is built, how it fails, how it recovers.

## License

MIT — see [`LICENSE`](LICENSE).

## Name

The product is **OpenHumenComputer**. The repository is **OpenAgentHumenComputer**; the computer container is named `openagentcomputer` and the UI container `openagenthumencomputer`.
