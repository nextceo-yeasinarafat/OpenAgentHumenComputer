# Explorer (openagenthumencomputer/core/apps/explorer)

The finder of the computer. One window that shows the real folders of the Linux
container, the way a Finder window of macOS does it: the places of the computer
on the left, the folder itself on the right, icons or a list, and the free space
of the disk at the bottom.

Nothing here is a mock-up: every name, size, date and free-space number comes
from the computer itself, through the bridge (`openagenthumencomputer/core/server/bridge.py`).

The window keeps the look of the first explorer of the project (which has
since been removed): the same 18px corners, the same 56px toolbar with the two
arrows of the history, the same rounded glass sidebar with the storage at its
bottom, and the same three glass traffic lights floating over the sidebar. The folders and the files wear the same icons as well: the MacTahoe
folder of the macOS GTK icon theme for a folder, a Hugeicons glyph for a file of
each kind.

What is different is what shows through it. The body of the window is black
where the folders are, but the finder has no colour of its own: it is clear
glass with a little blue in it, so the screen of the computer behind the window
shows through it, blurred. The black body is painted around the finder and not
under it — the finder itself closes the small frame around it — so the glass is
always looking at the screen and never at its own window. The storage button at
the bottom of the finder is a blurrier piece of the same glass, so it reads as a
button and not as a row of a menu.

The toolbar keeps the glass of the dock
(`openagenthumencomputer/core/apps/dock/core_dock.tsx`)
for the two pills that sit in it — the arrows and the view buttons — so those are
the same material as the dock.

```
core_layout.tsx  (the desktop)                         (dock: the Explorer icon)
    │                                                        │
    │                                                        ▼
    │                                            computer_explorer.ts
    │                                            useComputerExplorer() → open()
    ▼
computer_explorer.tsx   ← the window: sidebar, toolbar, folder, lights, corner
    │
    ├── explorer_finder.tsx   ← the sidebar (places + storage)
    │        ├── explorer_finder.ts    ← the places and the click that opens one
    │        └── explorer_stroage.tsx  ← the storage button at the bottom
    │                 └── explorer_stroage.ts   ← the real disk (GET /api/disk)
    │
    ├── explorer_folders.tsx  ← the folder: icons or a list, with a skeleton
    │        └── explorer_folders.ts   ← the real folder (GET /api/fs)
    │
    ├── explorer_actions.tsx  ← the right-click popup and the questions it asks
    │        └── explorer_actions.ts   ← the real mkdir, rename, cut, copy, move, delete
    │
    ├── explorer_hidden.tsx   ← the Ctrl+H key
    │        └── explorer_hidden.ts    ← the dot names, hidden or shown
    │
    └── explorer_style.tsx    ← the two buttons that switch the view
             └── explorer_style.ts      ← the styles those buttons are given
```

## What each file does

### 1. `computer_explorer.ts` — the real work of the window

- The window itself: open, close, minimize, maximize, drag by the toolbar or by
  the heading of the sidebar and resize from the corner. The corner is clamped,
  so a window can never be dragged off the screen and can never become smaller
  than a usable size.
- The movement is framer-motion, but the values are computed here:
  `explorerWindowTarget()` returns what the window has to be at that moment —
  where it is, how big it is, and how it is shown (a spring for everything,
  instantly while the pointer is dragging or resizing). Closing is not a timer:
  the window plays itself out, and the app says the movement is over through
  `finishClose()`. Minimizing sinks the window into the dock by moving its place,
  never by a transform, so the transform is free for the hand.
- Dragging never re-renders the window. While the hand is on the toolbar the
  window is moved by two motion values (`dragX`, `dragY`) that framer-motion
  writes straight into the transform, and only when the hand lets go does the
  place of the window become the new place — before the next frame is drawn, so
  nothing jumps and nothing lags behind the hand.
