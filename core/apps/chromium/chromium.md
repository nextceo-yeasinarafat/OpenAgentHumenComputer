# Chromium (openagenthumencomputer/core/apps/chromium)

The window of the browser of the computer. It is not a browser of its own: the
computer of the container runs a real Chromium, and this window shows that
browser and drives it. Nothing here is a demo.

The picture of the browser comes from the screen of the computer (noVNC), so the
browser is seen with its own tab strip, its own address bar, its own menus and
its own dialogs. The tabs, the tab in front and the place of the browser window
come from the DevTools protocol (CDP) of that same browser.

The browser of the computer runs only while this window is open. Closing the
window closes the browser of the computer (so the computer keeps no memory and
no processor for a browser that nobody looks at), and the browser writes its own
session on the way out: the tabs it opens again are the tabs of that session,
pinned or not — a pin is a mark of the browser, never a reason to keep a browser
alive.

```
the Chromium icon of the dock
        │  (core_layout.tsx → useComputerChromium + ComputerChromium)
        ▼
computer_chromium.ts   ← the window: size, place, traffic lights, resize
        │
        ├── computer_chromium.tsx   ← the frame of liquid glass + the three lights + the body
        │        ├── chromium_window.tsx   ← the picture of the browser inside the body
        │        │        ├── chromium_window.ts   ← the state of the browser (CDP)
        │        │        │        ├── chromium_cdp.ts   ← the DevTools protocol (WebSocket → /ws/cdp)
        │        │        │        └── chromium_sleep.ts   ← the sleep of the browser (shell in the computer)
        │        │        ├── chromium_vnc.ts   ← the picture of the screen (WebSocket → /websockify) and its clipboard
        │        │        └── chromium_loading.tsx   ← the black page of the opening
        │        │                 └── chromium_loading.ts   ← how long that page is shown
        │        └── chromium_filepicker.tsx   ← the picker that answers the ask for a file
        │                 └── chromium_filepicker.ts   ← the upload into the computer
        ▼
the real Chromium of the container + its screen
```

## What each file does

### 1. `computer_chromium.ts` — the head of the window (state + traffic lights)
- The state of the window lives here: open, close, minimize, maximize, drag and
  resize from the corner, with the timers of the animations and the smallest
  size.
- The three traffic lights act through this file: `close()`, `minimize()`,
  `toggleMaximize()`.
- `open()` is safe to call at any time: a window that is closing, is being made
  small or is already open comes back at once, and the timer of a close that
  was left behind is cleared. The window of the UI can therefore never be left
  half open or half closed.
- `setScreenAspect(width, height)` keeps the body in the shape of the screen of
  the computer, so the picture fills the window and is never stretched.
- Closing the window puts the browser of the computer to sleep
  (`chromium_sleep.ts`); the state of the window does not touch the computer by
  itself.
- `useComputerChromium()` returns the state, the actions and the handlers, and
  `ComputerChromiumController` is the type of it.

### 2. `computer_chromium.tsx` — the frame of the window
- The frame of the window is liquid glass: a translucent dark pane
  (`rgba(18, 18, 20, 0.52)`) over `backdrop-filter: blur(28px) saturate(180%)`,
  a `0.5px` hairlight border and a deep shadow under the window, so the window
  looks smooth and not like a flat black box.
- The bar of the window is **solid `#0E0E0E`**, the colour of the page of the
  browser: the tabs and the buttons of the browser under it stand on the same
  dark ground, and nothing of the desktop shows through the bar.
- The three traffic lights stand on the bar with **no pill, no background and
  no shadow** behind them: only the coloured lights, the same as the terminal.
- The body is opaque `#0e0e0e` and holds the picture of the browser.
- The window keeps the shape of the screen of the computer: it is given the
  shape of the picture by `setScreenAspect`, so the picture fills the body
  exactly and no side of it stays empty.
- A full screen window has no rounded corners, no border and no resize handle,
  and it keeps its bar: the bar never hides itself, so the picture never changes
  its size under the pointer while the tabs of the browser are used.
