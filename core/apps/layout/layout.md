# layout (`openagenthumencomputer/core/apps/layout`)

The desktop of a made computer, and the one page that assembles it.

## Files

| File | What it does |
| --- | --- |
| `core_layout.ts` | the wallpaper of the desktop, handled so the page can only wear it well: the photo above, the ink dots beneath, whole on every screen |
| `core_layout.tsx` | the desktop itself: the ground, the dock, and every window of the machine (Chromium, VS Code, Terminal, Explorer, Text Editor, Media Viewer, Settings) |
| `layout.md` | this document |

## How the windows live here

The window that was touched last stands in front of the others
(`activeApp`). The dock hands over the presses — the browser, the editor, the
terminal, the explorer and the settings open from their tiles — and the
explorer hands the folders it cannot open itself to the terminal
(`Open in Terminal`) and the files to their window: a picture, a PDF, a video
or a sound to the viewer (`core/apps/media_viewer`), any other text to the
editor (`core/apps/text_editor`), both with a double press on the file.

The page is reached by state, not by a route: `core/apps/core/main.tsx`
asks the bridge whether the computer exists and keeps every refresh on this
page, so a made computer can never be made twice by mistake.
