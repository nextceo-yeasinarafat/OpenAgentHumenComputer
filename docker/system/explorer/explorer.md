# File explorer (`openagenthumencomputer/docker/system/explorer`)

The real file manager of the computer. It is **PCManFM** on the X display,
showing the home of the account the computer was made with — the same folders the terminal, the
bridge and the agent use.

## Files

| File | What it does | When it runs |
| --- | --- | --- |
| `explorer.conf` | the user, the display, the binary and the log/pid paths | sourced by every script |
| `install.sh` | `apt-get install pcmanfm adwaita-icon-theme shared-mime-info` | `ubuntu/Dockerfile` build |
| `run.sh` | opens one PCManFM window (`--no-desktop`) | `control.sh open` |
| `control.sh` | open, close, restart, status, logs, version | a shell inside the computer |
| `explorer.md` | this document | a person reading the folder |

## How it works

- The window runs as the account of the computer (the scripts read it from
  their environment) with `DISPLAY=:1`.
- `--no-desktop` means PCManFM does **not** take over the desktop background;
  it only opens a file-manager window.
- A path can be passed: `open-computer-explorer open <home>/Documents`.
- The icons come from Adwaita, so folders and files have real MIME icons.

## Commands

```bash
open-computer-explorer open
open-computer-explorer open <home>/Documents
open-computer-explorer close
open-computer-explorer status
open-computer-explorer logs
open-computer-explorer version
```

## Version

`pcmanfm` comes from the Ubuntu 24.04 archive, which is the stable build of
this image. `install.sh --force` reinstalls it.
