# core_systeam (`openagenthumencomputer/docker/core_systeam`)

The services that were started by hand until this folder was born: the
bridge on the host, the container of the made computer, and the services
inside it. This folder is the one place that starts them, stops them, asks
what is running, and — the reason it exists — brings them back by itself
after the machine boots, so a computer that was made once is always there.

## Files

| File | What it does | When it runs |
| --- | --- | --- |
| `core_systeam.conf` | where the project lives, the bridge port, the container name | sourced by every script |
| `status.sh` | the truth of every service, one line each (`name: on/off/none`) — read from the machine itself (ports, Docker) | the bridge (`/api/services`), the watchman |
| `control.sh` | start / stop / restart of one service, or `all` — everything that is down, in the order they lean on each other | the bridge (the settings page), a person |
| `install.sh` | puts the watchman on the machine (the user systemd service below) | once, by a person |
| `recover.sh` | the watchman: every few seconds, the bridge and the container are brought back when they are gone | `core-systeam.service`, from boot |
| `core_systeam.md` | this document | a person reading the folder |

## The services it owns

| Name | What it is | How its state is read |
| --- | --- | --- |
| `bridge` | the bridge of the computer on the host (`core/server/bridge.py`) | port 7071 |
| `computer` | the container of the made computer | `docker inspect` |
| `screen` | Xvfb + x11vnc + noVNC of the computer | port 6080 (inside) |
| `browser` | Chrome and its DevTools forwarder; stopping it is the sleep of the browser (`chromium/control.sh sleep`), so the watch of the computer leaves it closed | port 9222 (inside, the DevTools port of Chrome itself — the forwarder on 9223 stays open even when no browser runs) |
| `mcp` | the MCP server of the computer | port 7072 (inside) |
| `vscode` | the VS Code server of the computer | port 8989 (inside) |

## Commands

```bash
bash docker/core_systeam/status.sh
bash docker/core_systeam/control.sh start all
bash docker/core_systeam/control.sh restart vscode
bash docker/core_systeam/recover.sh start      # the watchman (or: systemctl --user start core-systeam)
```

## The watchman (the auto-start that was missing)

`install.sh` writes a user systemd service (`~/.config/systemd/user/core-systeam.service`)
and enables it with lingering, so the moment the machine boots:

1. the bridge of the computer comes back,
2. the container of the made computer is started again,
3. and every service of the computer comes back on its own when the page
   that owns it is opened (the screen with the browser, the editor with its
   window) — exactly the way they always did, only now nothing waits for a
   hand.

The watchman never stops anything: what the person turned off stays off.

## Notes

- The settings page of the UI reads the same truth: `System Control`
  lists every service by `status.sh` and starts, stops or restarts each one
  through `control.sh`, by the bridge (`/api/services`).
- The watchman keeps the bridge and the container alive; the services inside
  the computer are started on demand by the bridge (the screen and the
  browser when their windows open, the editor with its own window), so an
  idle computer stays light.
