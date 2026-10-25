# core (`openagenthumencomputer:/opt/openagenthumencomputer/core`)

The `core` folder **inside the container**: the project is pulled here and
served from here.

```
/opt/openagenthumencomputer/core/
├── app/          the checkout of OpenAgentHumenComputer (the Vite project)
├── start.sh      the entrypoint: clone, install, build, serve
├── pull.sh       fetch the newest commit, install, build
├── serve.sh      serve dist/ on 0.0.0.0:1010
├── status.py     JSON state of the checkout, the build, the runtime and the port
└── core.md       this document
```

## Files

| File | What it does |
| --- | --- |
| `start.sh` | runs at container start; makes sure `app/`, `node_modules/` and `dist/` exist, then serves |
| `pull.sh` | `git fetch` + `git reset --hard origin/main` + `bun install` + `bun run build` |
| `serve.sh` | only the server, for a build that is already on disk |
| `status.py` | prints the state as JSON; safe to run at any time |

## Commands

```bash
# from the host
docker exec openagenthumencomputer /opt/openagenthumencomputer/core/status.py
docker exec openagenthumencomputer /opt/openagenthumencomputer/core/pull.sh
docker restart openagenthumencomputer

# a shell inside the container
docker exec -it openagenthumencomputer bash
```

## Environment

| Variable | Default | What it changes |
| --- | --- | --- |
| `OPEN_COMPUTER_UI_PORT` | `1010` | the port the server listens on |
| `OPEN_COMPUTER_UI_HOST` | `0.0.0.0` | the interface the server binds |
| `OPEN_COMPUTER_UI_REPO` | the GitHub URL | the repository `start.sh` clones |
| `OPEN_COMPUTER_UI_REF` | `main` | the branch or tag it clones |

## What the container does not do

It serves the UI only. The bridge of the computer (`/api`, `/ws`) and the
desktop services live in the other folders of `docker/system`; until the bridge
exists, the UI reports the bridge as `unreachable`.