- Going full screen and coming back are one movement of 260ms
  (`cubic-bezier(0.32, 0.72, 0, 1)`) of the place and the size of the window,
  so the window is seen growing into the screen and shrinking back into its own
  size. The movement is off while the window is dragged or resized.
- The red light closes the window, the yellow one makes it small, the green one
  makes it full screen and gives it back.

### 3. `chromium_window.ts` — the state of the browser (CDP)
- `useChromiumWindow(enabled)` connects to the DevTools protocol of the browser
  of the computer while the window of the UI is open, and puts the connection
  away when the window is closed.
- It gives back the tabs of the browser, the tab in front, `pageRect` (where the
  browser window sits on the screen of the computer, in the pixels of that
  screen) and the state of the connection.
- `pageRect` is read again every 400ms, so the picture is always cut at the
  place where the browser window really is, even when the user moves or grows
  the browser inside the computer.
- **The browser of the computer runs only while the window is open.** Opening
  the window wakes the browser up (`wakeComputerBrowser`, which asks the machine
  to start it at once), and closing the window puts it to sleep (`sleep` →
  `sleepComputerBrowser`): the browser itself is closed, the mark of the sleep is
  set, and the computer keeps it closed until it is asked for again.
- The stream of the browser is kept open until the sleep is over, so the sleep
  still has a browser to close. A sleep that fails still closes the window: the
  mark is set first, so no watch of the computer starts a browser behind it.
- **The window of the UI is never closed from here.** A browser that goes away
  (a crash, a restart of the computer) does not take the window with it; the
  page of the loading stays in it and the browser is asked for again every five
  seconds. The computer starts its own browser again when it goes away, so the
  window comes back by itself.

### 4. `chromium_window.tsx` — the picture of the browser
- It gives `chromium_vnc.ts` the box of the body and shows the picture of the
  screen of the computer in it.
- The keys of the user go into the picture (the focus is given to it as soon as
  it is there), so typing in the browser of the UI is typing in the browser of
  the computer.
- `pageRect` is handed to `chromium_vnc.ts` every time it changes, so the cut of
  the picture follows the browser window.
- The page of the loading is drawn over the picture (`chromium_loading.tsx`)
  until the picture and the browser are both there.

### 5. `chromium_vnc.ts` — the picture of the screen
- It loads noVNC from the computer itself
  (`/novnc/core/rfb.js`) and opens the stream of the picture through the
  bridge (`/websockify`).
- The picture is cut exactly at the browser window of the computer and scaled
  to the box of the UI. The browser window of the computer is 1920x1080, and
  the window of the UI opens at 1440x810, so the page is shown at three
  quarters of its size: clean letters and a page that is seen whole.
- The mouse pointer of the computer is drawn smaller by the same measure, so it
  keeps the size it has on the screen of the computer.
- The scale of noVNC is kept by hand (`_updateScale`), the cut is made again
  every time the box changes (`_updateClip`, `ResizeObserver`), and the whole
  thing is put away with the window (`disconnect()`).
- A picture that drops comes back on its own: it is tried again and again,
  waiting longer and longer (1.2s up to 5s) until the window is closed. A window
  that is open is never left with a black box in it for good.

### 6. `chromium_loading.ts` — when the black page is shown
- `useChromiumLoading({ isOpen, isReady })` answers one question: should the
  page of the loading be in front of the window?
- Every opening shows it for **three seconds at the least**
  (`CHROMIUM_LOADING_MINIMUM_MS`) — even when the picture and the browser are
  ready at once and the tabs are already open behind it — and then it fades
  away over the picture (`CHROMIUM_LOADING_FADE_MS`, 220ms), so the opening ends
  smoothly instead of jumping.
- If the picture or the browser is **not** ready, the page stays for as long as
  that takes. A window that is opened while the browser is still starting shows
  the page until the browser is there, and never a black window.
