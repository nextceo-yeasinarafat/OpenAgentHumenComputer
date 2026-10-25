# Terminal (`openagenthumencomputer/docker/system/terminal`)

The real terminal of the computer. It is `xterm` on the X display of the Linux
machine, running a **bash login shell** in the home of the account the computer was made with. It is not a
browser terminal and it does not need the UI.

## Files

| File | What it does | When it runs |
| --- | --- | --- |
| `terminal.conf` | the user, the display, the binary and the log/pid paths | sourced by every script |
| `install.sh` | `apt-get install xterm`, writes the version, links the controller | `ubuntu/Dockerfile` build |
| `run.sh` | opens one xterm window in the foreground (`xterm -ls`) | `control.sh open` |
| `control.sh` | open, close, restart, status, logs, version | a shell inside the computer |
| `terminal.md` | this document | a person reading the folder |

## How it works

1. `xterm` starts as the `open-computer` user with `DISPLAY=:1`.
2. `-ls` makes it a **login shell**, so `/etc/profile` and the PATH files
   written by the install scripts are loaded.
3. The window is the same screen that noVNC serves, so it is visible in the
   computer's picture and on the UI screen.

## Commands

```bash
open-computer-terminal open          # one window
open-computer-terminal open -e htop  # a command instead of the shell
open-computer-terminal close
open-computer-terminal status
open-computer-terminal logs
open-computer-terminal version
```

## Versions

`xterm` comes from the Ubuntu 24.04 archive, which is the stable build of this
image. `install.sh --force` reinstalls it.
