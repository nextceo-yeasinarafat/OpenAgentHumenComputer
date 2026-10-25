# The UI image of the computer.
#
# It is an Ubuntu 24.04 with nothing but what serving the web UI needs: Node.js,
# git and the project itself. No desktop, no browser, no editor, no VNC.
# The project is cloned from its repository at build time, so the image always
# carries a checkout it did not get from the machine that builds it.
#
# The build context is this folder (docker/ui), because the scripts of core/ are
# copied in from here:
#
#   docker build -f Dockerfile -t openagenthumencomputer/ui:latest .
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    TZ=UTC \
    LANG=C.UTF-8

RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      git \
      python3 \
      unzip \
      xz-utils \
      tini \
  && rm -rf /var/lib/apt/lists/*

# Node.js, the runtime of Vite. The version is given by the build script, which
# resolves the latest LTS; the default here is the one it was written with.
ARG NODE_VERSION=24.22.1
RUN set -eux; \
    arch="$(dpkg --print-architecture)"; \
    case "$arch" in \
      amd64) node_arch=x64 ;; \
      arm64) node_arch=arm64 ;; \
      *) echo "unsupported architecture: $arch" >&2; exit 1 ;; \
    esac; \
    curl -fsSL --retry 3 --retry-delay 2 -o /tmp/node.tar.xz \
      "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${node_arch}.tar.xz"; \
    tar -xJf /tmp/node.tar.xz -C /usr/local --strip-components=1 --no-same-owner; \
    rm -f /tmp/node.tar.xz; \
    node --version; \
    npm --version

ARG DOCKER_VERSION=27.3.1
RUN set -eux; \
    arch="$(dpkg --print-architecture)"; \
    case "$arch" in \
      amd64) docker_arch=x86_64 ;; \
      arm64) docker_arch=aarch64 ;; \
      *) echo "unsupported architecture: $arch" >&2; exit 1 ;; \
    esac; \
    curl -fsSL --retry 3 --retry-delay 2 -o /tmp/docker.tgz \
      "https://download.docker.com/linux/static/stable/${docker_arch}/docker-${DOCKER_VERSION}.tgz"; \
    tar -xzf /tmp/docker.tgz -C /tmp; \
    install -m 0755 /tmp/docker/docker /usr/local/bin/docker; \
    rm -rf /tmp/docker.tgz /tmp/docker; \
    docker --version

# The scripts of the container: start, pull, serve and status.
COPY core/ /opt/openagenthumencomputer/core/

# The project itself, cloned into core/app. The ref is main; a build for another
# branch or tag passes REPO_REF.
ARG REPO_URL=https://github.com/nextceo-yeasinarafat/OpenAgentHumenComputer.git
ARG REPO_REF=main
ARG CACHE_BUST=main
RUN set -eux; \
    echo "the checkout of ${CACHE_BUST}"; \
    git clone --depth 1 --branch "$REPO_REF" "$REPO_URL" /opt/openagenthumencomputer/core/app; \
    chmod 0755 /opt/openagenthumencomputer/core/*.sh /opt/openagenthumencomputer/core/*.py

# The packages and the production build, so the container starts from a ready
# dist/ and does not need the network to boot.
WORKDIR /opt/openagenthumencomputer/core/app
RUN npm install --no-audit --no-fund \
  && npm run build

ENV NODE_ENV=production

# The UI is served on 1010 for every interface of the container; the host
# publishes that port (see run.sh).
EXPOSE 1010

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:1010/ >/dev/null || exit 1

WORKDIR /opt/openagenthumencomputer/core

ENTRYPOINT ["/usr/bin/tini", "--", "/opt/openagenthumencomputer/core/start.sh"]
