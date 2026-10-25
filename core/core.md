# core (`openagenthumencomputer/core`)

Everything the computer is made of on this side: the web UI, the bridge that
speaks to the machine, and the tools that let AI agents speak to it too.

## Folders

| Folder | What it holds |
| --- | --- |
| `apps/core/` | the entry of the UI: loading, and the desktop that follows it |
| `apps/layout/` | the desktop of a made computer: wallpaper, dock, every window |
| `apps/dock/` | the dock: the glass bar and the apps it carries |
| `apps/chromium/` | the browser of the computer, seen through its own screen |
| `apps/terminal/` | the terminal: one real shell per tab |
| `apps/explorer/` | the finder: the real folders of the machine |
| `apps/text_editor/` | the editor of the text files of the machine: a file opened with a double press in the finder |
| `apps/media_viewer/` | the viewer of the pictures, PDFs, videos and sounds of the machine, opened the same way |
| `apps/vscode/` | the editor: the real VS Code Server of the machine |
| `apps/settings/` | the settings window and its five sections |
| `tools/config/` | the identity and hardware of a computer being made |
| `tools/loading/` | the loading page every entry begins under |
| `tools/mcp/` | the MCP server — AI clients drive the machine through it |
| `tools/token/` | the agent tokens that open the API |
| `server/` | the bridge (bridge.py): every word between the page and the machine |
| `modules/` | the Python packages reserved for the UI's own AI (not installed yet) |
| `import/public/` | the files served at the root: wallpaper, dock icons, settings icons, the loading logo |

The whole UI is one page: it asks the bridge what is true (a computer
already made? a making in progress?), covers itself with the loading, and
lands where the truth puts it.
