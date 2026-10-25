# Terminal (openagenthumencomputer/core/apps/terminal)

The whole terminal app. It is not an app of its own: it is wired straight into
the UI (`openagenthumencomputer`), and inside it connects to the real terminal of the
Linux computer of the container. Nothing here is a demo.

```
the Terminal icon of the dock
        │  (core_layout.tsx → useComputerTerminal + ComputerTerminal)
        ▼
computer_terminal.ts   ← the window: size, place, traffic lights, resize
        │
        ├── computer_terminal.tsx   ← the whole window UI (frame + header + tabs + screen)
        │        ├── terminal_tabs.tsx   ← the strip of tabs + the "+" button
        │        │        └── terminal_tabs.ts   ← the state of the tabs (id/title)
        │        └── terminal_content.tsx  ← the screen of each tab (pane) + its style
        │                 └── terminal_content.ts  ← the real shell (WebSocket → /ws/pty)
        ▼
the real shell of the container (bash)
```

## What each file does

### 1. `computer_terminal.ts` — the head of the window (state + traffic lights)
- The state of the window lives here: open, close, minimize, maximize.
- The three traffic lights (red, yellow, green) act through this file:
  `close()`, `minimize()`, `toggleMaximize()`.
- Dragging the window and resizing it from the corner (`dragHandlers`,
  `resizeHandlers`), with clamping: the window can never be lost off screen and
  always keeps a usable size.
- The animation timers (close/minimize) and the minimum size are here too.
- `useComputerTerminal()` returns the state, the actions and the handlers, and
  the `ComputerTerminalController` type is what the rest of the window uses.

### 2. `computer_terminal.tsx` — the whole window UI
- This is the window: frame, header, the markup of the traffic lights, the tab
  strip and the screen, all put together.
- The drag is on the header (`dragHandlers`), the resize is on the corner
  (`resizeHandlers`).
- ⌘T / Ctrl+T opens a tab, ⌘W / Ctrl+W closes a tab (and the window itself when
  it was the last one).
- When the window is closed and opened again, `resetTabs()` gives it one fresh
  tab and one fresh shell.
- When it is maximized, `useWindowChromeAutoHide` hides the header on its own.
- The CSS of the window, the header, the traffic lights and the animations is in
  this file.
- The three traffic lights stand directly on the header: there is no pill, no
  background, no blur and no shadow behind them any more, only the coloured
  lights themselves. The header keeps an opaque `#0e0e0e` background, so nothing
  of the desktop behind the window shows through the header.
- The line under the header is a `0.5px` hairline at 6% white, so the header and
  the screen join without a hard seam.
- The window asks the browser for smooth text (`-webkit-font-smoothing`,
  `-moz-osx-font-smoothing: grayscale`, `text-rendering: optimizeLegibility`),
  and the open/hide transitions are eased, so the window looks clean and
  macOS-like rather than snapping.

### 3. `terminal_tabs.tsx` — the strip of tabs
- Every tab is the same glass family as the finder: a clear, slightly blue
  gradient (`rgba(125, 211, 252, …)` down to `rgba(14, 165, 233, …)`) with
  `blur(10px) saturate(150%)`, an active state, a hover state, the `×` that
  closes it and the `+` button. The `+` uses exactly the same glass as a tab
  that is not active. Because the header behind them is opaque, the glass reads
  against the dark header instead of letting the desktop show through the way
  it does in the finder.
- Both the tab and the `+` have a `0.5px` border at 10% white (16% on the active
  tab), and no `box-shadow` at all, so no shadow appears inside or around the tab
  strip and the white line stays a hairline.
- `+` calls `onAdd()`, which opens a new tab. `addTab` takes an optional title,
  so the window passes it as `() => addTab()`: a click event must never be read
  as a title.
- However many tabs are opened, the strip stays inside the window and scrolls
  smoothly (with no visible scrollbar), so the `+` button is never pushed away.
- The CSS of the tabs is in this file.

### 4. `terminal_tabs.ts` — the state of the tabs
- A tab is named after the folder its shell is in, in the short form of the
  address (`terminalTabTitleForPath`): the home is `~`, a folder inside it is
  `~/Documents`. The shell says where it is before every prompt, so the name
  follows the shell as it moves; the whole address shows when the pointer
  stays on the tab.
- The list of tabs (`{ id, title, path }`), the active tab, `addTab`,
  `closeTab`, `selectTab`, `resetTabs` and `updateTabCwd` are here.
- A tab is not only a label: its `id` is what `terminal_content.*` uses to find
  the shell that belongs to it. So opening a tab opens a real terminal, and
  closing a tab closes that shell.

### 5. `terminal_content.tsx` — the screen of a tab
- It makes one pane per tab and shows the pane of the tab that is in front (the
  others are hidden but stay alive).
- The connections are created here: `createTerminalContent()` is called the
  first time a tab is shown, the connection of a closed tab is disposed, and
  every connection is disposed when the window is closed.
- Switching tabs measures the pane (fit), redraws it (refresh) and gives it the
  keyboard, so typing works right after switching.
- `.oc-terminal__content`, `.oc-terminal__pane` and the xterm CSS are here, so
  the screen looks like a real terminal (black background, one font, smoothed
  text: `-webkit-font-smoothing`, `-moz-osx-font-smoothing: grayscale` and
  `text-rendering: optimizeLegibility` on `.xterm`).

### 6. `terminal_content.ts` — the real connection
- No demo text here. It connects straight to the real shell of the container:
  `ws://<host>/ws/pty` (bridge: `openagenthumencomputer/core/server/bridge.py`).
- The bridge starts every shell with a `PROMPT_COMMAND` that announces the
  folder before every prompt as an OSC 7 sequence (`file://host/path`). The
  sequence is read out of the stream (`onCwdChange`, reported to the tab of
  the shell) and never written to the screen; one split over two chunks of the
  socket is held until the rest arrives.
- It builds the xterm.js terminal, fits it with FitAddon and sends the new
  cols/rows through a ResizeObserver when the window is resized.
- The data is JSON: it sends `input` and `resize`, and reads `output`, `exit`
  and `error`.
- If the connection drops it reconnects (5 times at most), and it writes a
  message on screen when the shell cannot be reached.
- `dispose()` clears everything (timer, observer, socket, terminal).

## Where it is linked

- `openagenthumencomputer/core/apps/layout/core_layout.tsx` imports
  `../terminal/computer_terminal.tsx` and
  `../terminal/computer_terminal.ts`, and renders
  `useComputerTerminal()` + `<ComputerTerminal controller=... />`.
- The `terminal` item of the dock (`core/apps/dock/core_dock.tsx`) calls
  `terminal.open()`, which opens exactly this window.

## Notes

- This folder lives inside the UI project (`openagenthumencomputer/core/apps`), so
  a file in it resolves `react` and `@xterm` from
  `openagenthumencomputer/node_modules` like any file of the UI. There is nothing
  to install here.
- The home of the computer is not written anywhere in this folder: the shell
  itself says where it starts (the first OSC 7 announcement), and the tabs
  learn it from that, so the terminal is right for any user the computer was
  made with.
- The auto-hide hook of the window (`useWindowChromeAutoHide`) lives in
  `window_chrome.ts` of this folder, and the `.tsx` file imports it from there.