- `useExplorerNavigation(finder)`: the whole work of the two arrows of the
  toolbar. The window remembers the folders behind it and the folders ahead of
  it, `goBack` and `goForward` walk between them, and walking somewhere new
  forgets the folders that were ahead, the way a real file browser behaves.
- The size of the desktop is tracked (`useViewportSize`), so maximizing fills
  the real screen even after the browser window is resized.
- `useComputerExplorer()` gathers everything the window needs — the window
  state, the place of the finder, the folders of that place, the storage of the
  computer and the view that is chosen — and `computer_explorer.tsx` only draws
  the result. The `dragHandlers` it hands out are used twice, the way the first
  explorer does it: on the toolbar and on the heading of the sidebar.
- Opening a folder and opening a file are not the same call here: a folder makes
  `path` the folder that is read, and a file is handed to the desktop
  (`onOpenFile`), which shows its text in the editor of `core/apps/text_editor`
  or its bytes in the viewer of `core/apps/media_viewer` (a picture, a PDF, a
  video or a sound).

### 2. `computer_explorer.tsx` — the window itself

- Draws one `motion.section` and hands it the value from `computer_explorer.ts`
  (`initial`, `animate`, `transition`), so opening, minimizing, closing,
  maximizing, dragging and resizing are all the same animation of the same
  window.
- The three glass traffic lights are **not** in a titlebar: they float over the
  sidebar, 16px from the left and 32px from the top, on a rounded glass pill with
  no shadow of its own — the way the first explorer has them. Red closes, yellow
  minimizes, green maximizes and restores. A glyph appears inside each one under
  the pointer.
- The sidebar comes first and takes the full height of the window, minus the
  small frame of the window around it; the main column sits next to it: a 56px
  toolbar and the folder below it.
- The toolbar holds two groups: the two arrows of the history on the left — the
  way back and the way forward, quiet while there is nowhere to go — and the view
  control (`explorer_style.tsx`) on the right. The middle of the toolbar is
  empty, and the toolbar is the handle the window is dragged by.
- The body of the window is black where the folders are and clear where the
  finder is. The finder closes the frame around itself, so the small band
  between the finder and the edge of the window is the black body of the window;
  that frame reaches 28px past the finder, which is what keeps the screen from
  showing through the four corners of the window.
- The corner in the bottom right is the resize handle. It is not there while
  the window is maximized, because then there is nothing to resize.
- All the CSS of the window, its toolbar, its traffic lights and its corner is
  in this file.

### 3. `explorer_style.ts` — the styles of the view control

- `useExplorerStyle()`: which way the folder is shown (`grid` or `list`), which
  button the pointer is on, and the two calls that change it.
- `explorerViewControlStyle()` and `explorerViewButtonStyle(isActive,
  isHovered)`: the look of the segmented control as values, so the chosen
  button, the hovered button and the quiet one are exactly the same everywhere
  the control is used. Nothing about the look is decided twice.
- The glass of the control is written here with the same numbers as the dock, so
  the pill in the toolbar and the dock are the same material.

### 4. `explorer_style.tsx` — the view control

- The two buttons of the toolbar, built here and put straight into the window:
  **Grid view** and **List view**, the same two buttons, the same size (32×26)
  and the same glyphs the first explorer has.
- Each button takes its style from `explorer_style.ts`, carries `aria-pressed`
  for the state it is in, and reports the choice through `onSelectView`, which
  is the same call the folders are drawn with.

### 5. `explorer_finder.ts` — the places and the click

- The three places a Finder window starts with, in the order macOS keeps them:
  **Downloads, Desktop, Documents**. Each one is a real folder of the computer.
- `useExplorerFinder()`: where the window is (`path`), which place is marked
  (`activeLocationId`), opening a place (`chooseLocation`), opening any other
  folder (`openFolder`) and going back to the start (`resetFinder`).
- This file is only about where the window is. Going back and forward — the two
  arrows of the toolbar — is the work of the window itself and lives in
  `computer_explorer.ts` (`useExplorerNavigation`).
