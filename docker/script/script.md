# One command (`openagenthumencomputer/docker/script`)

The short command that puts the UI on a machine that has nothing but a shell
and curl. The UI is what makes the computer: the Linux is built from the page,
with the cores, the RAM and the storage that are chosen there.

## The short command

```bash
curl -fsSL https://raw.githubusercontent.com/nextceo-yeasinarafat/OpenAgentHumenComputer/main/docker/script/setup.sh | bash
```

It runs `setup.sh`, which:

1. installs Docker when it is missing (`get.docker.com`);
2. clones (or updates) this repository in `~/.openagenthumencomputer`;
3. builds the **UI image** and starts the container `openagenthumencomputer`
   on port `1010`, with the socket of Docker mounted;
4. waits for the page and opens `http://127.0.0.1:1010/` in the browser
   (and prints the network URL for another device).

Nothing of the Linux is built here: in the page, the name, the RAM and the
storage are chosen, and **CREATE** builds the image of the computer and starts
the container `openagentcomputer` from the UI itself.

## Files

| File | What it is |
| --- | --- |
| `setup.sh` | the one command: docker → clone → UI image → UI container → page |
| `script.md` | this document |

## Options

| Variable | Default | What it changes |
| --- | --- | --- |
| `OPENAGENT_PORT` | `1010` | the host port of the UI |
| `OPENAGENT_NAME` | `openagenthumencomputer` | the name of the UI container |
| `OPENAGENT_IMAGE` | `openagenthumencomputer/ui:latest` | the UI image to build and run |
| `OPENAGENT_SRC` | `$HOME/.openagenthumencomputer` | where the repository is cloned |
| `OPENAGENT_REF` | `main` | the branch that is cloned |

```bash
OPENAGENT_PORT=1011 \
  curl -fsSL https://raw.githubusercontent.com/nextceo-yeasinarafat/OpenAgentHumenComputer/main/docker/script/setup.sh | bash
```

## After it runs

```bash
docker logs -f openagenthumencomputer   # the UI and the bridge
docker logs -f openagentcomputer        # the Linux, once CREATE has run
docker stop openagenthumencomputer
docker rm -f openagenthumencomputer
```

The UI image takes a few minutes to build (Node, the packages and the
production build). The Linux of the computer is built on the first CREATE:
15–25 minutes, once; every later computer starts in seconds.

## Notes

- The script never installs Chrome, Python or noVNC on the host: they live in
  the images. Only Docker is installed when it is missing.
- If Docker is installed but the daemon cannot be reached, the script retries
  through `sudo`; when that fails too, it stops with a clear message.
- If the port is busy, the script stops before touching anything.
