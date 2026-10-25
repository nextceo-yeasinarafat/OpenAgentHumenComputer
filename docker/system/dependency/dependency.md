# Dependency installers (`openagenthumencomputer/docker/system/dependency`)

The toolchains the computer needs beyond the Ubuntu base: curl and Python.
Every script resolves the **latest stable release** at build time and records
the exact installed version next to itself, so an image always says what it has.

## Files

| File | What it installs | Installed path / command |
| --- | --- | --- |
| `dependency.conf` | shared prefixes and fallback versions | sourced by the scripts |
| `curl_install.sh` | latest stable curl, built from source | `/opt/curl/bin/curl`, linked at `/usr/local/bin/curl` |
| `python_install.sh` | latest stable Python, built from source | `/opt/python/current/bin/python3`, `pip3` |
| `dependency.md` | this document | — |

Each script writes `<tool>.version` in this folder (`curl.version`,
`python.version`).

## Versions when this was written (2026-10-24)

| Tool | Latest stable | How it is resolved |
| --- | --- | --- |
| curl | **8.23.0** | GitHub releases (`curl/curl`) |
| Python | **3.16.0** | python.org FTP listing (final releases only) |

The scripts always try the upstream version API first; the numbers above are
also the fallbacks in `dependency.conf` when the network is not available.

## Order

The Dockerfile runs them in this order:

```
curl → python
```

## PATH

Each installer writes a profile file, so a login shell in the computer finds
the new tool first:

| File | Adds |
| --- | --- |
| `/etc/profile.d/10-dependency-curl.sh` | `/opt/curl/bin` |
| `/etc/profile.d/11-dependency-python.sh` | `/opt/python/current/bin` |

## Notes

- Python and curl are **built from source** into `/opt`, so the system
  `python3` and `/usr/bin/curl` of Ubuntu are not replaced on disk.
- Node.js, npm, pnpm and Bun are not installed: nothing of the computer needs them.
- The scripts are idempotent: a second run does nothing when the installed
  version already matches.
