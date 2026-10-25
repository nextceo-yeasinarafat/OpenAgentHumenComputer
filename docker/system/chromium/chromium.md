# Chromium (`openagenthumencomputer/docker/chromium`)

The browser of the computer: **Google Chrome stable** on the real X display,
with its DevTools protocol on loopback and its profile in the mounted home.
Chrome comes from Google's apt repository because the Ubuntu `chromium` package
is a snap wrapper, and snapd does not run in an unprivileged container. apt
downloads and installs the stable build; there is nothing to compile.

## Files

| File | What it does | When it runs |
| --- | --- | --- |
| `chromium.conf` | user, profile, CDP ports, window size, switches | sourced by every script |
| `install.sh` | adds Google's key and apt repo, installs `google-chrome-stable` | `ubuntu/Dockerfile` build |
| `run.sh` | runs one Chrome in the foreground with the CDP port open | `control.sh start`, `open.sh` |
| `open.sh` | opens a link: new tab in the running browser, or starts it | `open-computer-open-browser`, the bridge |
| `control.sh` | start/stop/restart/status/logs/wake/sleep/forward/supervise/version | a shell inside the computer |
| `cdp-forward.py` | forwards the DevTools protocol from loopback to the container network (`9223 → 9222`) | `control.sh forward` / `supervise` |
| `chromium.md` | this document | a person reading the folder |

## How it works

1. `install.sh` installs Chrome and writes the installed version to `version`.
2. `run.sh` starts Chrome as `open-computer` on `DISPLAY=:1`, with:
   - `--remote-debugging-port=9222` on `127.0.0.1`,
   - the profile in the home of the account the computer was made with,
   - the session restored when `--restore` is given.
3. `cdp-forward.py` listens on **9223** and forwards to `127.0.0.1:9222`, so
   the bridge on the host can stream tabs and pages.
4. `control.sh supervise` keeps the browser and the forwarder alive; the sleep
   mark (`/tmp/open-computer-browser-asleep`) keeps a browser closed on
   purpose while the UI window is closed.

## Commands

```bash
open-computer-chromium start
open-computer-chromium start https://example.com
open-computer-chromium stop
open-computer-chromium restart
open-computer-chromium status
open-computer-chromium logs
open-computer-chromium wake
open-computer-chromium sleep
open-computer-chromium forward
open-computer-chromium forward-stop
open-computer-chromium supervise
open-computer-chromium version
open-computer-open-browser https://example.com
```

## Ports and security

| Port | Where | Why |
| --- | --- | --- |
| `9222` | `127.0.0.1` inside the container | Chrome DevTools, never exposed directly |
| `9223` | container network | the forwarder used by the host bridge, not published |

The DevTools protocol gives full control of the browser, so it must stay inside
the container network. Do not publish `9222` or `9223` on the host.
