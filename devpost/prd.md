---
status: approved
project: OpenHumenComputer
---

# Product requirements — OpenHumenComputer

## The first five minutes

1. The user runs one command. Docker is prepared if it is missing; the repository is cloned; the UI image is built; a page opens at `http://<host>:1010`.
2. The page shows a box: the name of the computer, a user name, a password, the country and language, then cores, RAM, storage and GPU share.
3. The user presses **CREATE**. The box becomes a terminal: every step of the making is written as it happens, and a bar of `+` fills from left to right with a percentage on the right.
4. When the making is done, the page moves to the desktop by itself. There is no second login and no reload.

## The box

- Four pages, one decision each: identity → hardware → summary → making.
- Fields are validated where they are typed; the summary says back exactly what was chosen.
- The making page never hides a failure: a failed step is red and says why, and the last line says `INCOMPLETE`.
- Logs follow themselves; the scrollbar is invisible on purpose.

## The desktop

- A black ground with dotted guides that meet in `+` marks — a frame, not a wallpaper.
- A dock with the computer's applications; every window is a real application served by the computer:
  - **Chrome**, painted from the computer's screen, driven through the DevTools protocol;
  - **Terminal**, a real PTY (`/ws/pty`) inside the computer, opening as the computer's user in its home;
  - **Files**, the real file manager, with open, upload, download and media preview;
  - **VS Code**, the real VS Code Server of the computer;
  - **Text editor** and **media viewer** for what the agent produced;
  - **Settings → System Control** for the computer, the screen, the browser, MCP and VS Code.
- The desktop is the human's seat. The API token and MCP server are the AI's seat. Both look at the same computer.

## Feel

- It should feel like a computer someone handed you, not a chat product: names, files, windows, time.
- Dark, quiet, no decoration that does not mean something. Pure black behind the Linux screen.
- The loading of a window is honest: while the computer has no picture, the window says so; when it has one, the picture appears.

## Behaviour

- Bridge, computer and screen start together; a screen that lost its VNC process is restarted by the bridge.
- A refresh does not restart the making and does not lose the computer: the page asks the machine what exists.
- The password chosen in the box is the password of that computer and of its lock screen.
- Stopping and starting services is a button, not a shell command.

## Edge cases the product owns

- Docker missing → the setup command installs it, asking for admin once.
- Port already in use → a clear message before anything is touched.
- Build fails → the real error line is kept, the making stops, nothing half-made is presented as ready.
- Long first build → the page says it is the long part and keeps streaming, so the user can walk away and come back.
- A dead X server or VNC process → the next ensure restarts the screen instead of showing a frozen window.

## Now and later

**Now:** one computer per host, real Ubuntu 24.04, root inside, browser/terminal/files/editor, API token, MCP, local model keys, skills folder, screen and browser recovery.

**Later:** snapshots and clones, several computers per host, sharing a computer with a teammate, GPU workspaces.

## What success looks like

A first-time user runs one command, chooses 4 cores and 8 GB, watches the bar fill, and lands on a desktop where Chrome opens a page, a terminal installs a `.deb`, and an agent — through the token — runs a test inside that computer while the host stays exactly as it was.
