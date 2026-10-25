# MCP (`openagenthumencomputer/docker/mcp`)

The voice of the computer in the Model Context Protocol. The computer is not
only driven from outside: it runs its own MCP server, so an AI client of the
network can speak to this machine directly — its terminal, its files, its
record — with no bridge in between. The SDK of the protocol is installed by
this package's `install.sh`; this package owns the server and its place.

```
an AI client of the network
        │  (streamable-http, port 7072)
        ▼
mcp_server.py   ← the tools of the computer, served by the computer itself
        │
        ├── terminal_exec    ← bash on this machine, as the account of the server
        ├── file_read/write  ← the files of this machine
        ├── list_directory   ← one folder of this machine
        └── computer_info    ← what this machine is (/etc/open-computer/computer.env)
```

## Files

| File | What it does | When it runs |
| --- | --- | --- |
| `mcp.conf` | transport, bind address, port 7072, version fallback | sourced by every script |
| `install.sh` | the latest stable MCP SDK into the Python of the computer, the PATH of a login shell, the version | `ubuntu/Dockerfile` build |
| `mcp_server.py` | the server itself: the tools of the computer, spoken over MCP | `run.sh`, `control.sh start` |
| `run.sh` | one server in the foreground, with the settings of the conf | `control.sh start` |
| `control.sh` | start / stop / restart / status / version | a shell of the computer |
| `mcp.md` | this document | a person reading the folder |

## Commands

```bash
open-computer-mcp start       # (after install.sh links it, see below)
bash /opt/open-computer/mcp/control.sh start
bash /opt/open-computer/mcp/control.sh status
bash /opt/open-computer/mcp/control.sh version
```

## Ports

| Port | What speaks there |
| --- | --- |
| `7072` | the MCP server of the computer (streamable-http, every interface) |

## Notes

- `install.sh` is idempotent: the SDK it finds already installed is accepted
  when it matches the latest stable release on PyPI, and replaced when it does
  not. The exact version is written to `mcp.version` next to the scripts.
- The PATH of a login shell of the computer comes from
  `/etc/profile.d/15-mcp.sh`, written by `install.sh`.
- The server runs as the account that starts it — its tools act on the files
  and the terminal of that account. Started by root, it would be root's
  hands; start it as the user of the computer.
- The MCP server of the **host** (the one AI clients attach to over stdio)
  lives in the UI project: `core/tools/mcp/` — it speaks to the bridge. This
  package is the computer speaking for itself.
