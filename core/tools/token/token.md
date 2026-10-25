# Token (`core/tools/token`)

The words that open the computer to an AI agent. An agent that is given one
of these words can drive the whole machine through the bridge and the agent
API — the terminal, the screen, the browser, the files — exactly as far as
the word's permissions allow, and no longer than the word lives.

This is the design the first version of the project used (the
Rakazo-compatible one), carried over to this machine's names: the master
token in the environment, and named `octk_live_...` words in a registry that
keeps only their SHA-256 hashes.

## Files

| File | What it does |
| --- | --- |
| `generate_token.py` | creates (`create`), lists (`list`), kills (`revoke`) — the word is shown once, only its hash is kept |
| `agent_auth.py` | verifies: master token first (constant-time), then the registry — revoked, expired and permission-less words are refused; the caller's host is checked |
| `token.sh` | the same from a shell |
| `token.md` | this document |

## Registry

`~/.config/openagenthumencomputer/agent_tokens.json` (override with
`AGENT_HUMEN_COMPUTER_TOKEN_STORE`), chmod 0600, written atomically. Each
record: agent, token prefix, sha256 hash, permissions
(`terminal, browser, desktop, filesystem, all`), created, expires, revoked.

## Commands

```bash
bash core/tools/token/token.sh create claude 30
bash core/tools/token/token.sh list
bash core/tools/token/token.sh verify octk_live_... terminal
bash core/tools/token/token.sh revoke <hash-prefix>
```

The master token lives in `.env` as `AGENT_HUMEN_COMPUTER_TOKEN` — it is the
word of the owner, and it never dies. The bridge reads the same name when
its auth is switched on.
