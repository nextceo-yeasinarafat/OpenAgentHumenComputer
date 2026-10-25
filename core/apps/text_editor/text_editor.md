# text_editor (`openagenthumencomputer/core/apps/text_editor`)

The editor of the text files of the computer. A file is opened with a double
press in the explorer (`core/apps/explorer`), and its text is shown in this
window: the real text of the real file, read and written through the bridge, so
the terminal, an agent and this window all see the same bytes on the same disk.
A picture, a PDF, a video or a sound is not opened here: those go to the viewer
of `core/apps/media_viewer`.

```
the Explorer tile of the dock → a double press on a file
        │  (core_layout.tsx → useTextEditor().openFile)
        ▼
text_editor_window.tsx   ← the window: the bar, the numbers, the text, the save
        │
        └── text_editor_window.ts   ← the state of the window and the asks:
                                      GET /api/file (read), PUT /api/file (write)
```

## Files

| File | What it does |
| --- | --- |
| `text_editor_window.ts` | which file is open, where the window stands and how big it is; `readComputerFile` and `writeComputerFile` (the bridge) |
| `text_editor_window.tsx` | the window itself: title with the name and the unsaved dot, line numbers, the text, Save, the path and the count of lines, drag by the bar and growth from the corner |
| `text_editor.md` | this document |

## How it behaves

- **Opening.** `core_layout.tsx` gives the explorer an `onOpenFile`; a double
  press on a text file calls `openFile(path, name)`, which puts the window in
  front and reads the file (a picture, a PDF, a video or a sound goes to the
  viewer instead). A folder is still opened by the finder itself.
- **Reading.** `GET /api/file?path=…` of the bridge reads the file inside the
  computer and carries it as base64, so line endings and letters arrive as they
  are on the disk. A file heavier than 2 MB is refused with its size.
- **Writing.** `PUT /api/file` writes the whole text back. The bridge sends the
  words down the stdin of an exec (`docker_write_file`), so the file keeps its
  permissions and its length is not bounded by the arguments of a command.
- **Unsaved text.** The title carries a blue dot while the text and the disk
  differ; **Save** (or `Ctrl+S`) writes it and the dot goes. The red light does
  not throw an unsaved text away behind the back of the user: the first press
  warns, the second closes.
- **Keys.** `Tab` writes two spaces instead of leaving the field, so an
  indented file can be typed; everything else is the text of the file, with
  `wrap` off and the line numbers scrolling with it.
- **The window.** Dragged by its bar, grown from its bottom-right corner, and
  kept inside the page (`move` and `resize` in `text_editor_window.ts`). Its
  z-index is the `activeApp` of the desktop: in front when it was touched last.

## The bridge behind it

| Call | What it gives |
| --- | --- |
| `GET /api/file?path=…` | the text of one file of the computer, as base64 that the bridge turns into text (max 2 MB) |
| `PUT /api/file` | the whole text written back to the file, on the stdin of the command, so permissions stay |

Both paths are kept inside the home of the computer (`explorer_target`), the
same guard the explorer and the upload use.
