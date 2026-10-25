# vscode (`core/apps/vscode`)

The window of VS Code: the real VS Code Server of the computer, shown in a
same-origin frame at `/vscode/` and driven through the bridge.

## Files

| File | What it does |
| --- | --- |
| `computer_vscode.ts` | the window: size, place, traffic lights, drag, resize |
| `computer_vscode.tsx` | the frame of the window, its bar and its body |
| `vscode_stream.ts` / `vscode_stream.tsx` | the iframe of the editor, its veil, its watchdog and retries |
| `vscode_close.ts` | window open/close ↔ server start/stop (`/api/vscode/start`, `/api/vscode/stop`) |
| `vscode_sleep.ts` | a minimized window stops the server too |
| `vscode.md` | this document |

## How it is served

The server of the editor runs inside the computer (`/opt/open-computer/vscode`,
port 8989, base path `/vscode`, the account of the machine). It has no
published port: the bridge (`core/server/bridge.py`) carries it —

- `/vscode/*` HTTP: a pass-through to the computer, byte for byte;
- `/vscode/*` WebSocket upgrades: a raw splice of two sockets, the Host
  header carried word for word (the server builds the address of its
  workbench socket from it);
- `/api/vscode`, `/api/vscode/start`, `/api/vscode/stop`: the lifecycle.

Closing the window stops the server; opening it starts it again with the
folder left empty (the editor opens no folder on its own — multi-window is
not supported by the server, so every opening is a fresh choice).
