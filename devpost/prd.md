---
status: approved
project: OpenHumenComputer
---

# Product requirements — OpenHumenComputer

## The first five minutes

1. The user runs one command. Docker is prepared if it is missing; the repository is cloned; the UI image is built; a page opens at `http://<host>:1010`.
2. The page asks for the computer's name, the account, the password, the country and the language — then the hardware: cores, RAM, storage and GPU share.
3. The user presses **CREATE**. The box becomes a terminal: every step of the making is written as it happens, and a bar of `+` fills with a percentage.
4. When the computer is up, the page moves to the desktop by itself — no second login, no reload.

## The box

- Four pages, one decision each: identity → hardware → summary → making.
- Fields are validated where they are typed; the summary says back exactly what was chosen.
- The making never hides a failure: the failed step is red and says why, and the last line says `INCOMPLETE`.
- Logs follow themselves and the scrollbar is invisible on purpose.

## The desktop

- A black ground with dotted guides that meet in `+` marks; the Linux screen behind the windows is pure black.
- The dock holds the computer's applications; every window is a real application inside the computer:
  - **Chrome**, painted from the computer's screen and driven through the DevTools protocol;
  - **Terminal**, a real PTY that opens as the computer's user in its home, with tabs;
  - **Files**, the real file manager, with open, upload, download and media preview;
  - **VS Code**, the real VS Code Server of the computer;
  - **Text editor** and **media viewer** for what the agent produced;
  - **Settings** — the API token, the MCP configuration, the system details, the hardware analysis and the System Control buttons.
- The desktop is the human's seat. The token and MCP are the agents' seat. Many agents can attach to the same computer while the human watches.

## Behaviour

- Bridge, computer and screen start together; a screen that lost its VNC process is restarted by the bridge.
- A refresh does not restart the making and does not lose the computer: the page asks the machine what exists.
- The password chosen in the box is the password of that computer and of its lock screen.
- Service start, stop and restart are buttons in System Control, not shell commands.
- A skills folder in the computer's home is readable by the agent and survives restarts of the desktop.

## Edge cases the product owns

- Docker missing → the setup command installs it, asking for admin once.
- Port already in use → a clear message before anything is touched.
- Build fails → the real error line is kept, the making stops, nothing half-made is presented as ready.
- Long first build → the page says it is the long part and keeps streaming, so the user can walk away and come back.
- A dead X server or VNC process → the next ensure restarts the screen instead of showing a frozen window.

## Now and later

**Now:** one computer per host, real Ubuntu 24.04, root inside, browser/terminal/files/editor, API token, MCP, several agents on one computer, a skills folder, local model keys, screen and browser recovery, cross-device viewing.

**Later:** snapshots and clones, several computers per host, sharing a computer with a teammate, cloud VPS integration with advanced isolation, GPU workspaces.

## What success looks like

A first-time user runs one command, chooses 4 cores and 8 GB, watches the bar fill, and lands on a desktop where Chrome opens a page, a terminal installs a `.deb`, one agent runs a test through the token while another edits files, and the host stays exactly as it was.