- A place of the sidebar and a folder of the list are the same thing: both make
  `path` the folder the explorer reads.

### 6. `explorer_finder.tsx` — the sidebar

- The left side of the window, built the way the sidebar of the first explorer
  is built: a rounded glass panel, a 56px heading with the name of the app
  (`Files`) that is also a handle for dragging the window, one row per place,
  and the storage at the bottom.
- The heading has 84px of room on its left, which is where the floating traffic
  lights sit, and the name itself sits two pixels above the middle, where the
  first explorer keeps it.
- The panel has no colour of its own: it is clear glass with a little blue in it
  (`blur(10px) saturate(150%)`), so the screen of the computer behind the window
  shows through it. The small frame between the panel and the edge of the window
  is the black body of the window, painted by the panel itself, so the glass
  always looks at the screen and never at its own window. The body it paints
  reaches 28px past the panel, because a shadow is a rounded rectangle and its
  rounding stops short of the corners of the window; without that reach a few
  pixels of the screen would show through the body beside the corners of the
  panel.
- Every row is the MacTahoe folder icon with a small glyph inside it
  (`Downloads`, `Desktop`, `Documents`), and the row that is open takes a
  slightly lighter piece of glass.
- The click of a row is not handled here: it calls `chooseLocation` from
  `explorer_finder.ts`.

### 7. `explorer_stroage.ts` — the real storage of the computer

- `GET /api/disk` on the bridge, turned into `{ name, source, total, used,
  available }`. The bridge asks the container itself (`df`), so these are the
  numbers of the computer's own disk and not the numbers of the machine the
  bridge happens to run on.
- `useExplorerStorage(enabled)`: keeps the answer fresh (every 10 seconds while
  the window is in front of the user) and stops reading while it is minimized.
- `formatStorageSize()` and `storageUsedRatio()`: the size as a person reads it
  (GB, TB) and the part of the disk that is taken.

### 8. `explorer_stroage.tsx` — the storage button at the bottom of the finder

- It is a button and not a menu: a quiet glass panel with rounded corners (14px),
  and the glass of it is blurrier than the glass of the finder around it
  (`blur(26px)` against `blur(10px)`), so it reads as one more piece of glass and
  not as a row of a menu.
- Inside it: the name of the disk the computer itself reported, a thin bar of how
  much is taken and the line "734 GB of 915 GB available" — the real free space
  of the Linux disk.
- While the first answer is on its way the bar and the line are a skeleton, so a
  made-up number is never shown.

### 9. `explorer_folders.ts` — the real folders

- `GET /api/fs` on the bridge: the entries of one folder of the computer, with
  their name, path, whether they are a folder or a file, whether they are a
  symbolic link, their size and the moment they were changed.
- The folder is read again every 5 seconds while it is open, so a file written
  in the terminal appears here on its own.
- `sortExplorerEntries()`: folders first and then files, each by name the way a
  person reads it (`File 2` before `File 10`).
- `formatExplorerSize()` / `formatExplorerDate()`: "119 bytes", "22 Oct 2026,
  02:50 PM".
- `explorerFileKind()` / `explorerFileKindLabels` / `explorerFileExtension()`:
  what a name is (code, text, image, audio, video, archive, spreadsheet or a
  plain document) and the word Finder writes for it. The icon of each kind is
  drawn in `explorer_folders.tsx` from this answer.
- `useExplorerFolders(path, enabled)`: the entries, the error when the folder
  cannot be read, a manual `refresh()`, and `isLoading` — which is true while a
  folder that was never read is on its way. That flag is what makes the
  skeleton appear; it is never true once the names are known.
- The folder is always read whole. Which of its names are drawn is the business
  of `explorer_hidden.ts`, not of this file.

### 10. `explorer_folders.tsx` — the folder and its skeleton

