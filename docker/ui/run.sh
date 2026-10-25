#!/usr/bin/env bash
set -euo pipefail

NAME="${UI_CONTAINER_NAME:-openagenthumencomputer}"
IMAGE="${UI_IMAGE:-openagenthumencomputer/ui:latest}"
PORT="${UI_PORT:-1010}"

case "${1:-}" in
  --stop)
    docker rm -f "$NAME" >/dev/null 2>&1 || true
    echo "==> stopped: ${NAME}"
    exit 0
    ;;
  --logs)
    exec docker logs -f "$NAME"
    ;;
  ""|--start) ;;
  *)
    echo "usage: $(basename "$0") [--start|--stop|--logs]" >&2
    exit 2
    ;;
esac

docker image inspect "$IMAGE" >/dev/null 2>&1 || {
  echo "error: image ${IMAGE} is not present: run ./build.sh first" >&2
  exit 1
}

if docker container inspect "$NAME" >/dev/null 2>&1; then
  echo "==> replacing the container ${NAME}"
  docker rm -f "$NAME" >/dev/null
fi

echo "==> starting ${NAME} from ${IMAGE}"
docker run -d \
  --name "$NAME" \
  --restart unless-stopped \
  -p "${PORT}:1010" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  "$IMAGE" >/dev/null

for _ in $(seq 1 30); do
  state="$(docker inspect -f '{{.State.Health.Status}}' "$NAME" 2>/dev/null || echo starting)"
  [[ "$state" == "healthy" ]] && break
  sleep 1
done

ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
echo "==> ${NAME}: $(docker inspect -f '{{.State.Health.Status}}' "$NAME" 2>/dev/null || echo unknown)"
echo "    http://${ip:-127.0.0.1}:${PORT}"
