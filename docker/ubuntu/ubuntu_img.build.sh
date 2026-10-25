#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_IMAGE="${UBUNTU_BASE_IMAGE:-ubuntu:24.04}"
IMAGE="${UBUNTU_IMAGE:-openagenthumencomputer/ubuntu:24.04}"
PLATFORM="${UBUNTU_PLATFORM:-}"

if ! docker image inspect "$BASE_IMAGE" >/dev/null 2>&1; then
  echo "error: base image ${BASE_IMAGE} is not present" >&2
  echo "       run ./ubuntu_img.download.sh first" >&2
  exit 1
fi

echo "==> building ${IMAGE}"
args=(-t "$IMAGE" -f "$HERE/Dockerfile")
if [[ -n "$PLATFORM" ]]; then
  args+=(--platform "$PLATFORM")
fi
docker build "${args[@]}" "$HERE/.."

echo "==> built: ${IMAGE}"
