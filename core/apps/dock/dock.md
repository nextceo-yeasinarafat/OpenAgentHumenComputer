# dock (`openagenthumencomputer/core/apps/dock`)

The dock of the computer: one piece of liquid glass at the bottom of the
desktop, carrying the apps of the machine.

## Files

| File | What it does |
| --- | --- |
| `core_dock.ts` | the apps of the dock, and the only place that knows them: id, label, icon, order |
| `core_dock.tsx` | the glass bar itself and the tiles — the spring, the lifted icon, the name tag, the running dot |
| `dock.md` | this document |

## The apps, in the order they stand

| App | Icon | Opens |
| --- | --- | --- |
| Chromium | `/dock_icons/chromium.svg` | the browser of the computer |
| VS Code | `/dock_icons/vscode.svg` | the editor server of the computer |
| Terminal | `/dock_icons/terminal.svg` | a real shell, one tab at a time |
| Explorer | `/dock_icons/explorer.svg` | the real folders of the machine |
| Settings | `/dock_icons/settings.svg` | the settings window of the machine |

A press of a tile belongs to the page behind the dock
(`core/apps/layout/core_layout.tsx`), which opens the window of that app.

## The motion and the dots

The dock moves the way the old dock moved. The bar springs up from the bottom
edge when the desktop appears; an app lifts and grows under the pointer; its
name appears above it in a small glass tag; and the press settles the tile
back at once.

Under an app whose window is open on the screen stands a **red dot**; when
that window is minimized into the dock the dot turns **white**. A window that
is closed has no dot. The desktop hands both lists to the dock —
`runningAppIds` and `minimizedAppIds` — from the state of the five windows.

## When a window is full screen

The dock steps down only while one of the windows fills the screen; without a
full-screen window it never leaves, however many windows stand on the screen.
The desktop passes that state as `autoHide`. A strip 12 px tall at the bottom
edge brings the dock back under the pointer, and it steps down again a moment
after the pointer leaves. A minimized window does not count as full screen:
restoring it brings the dock back at once.
