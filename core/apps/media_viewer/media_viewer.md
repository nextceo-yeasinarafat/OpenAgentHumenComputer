# media_viewer (`openagenthumencomputer/core/apps/media_viewer`)

The window that shows the pictures, PDFs, videos and sounds of the computer. A
file is opened with a double press in the explorer (`core/apps/explorer`), and
its real bytes are served by the bridge (`GET /api/media`) into the window: no
copy is made, and nothing is written to the disk.

```
the Explorer tile of the dock → a double press on a picture, a PDF, a video or a sound
        │  (core_layout.tsx → isMediaFile → useMediaViewer().openFile)
        ▼
media_viewer_window.tsx   ← the window: the bar, the picture/frame/video/sound
        │
        ├── media_viewer_window.ts   ← the state of the window (which file, where, how big)
        └── tools/media_source.ts    ← which names belong here, and the address of the bytes
```

## Files

| File | What it does |
| --- | --- |
| `media_viewer_window.ts` | the file the window shows, its place and its size, the open/close/move/resize |
| `media_viewer_window.tsx` | the window itself: bar with the name and the kind, the picture (`<img>`), the PDF (`<iframe>`), the video or the sound (`<video>`, `<audio>`), drag by the bar, growth from the corner |
| `tools/media_source.ts` | the one place that knows the kinds (`.png` … `.pdf`, `.mp4` … `.mp3` …), `mediaKindOf`, `isMediaFile` and `mediaUrl` |
| `media_viewer.md` | this document |

## Which file goes where

- A **picture**, a **PDF**, a **video** or a **sound** opens here.
- Any other file opens in the text editor (`core/apps/text_editor`). The
  desktop decides with `isMediaFile(name)` before it puts a window in front
  (`core/apps/layout/core_layout.tsx`).
- The names of Linux that start with a dot are files like any other; the
  viewer only looks at the end of the name.

## The bytes behind it

| Call | What it gives |
| --- | --- |
| `GET /api/media?path=…` | the whole file, with the `Content-Type` of its kind, `Content-Length`, `Accept-Ranges: bytes` and `Range` answered (`206`), so a video can be seeked |

The file is read inside the computer (`base64`, like the editor's read) and is
kept inside the home of the computer (`explorer_target`). A file heavier than
64 MB is refused with its size; a picture or a PDF of a few megabytes is served
whole.
