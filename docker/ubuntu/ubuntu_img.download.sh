#!/usr/bin/env bash
set -euo pipefail

BASE_IMAGE="${UBUNTU_BASE_IMAGE:-ubuntu:24.04}"
PLATFORM="${UBUNTU_PLATFORM:-}"

echo "==> downloading ${BASE_IMAGE}"
if [[ -n "$PLATFORM" ]]; then
  docker pull --platform "$PLATFORM" "$BASE_IMAGE"
else
  docker pull "$BASE_IMAGE"
fi

echo "==> downloaded: ${BASE_IMAGE}"