- The two ways of seeing a folder, exactly like the first explorer: as **icons**
  (a grid of big icons with the name under each one) and as a **list** (a row
  per item under a Name / Date Modified / Size / Kind header, with the date, the
  size and the kind of each one).
- The icons are the icons of the first explorer: a folder is the MacTahoe folder
  of the macOS GTK icon theme, read as a file from the public folder of the UI
  (`/explorer_icons/mactahoe-folder.svg`), and a file is a Hugeicons glyph of
  its kind. Both are imported from `@hugeicons/*` and drawn here.
- The entries it draws are handed to it already filtered: the dot names of Linux
  only arrive when `Ctrl+H` asks for them (`explorer_hidden.ts`).
- One click does nothing and two clicks open an item, the way the first explorer
  behaves. The opening itself is not done here: it is reported through
  `onOpenEntry` — a folder to the finder, a file to the editor or to the viewer
  of the desktop.
- A right click is reported through `onContextMenu`, with the item under the
  pointer and where the pointer was — on an item, or on the empty room of the
  folder, which is the difference between the two menus of
  `explorer_actions.tsx`.
- An item that was cut waits dimmed until it is pasted, the way Finder shows it.
- **Skeleton**: while `isLoading` is true the view is drawn in its own shape —
  twelve shimmering tiles for the grid, nine shimmering rows for the list — so
  nothing jumps around when the real names arrive.
- A folder that cannot be read shows the reason and a **Try again** button,
  which calls `onRetry` (the `refresh()` of `explorer_folders.ts`).

### 11. `explorer_actions.ts` — the real work of the right click

- The whole model of the popup: which items it has, what a question of the popup
  is, what the answer does and what is left in the clipboard.
- The menu of an item — **Rename, Cut, Copy, Move to…, Copy to…, Delete
  Permanently** — and a **Open in Terminal** of its own when the item is a
  folder, because that folder is what a terminal would start in. The menu of the
  empty room — **New Folder, New File** and **Open in Terminal**, plus **Paste
  Item** while something is waiting in the clipboard (without it Cut and Copy
  would do nothing).
- Every item is real, on the disk of the container, through the bridge:
  - `POST /api/mkdir` makes a folder, `PUT /api/file` makes an empty file,
    `POST /api/delete` removes an entry for good (the computer has no trash).
  - A rename, a move and a copy are `mv` and `cp -R` run inside the computer
    through `POST /api/exec`, with every path quoted as one word
    (`shellArgument`), so a name with a space, a quote or a leading dash is
    still only a name. Two guards go first — the folder has to be a folder and
    the name has to be free — so nothing on the computer is ever replaced by
    accident.
- `useExplorerActions()`: the open menu, the open question, the clipboard, the
  folder that was right-clicked and the calls the popup makes. The folder is
  read again after every action (`refresh`), so the view shows what the disk
  really has.
- The questions: a name (a new folder, a new file, a rename), a folder (Move
  to…, Copy to… — `~` and `~/Documents` are understood), or the last word
  before something is lost (Delete Permanently). A name that is already in the
  folder is refused before anything is sent, and a failure of the computer is
  shown in the same sheet, with what was typed still there.

### 12. `explorer_actions.tsx` — the popup and the questions

- The popup itself: the glass of the finder with a little more blue in it
  (`rgba(125, 211, 252, 0.34)` at the top down to `rgba(14, 165, 233, 0.1)`,
  `blur(26px) saturate(165%)`), 12px corners, a hairline of white and a shadow,
  one line per item and a hairline between the groups. The destructive item is
  red. It opens where the click was and turns towards the inside when the screen
  ends, and it closes on Escape, on a click anywhere else, or after an item is
  chosen.
- The sheets are the same glass, in the middle of the screen: a title, the line
  that says what is about to happen, the field of the answer (already focused,
  its text already chosen) and Cancel / the verb.
- Both are drawn in a portal on the body: the window they belong to is moved and
  scaled by its own transform, and a fixed element inside that transform would
  be carried by it instead of sitting on the screen.