- A picture that is lost for a moment does not flash the page: the page only
  comes back after 2s without it. A browser that was already seen in the window
  does not bring the page back when its DevTools stream blinks: the browser of
  the computer goes away when its last tab is closed and the computer starts it
  again, and the picture of the screen stays whole through that.

### 7. `chromium_loading.tsx` — the black page
- A page of `#0E0E0E` with the mark of the computer in the middle of it:
  `openagenthumencomputer/public/chromium_loading/chromium_loading.svg`, the Ubuntu
  dots of the computer, turning once every five seconds, drawn at `96px`.
- The mark breathes gently (2.4s) and the page fades in (220ms), so the window
  looks alive while it opens. Both stop for a user who asked for less motion
  (`prefers-reduced-motion`).

### 8. `chromium_cdp.ts` — the DevTools protocol
- The client of the protocol: it opens one WebSocket to `/ws/cdp` of the bridge,
  asks for the tabs (`Target.getTargets`, `Target.setDiscoverTargets`), follows
  them through the events of the browser, attaches to the tab in front and
  brings a tab to the front when the user asks for it.
- `pageRect()` reads the measures of the page and the bounds of the browser
  window (`Browser.getWindowForTarget`) and gives them in the pixels of the
  screen of the computer.
- It asks for the list of the tabs again every 1.5s and queues nothing for ever:
  a question that is not answered in 5s is given up.
- It reaches the browser again after the stream drops (12 tries, 1.2s apart),
  and it loads the modules of the URL of the bridge (`VITE_BRIDGE_URL`,
  `VITE_OPEN_COMPUTER_TOKEN`) when the UI is not on the same origin as the
  bridge.
- `command(method, params)` is the one door for the rest of the DevTools
  protocol: the sleep of the browser closes the browser with it.
