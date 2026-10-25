# api

The hands and the eyes of the computer, for the agent API of the bridge.

The bridge on the host (`core/server/bridge.py`) drives this machine through
`docker exec`: the `/v1/desktop` actions are `xdotool`, the observation and
the screenshot are this folder's `observe.py` over ImageMagick. The tools
live here so the machine owns them.

## Contents

| File | What it does | When it runs |
| --- | --- | --- |
| `install.sh` | installs `xdotool` and `imagemagick` into the image | `ubuntu/Dockerfile` build |
| `observe.py` | one observation of the screen: PNG (base64), cursor, active window, geometry — or `--png` for the raw picture | the bridge, on `/v1/desktop` and `/api/screenshot` |
| `observe_analyse.py` | how the computer is doing in its own numbers: the CPU, RAM and storage it was given (cgroup + system.conf) and the live usage of each | the bridge, on `/api/analyse` |
| `api.md` | this document | a person reading the folder |

## How the bridge calls it

```bash
DISPLAY=:1 python3 /opt/open-computer/api/observe.py          # JSON observation
DISPLAY=:1 python3 /opt/open-computer/api/observe.py --png    # raw PNG bytes
DISPLAY=:1 xdotool mousemove -- 100 200 click 1               # one action step
```

The actions and the observation run as the account of the computer (the
bridge names the user), on the display of the machine.
