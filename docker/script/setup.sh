#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${OPENAGENT_REPO:-https://github.com/nextceo-yeasinarafat/OpenAgentHumenComputer.git}"
REF="${OPENAGENT_REF:-main}"
NAME="${OPENAGENT_NAME:-openagentcomputer}"
IMAGE="${OPENAGENT_IMAGE:-openagenthumencomputer/ubuntu:24.04}"
BASE_IMAGE="${OPENAGENT_BASE_IMAGE:-ubuntu:24.04}"
PORT="${OPENAGENT_PORT:-6080}"
USER_NAME="${OPENAGENT_USER:-agent}"
PASSWORD="${OPENAGENT_PASSWORD:-openagentcomputer}"
SRC="${OPENAGENT_SRC:-$HOME/.openagenthumencomputer}"

say() { printf 'openagentcomputer: %s\n' "$*"; }
die() { printf 'openagentcomputer: %s\n' "$*" >&2; exit 1; }

DOCKER="docker"
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
    DOCKER="sudo docker"
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

if ! $DOCKER image inspect "$BASE_IMAGE" >/dev/null 2>&1; then
  say "pulling the base image $BASE_IMAGE"
  $DOCKER pull "$BASE_IMAGE"
fi

say "making the image of the computer ready (the long part on the first run)"
UBUNTU_BASE_IMAGE="$BASE_IMAGE" UBUNTU_IMAGE="$IMAGE" bash "$SRC/docker/ubuntu/ubuntu_img.build.sh"

say "starting the container $NAME"
$DOCKER rm -f "$NAME" >/dev/null 2>&1 || true
if (exec 3<>"/dev/tcp/127.0.0.1/$PORT") 2>/dev/null; then
  die "port ${PORT} is busy: set OPENAGENT_PORT to a free one"
fi
$DOCKER run -d \
  --name "$NAME" \
  --hostname "$NAME" \
  --security-opt seccomp=unconfined \
  -p "${PORT}:6080" \
  -e "OPEN_COMPUTER_NAME=$NAME" \
  -e "OPEN_COMPUTER_USER=$USER_NAME" \
  -e "OPEN_COMPUTER_PASSWORD=$PASSWORD" \
  -e "TZ=${TZ:-UTC}" \
  "$IMAGE" \
  bash -c "/opt/open-computer/system/computer_setup.sh && /opt/open-computer/novnc/run.sh && exec sleep infinity"

url="http://127.0.0.1:${PORT}/vnc.html?autoconnect=1&resize=scale"
ready=0
for _ in $(seq 1 120); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/vnc.html"; then
    ready=1
    break
  fi
  sleep 1
done
(( ready )) || die "the screen did not answer on port ${PORT}; see: docker logs $NAME"

host_ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
if [[ -z "$host_ip" ]] && command -v ip >/dev/null 2>&1; then
  host_ip="$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')"
fi

say "the computer is up: $NAME"
say "screen:  $url"
if [[ -n "$host_ip" ]]; then
  say "network: http://$host_ip:$PORT/vnc.html?autoconnect=1&resize=scale"
fi
say "user: $USER_NAME  password: $PASSWORD"

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$url" >/dev/null 2>&1 || true
elif command -v open >/dev/null 2>&1; then
  open "$url" >/dev/null 2>&1 || true
fi

say "done"
