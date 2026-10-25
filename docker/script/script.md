# One command (`openagenthumencomputer/docker/script`)

The short command that makes a whole computer on a machine that has nothing
but a shell and curl.

## The short command

```bash
curl -fsSL https://raw.githubusercontent.com/nextceo-yeasinarafat/OpenAgentHumenComputer/main/docker/script/setup.sh | bash
```

It runs `setup.sh`, which:

1. installs Docker when it is missing (`get.docker.com`);
2. clones (or updates) this repository in `~/.openagenthumencomputer`;
3. pulls `ubuntu:24.04` and builds the image with every dependency of the
   computer (curl, Python, Bun, Chrome, noVNC, xterm, PCManFM, VS Code, fonts);
4. starts the container **`openagentcomputer`** and sets its account up;
5. waits for the screen, then opens
   `http://127.0.0.1:6080/vnc.html?autoconnect=1&resize=scale` in the browser
   of the machine (and prints the network URL for another device).

## Files

| File | What it is |
| --- | --- |
| `setup.sh` | the one command: docker → clone → image → container → screen |
| `script.md` | this document |

## Options

| Variable | Default | What it changes |
| --- | --- | --- |
| `OPENAGENT_NAME` | `openagentcomputer` | the name of the container |
| `OPENAGENT_IMAGE` | `openagenthumencomputer/ubuntu:24.04` | the image to build and run |
| `OPENAGENT_PORT` | `6080` | the host port of the screen (noVNC) |
| `OPENAGENT_USER` | `agent` | the account made inside the computer |
| `OPENAGENT_PASSWORD` | `openagentcomputer` | its password |
| `OPENAGENT_SRC` | `$HOME/.openagenthumencomputer` | where the repository is cloned |
| `OPENAGENT_REF` | `main` | the branch that is cloned |

```bash
OPENAGENT_NAME=my-pc OPENAGENT_PORT=6081 \
  curl -fsSL https://raw.githubusercontent.com/nextceo-yeasinarafat/OpenAgentHumenComputer/main/docker/script/setup.sh | bash
```

## After it runs

```bash
docker logs -f openagentcomputer      # what the computer says
docker stop openagentcomputer         # put it to sleep
docker start openagentcomputer        # wake it
docker rm -f openagentcomputer        # remove it
```

The first run takes 15–25 minutes (the image is built once). Every later run
finds the image on the machine and starts in seconds.

## Notes

- The raw URL works after this folder is pushed to the repository.
- The screen is served by noVNC on `6080`; the container is the real Ubuntu,
  not a mock: Chrome, the terminal, the explorer and VS Code run inside it.
