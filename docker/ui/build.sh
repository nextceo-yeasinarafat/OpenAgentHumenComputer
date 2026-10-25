#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_IMAGE="${UI_BASE_IMAGE:-ubuntu:24.04}"
IMAGE="${UI_IMAGE:-openagenthumencomputer/ui:latest}"
REPO_URL="${UI_REPO_URL:-https://github.com/nextceo-yeasinarafat/OpenAgentHumenComputer.git}"
REPO_REF="${UI_REPO_REF:-main}"

node_version="${NODE_VERSION:-}"
if [[ -z "$node_version" ]]; then
  node_version="$(curl -fsSL --max-time 20 https://nodejs.org/dist/index.json 2>/dev/null \
    | python3 -c 'import json,sys; print(next(r["version"] for r in json.load(sys.stdin) if r["lts"]).lstrip("v"))' 2>/dev/null || true)"
fi
[[ "$node_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || node_version="24.22.1"

if ! docker image inspect "$BASE_IMAGE" >/dev/null 2>&1; then
  echo "error: base image ${BASE_IMAGE} is not present" >&2
  echo "       docker pull ${BASE_IMAGE}" >&2
  exit 1
fi

echo "==> building ${IMAGE}"
echo "    node ${node_version} (LTS)"
echo "    project ${REPO_URL} (${REPO_REF})"

docker build \
  -t "$IMAGE" \
  -f "$HERE/Dockerfile" \
  --build-arg "NODE_VERSION=${node_version}" \
  --build-arg "REPO_URL=${REPO_URL}" \
  --build-arg "REPO_REF=${REPO_REF}" \
  "$HERE"

echo "==> built: ${IMAGE}"