- Nothing here touches the disk: it shows the menu, asks the question and calls
  `explorer_actions.ts`.

### 13. `explorer_hidden.ts` — the dot names

- On Linux a name that starts with a dot is hidden, and every program decides
  for itself whether it shows one. `isExplorerHiddenName()` is that rule and
  `visibleExplorerEntries()` applies it, so the window keeps them away by
  default, the way Finder does.
- `useExplorerHidden()`: the switch — `showHidden`, `toggleHidden` and
  `setShowHidden`. It starts every visit with the dot names away.

### 14. `explorer_hidden.tsx` — the key

- `Ctrl+H` shows the dot names and hides them again, the way the file managers
  of Linux do it — but only while the window of the explorer is the one in front
  of the user, because the terminal uses the same keys for itself.
- It draws nothing. It listens, and a name that is being typed into a field is
  not a shortcut.

## Where the explorer is linked

- `openagenthumencomputer/core/apps/layout/core_layout.tsx` imports
  `../explorer/computer_explorer.tsx` and
  `../explorer/computer_explorer.ts`, and renders
  `useComputerExplorer({ onOpenTerminal })` + `<ComputerExplorer controller=... />`.
- `Open in Terminal` cannot be done by the window alone — the terminal is another
  app of the desktop — so the desktop hands the window `openAt(path)`
  (`useComputerTerminal`): a real tab is added and its shell starts in that
  folder. `Ctrl+H` is only live while the window is the one in front, which is
  how `core_layout.tsx` tells it through `isActive`.
- The `explorer` item of the dock (`core/apps/dock/core_dock.tsx`) calls
  `explorer.open()`, which opens exactly this window.

## The folder icon

- `openagenthumencomputer/public/explorer_icons/mactahoe-folder.svg` is the folder of
  the [MacTahoe Icon Theme](https://github.com/vinceliuice/MacTahoe-icon-theme)
  by vinceliuice (GPL-3.0), the same file the first explorer uses. It is a plain
  file, not a bundled module, so it is read by URL:
  `/explorer_icons/mactahoe-folder.svg` (dev and built UI alike).
- Every other icon of the window (the files, the arrows, the home, the view
  buttons, the disk) is Hugeicons Free Stroke Rounded, through
  `@hugeicons/react` and `@hugeicons/core-free-icons` (MIT).

## What is still missing

- Showing and editing the content of a file, and the editor that shows a `.txt`
  like TextEdit. The editor lived in the first explorer, which has been
  removed, so this window has no editor yet.

## The bridge behind it

| Call | What it gives |
| --- | --- |
| `GET /api/fs?path=...` | the entries of one folder of the computer |
| `GET /api/disk` | how much room the computer's own disk has |
| `POST /api/mkdir` | a new folder |
| `PUT /api/file` | a new, empty file |
| `POST /api/delete` | an entry removed for good (no trash) |
| `POST /api/exec` | `mv` / `cp -R` for a rename, a move and a copy |

Both are read through `explorerApiUrl()`, which adds the token when the bridge
is configured with one. The UI and the bridge are usually on the same origin,
so the calls simply go to the page itself.

## Note

- This folder lives inside the UI project (`openagenthumencomputer/core/apps`), so a
  file in it imports `react`, `framer-motion` and `@hugeicons/*` from
  `openagenthumencomputer/node_modules` like any file of the UI can. Nothing has to be
  installed here.
- The classes of this window all start with `oc-finder`, so they never clash
  with the classes of the terminal (`oc-terminal`) or of the browser window
  (`oc-chromium`), which live on the same page. The styles themselves keep the
  look of the first explorer.
## The home of the computer

- No user name is written anywhere in this folder. The first folder the
  explorer reads, it reads with no address at all, and the bridge answers with
  the home of the made computer; the places of the sidebar and the `~` of the
  questions are built from that answer. The bridge, for its part, keeps every
  address inside the home — a path that would leave it is refused.
