# ui (`openagenthumencomputer/docker/ui`)

The image that serves the web UI of the computer. It is deliberately small: an
**Ubuntu 24.04 with Node.js, git and the project only** — no desktop, no
browser, no editor, no VNC. Its one job is to serve the Vite build on port
`1010` for every interface of the machine.

## Files

| File | What it does |
| --- | --- |
| `Dockerfile` | ubuntu:24.04 → Node.js LTS → the scripts of `core/` → `git clone` of the project → `npm install` + `npm run build` |
| `build.sh` | resolves the latest Node.js LTS, then builds `openagenthumencomputer/ui:latest` |
| `run.sh` | starts (or replaces) the container `openagenthumencomputer`, publishing `1010` |
| `core/start.sh` | the entrypoint: clone/install/build when missing, then serve |
| `core/pull.sh` | `git fetch` + `npm install` + `npm run build` inside the container |
| `core/serve.sh` | serves `core/app/dist` on `0.0.0.0:1010` |
| `core/status.py` | JSON state: commit, build, runtime, whether the port answers |
| `core/core.md` | the container layout and the commands |
| `ui.md` | this document |

## Build and run

```bash
cd docker/ui
./build.sh          # openagenthumencomputer/ui:latest
./run.sh            # container openagenthumencomputer, port 1010
```

`build.sh` refuses to build when `ubuntu:24.04` is not on the machine; it never
pulls a base image and never starts a container on its own.

## Update the UI inside the container

The container clones the repository at build time, so a new commit arrives in
two ways:

```bash
# inside the running container
docker exec openagenthumencomputer /opt/openagenthumencomputer/core/pull.sh
docker restart openagenthumencomputer

# or rebuild the image from scratch
./build.sh && ./run.sh
```

## Ports

| Port | What |
| --- | --- |
| `1010` | the UI, published on every interface (`http://<ip>:1010`) |

## Notes

- Port `1010` is below 1024: inside the container it is root, and the host port
  is published by the Docker daemon, so no capability is needed for this.
- The build needs the network: Node.js, the Git clone and the npm registry.