- **The dialog for a file is intercepted.** Every page session is given
  `Page.setInterceptFileChooserDialog {enabled:true}`, so the browser of the
  computer never opens its own GTK dialog: the ask arrives as
  `Page.fileChooserOpened` (the input's `backendNodeId` and single/multiple),
  and `setFiles(backendNodeId, paths, sessionId)` answers it with
  `DOM.setFileInputFiles`. An empty list is the cancel of the dialog. The
  picker of the UI (`chromium_filepicker.tsx`) is what the window shows in that
  moment.
- This file is the client of the first version of the project, moved here
  unchanged in behaviour: the same messages, the same events and the same
  handful of commands are used by the window.

### 9. `chromium_sleep.ts` — the browser sleeps with the window
- `sleepComputerBrowser(client)` is what the red light of the window calls: it
  asks the machine for the sleep of the browser
  (`POST /api/services/stop/browser` → `control.sh stop browser` →
  `chromium/control.sh sleep`), so the mark is set and the browser is closed in
  the same ask — the exact ask the switch of the settings page makes. A bridge
  that does not know the service is left with the mark (`POST /api/exec`) and
  the close of the browser itself (`Browser.close`).
- The mark comes first: the watch of the computer starts the browser again
  within two seconds when it disappears, so the mark is what tells it that the
  browser went away on purpose. The controller of the browser in the computer
  (`/opt/open-computer/chromium/control.sh`) reads the same name, and the
  settings page stops the browser with the same sleep
  (`docker/core_systeam/control.sh`).
- The browser is closed the way it closes itself, so it writes its session on
  the way out; the next wake opens it with that session, and the tabs of it,
  pinned or not, are the business of the browser.
- `wakeComputerBrowser()` is what the opening of the window and the Chromium
  icon of the dock call: it asks the machine to start the browser now
  (`POST /api/services/start/browser` → `control.sh start`), which takes the
  mark away and starts a browser at once, without waiting for the watch. A
  bridge that does not know the service is answered by the mark alone
  (`POST /api/exec`).

### 10. `chromium_filepicker.tsx` / `.ts` — the file the page asked for
- The page asks for a file (an `<input type=file>` was used), and the answer is
  the picker of the UI, never the GTK dialog of the computer: the folders of
  the computer are read with the explorer's own bridge (`/api/fs`), a folder
  is opened by a press and a file is chosen by a press (a double press chooses
  it at once).
- **Upload from this computer** takes the files of the machine of the user
  (the `<input type=file>` of the page of the UI), gives each one to the bridge
  (`POST /api/upload`, base64, 32 MB at most) and the file is written into the
  folder that is open, owned by the account of the computer; the picker then
  chooses what was uploaded.
- **Choose** answers the ask with `DOM.setFileInputFiles` (through
  `setFiles` of the CDP client); **Cancel** answers with an empty list, and
  the input is left without a file.
- A page that asks while more than one file is allowed
  (`selectMultiple`) is a picker with many choices; a single one replaces the
  choice of the one before.

## Where it is linked

- `openagenthumencomputer/core/apps/layout/core_layout.tsx` imports
  `../chromium/computer_chromium.tsx` and
  `../chromium/computer_chromium.ts`, keeps `useComputerChromium()`
  for the whole desktop, and renders `ComputerChromium` above the terminal and
  the explorer (`zIndex` 52 for the app in front, 50 behind).
- The `chromium` item of the dock calls `chromiumWindow.open()` and
  `wakeComputerBrowser()`, so the dock opens this window and starts the real
  browser at once — even when the window was already open and the browser had
  been turned off in the settings. The little dot under the icon is lit while
  `chromiumWindow.isOpen` is true.
- `openagenthumencomputer/core/apps/terminal/window_chrome.ts` is the helper that
  hides the bar of a full screen window and brings it back near the top of the
  screen. The terminal uses it; the window of the browser keeps its bar and
  does not.
- The window classes all start with `oc-chromium`, so they never clash with the
  terminal (`oc-terminal`), the explorer (`oc-finder`) or the dock.

## The bridge behind it

| Call | What it gives |
| --- | --- |
| `WS /ws/cdp` | the DevTools protocol of the browser of the computer, passed through by the bridge (`openagenthumencomputer/core/server/bridge.py`): the bridge asks the forwarder of the computer on port `9223` for the address of the browser (`/json/version`) and streams the protocol from there |
| `WS /websockify` | the picture of the screen of the computer, from noVNC on port 6080 of the container |

The bridge reaches the computer at the address Docker gave it (the container
network), starts the screen and the browser of the computer when they are not
running, and passes the two streams and the files of noVNC (`/novnc/*`) through.
| `GET /novnc/core/rfb.js` | the module of noVNC, served by the computer itself |
| `POST /api/exec` | one line of shell in the computer: the mark of the sleeping browser is put there with it, and taken away when the service of the browser is not known (`chromium_sleep.ts`) |
| `POST /api/services/start/browser` | the browser is started now and the mark of the sleep is taken away: the same ask the settings page makes with its switch |
| `POST /api/upload` | one file of the machine of the user written into a folder of the computer (`dir`, `name`, base64 `data`): the picker of the file dialog carries the file with it |

The dev and preview servers of the UI proxy `/ws`, `/websockify` and `/novnc`
(`openagenthumencomputer/vite.config.ts`), so the window only ever talks to its own
origin.

## Note

- This folder lives inside the UI project (`openagenthumencomputer/core/apps`), so a
  file in it imports `react` and the icons from `openagenthumencomputer/node_modules`
  like any file of the UI can. Nothing has to be installed here.
- The first version of the browser window
  (the first version of the project) has been removed: this folder is the
  window now.
- The browser of the computer is installed and started by
  `docker/ubuntu` of this project (`install.sh`, `run.sh`,
  `control.sh`) with `--remote-debugging-port=9222`, a device scale of 2 and a
  window of 1920x1080, so its page lays out in Full HD on the 4K screen of the
  computer.
- The browser does not run while the window of the UI is closed.
  `control.sh supervise` starts it again when it is gone, and it leaves it
  alone while the mark of the sleeping browser is in the computer; the browser
  comes back with its session (`--restore-last-session`) when it is started
  again after a sleep.
