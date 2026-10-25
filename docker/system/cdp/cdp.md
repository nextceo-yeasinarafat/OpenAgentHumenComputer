# CDP bridge (`openagenthumencomputer/docker/system/cdp`)

The DevTools protocol bridge of the computer. Chrome only listens for the
Chrome DevTools Protocol (CDP) on `127.0.0.1:9222`; this module forwards that
traffic to the container network on `9223`, so the host bridge can stream tabs
and pages without exposing the browser port.

CDP is a **protocol**, not a package: the protocol version is the one the
installed Chrome speaks. `control.sh version` reads it live from the browser
(`Protocol-Version` and `Browser` in `/json/version`); the forwarder itself is
versioned separately (`cdp-forward 1.0.0`).

## Files

| File | What it does | When it runs |
| --- | --- | --- |
| `cdp.conf` | ports (`9222` browser, `9223` bridge), log/pid paths | sourced by every script |
| `cdp-forward.py` | a small TCP forwarder, no third-party dependency | `run.sh` |
| `install.sh` | chmod, symlinks, PATH and the version file | `ubuntu/Dockerfile` build |
| `run.sh` | one forwarder in the foreground | `control.sh start` |
| `control.sh` | start, stop, restart, status, logs, version | a shell inside the computer |
| `cdp.md` | this document | a person reading the folder |

## Commands

```bash
open-computer-cdp start
open-computer-cdp stop
open-computer-cdp restart
open-computer-cdp status
open-computer-cdp logs
open-computer-cdp version
```

## Ports and security

| Port | Where | Why |
| --- | --- | --- |
| `9222` | `127.0.0.1` inside the container | Chrome DevTools, never exposed |
| `9223` | container network | the bridge, used by the host, not published |

The DevTools protocol gives full control of the browser. Never publish `9222`
or `9223` on the host.

## Note

The `chromium` module also ships a compact forwarder so it can run on its own.
This module is the standalone bridge: use it when the protocol should be
started, stopped and versioned separately from the browser.
