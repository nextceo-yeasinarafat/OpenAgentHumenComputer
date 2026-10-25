#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${OPENAGENT_REPO:-https://github.com/nextceo-yeasinarafat/OpenAgentHumenComputer.git}"
REF="${OPENAGENT_REF:-main}"
NAME="${OPENAGENT_NAME:-openagenthumencomputer}"
IMAGE="${OPENAGENT_IMAGE:-openagenthumencomputer/ui:latest}"
PORT="${OPENAGENT_PORT:-1010}"
SRC="${OPENAGENT_SRC:-$HOME/.openagenthumencomputer}"

say() { printf 'openagentcomputer: %s\n' "$*"; }
die() { printf 'openagentcomputer: %s\n' "$*" >&2; exit 1; }

if ! command -v docker >/dev/null 2>&1; then
  say "docker is not on this machine; installing it"
  command -v curl >/dev/null 2>&1 || die "curl is needed to install docker"
  curl -fsSL https://get.docker.com -o /tmp/openagentcomputer-docker.sh
  if [ "$(id -u)" -eq 0 ]; then
    sh /tmp/openagentcomputer-docker.sh
  else
    sudo sh /tmp/openagentcomputer-docker.sh
  fi
fi

if ! docker info >/dev/null 2>&1; then
  if sudo -n docker info >/dev/null 2>&1; then
    SHIM="$(mktemp -d)"
    printf '#!/bin/sh\nexec sudo docker "$@"\n' >"$SHIM/docker"
    chmod +x "$SHIM/docker"
    PATH="$SHIM:$PATH"
    export PATH
    trap 'rm -rf "$SHIM"' EXIT
  else
    die "the docker daemon is not reachable: start it or join the docker group"
  fi
fi

command -v git >/dev/null 2>&1 || die "git is needed to clone the project"

if [[ -d "$SRC/.git" ]]; then
  say "updating the checkout in $SRC"
  git -C "$SRC" fetch --depth 1 origin "$REF"
  git -C "$SRC" checkout -q FETCH_HEAD
else
  say "cloning $REPO_URL"
  git clone --depth 1 --branch "$REF" "$REPO_URL" "$SRC"
fi

if ! docker image inspect ubuntu:24.04 >/dev/null 2>&1; then
  say "pulling the base image ubuntu:24.04"
  docker pull ubuntu:24.04
fi

say "building the UI image (the long part on the first run)"
UI_IMAGE="$IMAGE" UI_REPO_URL="$REPO_URL" UI_REPO_REF="$REF" \
  bash "$SRC/docker/ui/build.sh"

say "starting the UI container $NAME"
docker rm -f "$NAME" >/dev/null 2>&1 || true
if (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; then
  die "port ${PORT} is busy: set OPENAGENT_PORT to a free one"
fi
UI_CONTAINER_NAME="$NAME" UI_IMAGE="$IMAGE" UI_PORT="$PORT" \
  bash "$SRC/docker/ui/run.sh"

url="http://127.0.0.1:${PORT}/"
ready=0
for _ in $(seq 1 120); do
  if curl -fsS -o /dev/null "$url"; then
    ready=1
    break
  fi
  sleep 1
done
(( ready )) || die "the UI did not answer on port ${PORT}; see: docker logs $NAME"

host_ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [[ -z "$host_ip" ]] && command -v ip >/dev/null 2>&1; then
  host_ip="$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')"
fi

say "the UI is up: $url"
if [[ -n "$host_ip" ]]; then
  say "network: http://$host_ip:$PORT/"
fi
say "choose the name, the RAM and the storage in the page and press CREATE"
say "the Linux of the computer is built and started from there"

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$url" >/dev/null 2>&1 || true
elif command -v open >/dev/null 2>&1; then
  open "$url" >/dev/null 2>&1 || true
fi

say "done"
