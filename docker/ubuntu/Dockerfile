# Core Ubuntu base for the open-computer stack.
#
# This image is only the operating system: a real Ubuntu 24.04 with the
# essential tools. The desktop, the terminal, noVNC and the explorer live in
# their own folders and are added by their own images/layers.
#
# It is the same base as the main computer image (docker/Dockerfile), with
# nothing of the browser, the editor, X11, VNC or the window manager.
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    TZ=UTC

# The core tools of a usable Ubuntu. No desktop, no browser, no VNC.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    wget \
    gnupg \
    locales \
    sudo \
    python3 \
    python3-pip \
    git \
    unzip \
    jq \
    procps \
  && sed -i 's/^# *en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
  && locale-gen \
  && rm -rf /var/lib/apt/lists/*

# The account the computer uses, the same as the main image: uid 1000 with
# passwordless sudo, so packages and services can be installed from inside.
RUN if ! id -u open-computer >/dev/null 2>&1; then \
      if id -u 1000 >/dev/null 2>&1; then \
        existing="$(getent passwd 1000 | cut -d: -f1)"; \
        if [ "$existing" = "ubuntu" ]; then userdel -r ubuntu 2>/dev/null || userdel ubuntu; fi; \
      fi; \
      useradd --uid 1000 --create-home --shell /bin/bash open-computer; \
    else \
      usermod --home /home/open-computer --shell /bin/bash open-computer; \
    fi \
  && mkdir -p /home/open-computer/.local/bin /home/open-computer/.config /home/open-computer/workspace \
  && chown -R open-computer:open-computer /home/open-computer \
  && printf '%s\n' 'open-computer ALL=(ALL) NOPASSWD:ALL' \
    > /etc/sudoers.d/90-open-computer \
  && chmod 0440 /etc/sudoers.d/90-open-computer

# The toolchains of the computer. docker/system/dependency owns them: the
# latest stable curl and Python (built from source) and Bun. Each installer
# writes its own /etc/profile.d file, so the PATH of a login shell is set
# automatically.
COPY system/dependency/ /opt/open-computer/dependency/
RUN chmod 0755 /opt/open-computer/dependency/*.sh \
  && bash /opt/open-computer/dependency/curl_install.sh

RUN bash /opt/open-computer/dependency/python_install.sh
RUN bash /opt/open-computer/dependency/bun_install.sh

# The DevTools protocol bridge. docker/system/cdp owns it: a small forwarder
# that takes Chrome's loopback DevTools port (9222) to the container network
# (9223) for the host bridge.
COPY system/cdp/ /opt/open-computer/cdp/
RUN chmod 0755 /opt/open-computer/cdp/*.sh /opt/open-computer/cdp/cdp-forward.py \
  && bash /opt/open-computer/cdp/install.sh

# The remote screen of the computer. docker/system/novnc owns it: Xvfb,
# fluxbox, x11vnc, the latest stable noVNC and websockify. It installs into
# this image, so the picture of the computer is served on port 6080 without
# downloads at boot. See ../system/novnc/novnc.conf for the versions and ports.
COPY system/novnc/ /opt/open-computer/novnc/
RUN chmod 0755 /opt/open-computer/novnc/*.sh \
  && bash /opt/open-computer/novnc/install.sh

# The terminal of the computer. docker/system/terminal owns it: xterm from the
# Ubuntu archive, running a real bash login shell on the display of this image.
COPY system/terminal/ /opt/open-computer/terminal/
RUN chmod 0755 /opt/open-computer/terminal/*.sh \
  && bash /opt/open-computer/terminal/install.sh

# The file explorer of the computer. docker/system/explorer owns it: PCManFM,
# the real file manager of the Linux machine, on the same home as the terminal.
COPY system/explorer/ /opt/open-computer/explorer/
RUN chmod 0755 /opt/open-computer/explorer/*.sh \
  && bash /opt/open-computer/explorer/install.sh

# The editor of the computer. docker/system/vscode owns it: the latest stable
# VS Code Server (the web build), unpacked into /opt/vscode-server and served
# on port 8989 under the /vscode base path.
COPY system/vscode/ /opt/open-computer/vscode/
RUN chmod 0755 /opt/open-computer/vscode/*.sh \
  && bash /opt/open-computer/vscode/install.sh

# The browser of the computer. docker/system/chromium owns it: Google Chrome
# stable from Google's apt repository, its DevTools protocol and the forwarder
# that lets the bridge outside the computer reach it.
COPY system/chromium/ /opt/open-computer/chromium/
RUN chmod 0755 /opt/open-computer/chromium/*.sh /opt/open-computer/chromium/cdp-forward.py \
  && bash /opt/open-computer/chromium/install.sh

# System fonts for the computer. docker/system/font owns it.
COPY system/font/ /opt/open-computer/font/
RUN chmod 0755 /opt/open-computer/font/*.sh 2>/dev/null || true \
  && bash /opt/open-computer/font/install.sh

# The auth of the computer. docker/system/auth owns it: the door of the
# account (PBKDF2 in SQLite, JWT sessions) on the loopback of the machine.
COPY system/auth/ /opt/open-computer/auth/
RUN chmod 0755 /opt/open-computer/auth/*.sh /opt/open-computer/auth/*.py \
  && bash /opt/open-computer/auth/install.sh

# The MCP of the computer. docker/mcp owns it: the server the computer
# speaks for itself (7072), over the SDK the dependency step installed.
COPY mcp/ /opt/open-computer/mcp/
RUN chmod 0755 /opt/open-computer/mcp/*.sh \
  && bash /opt/open-computer/mcp/install.sh

# The hands and the eyes of the computer. docker/system/api owns it: xdotool
# and ImageMagick, which the agent API of the bridge speaks through.
COPY system/api/ /opt/open-computer/api/
RUN chmod 0755 /opt/open-computer/api/*.sh /opt/open-computer/api/*.py \
  && bash /opt/open-computer/api/install.sh

# Virtual hardware configuration. The scripts of this folder apply
# system.conf; the modules next to them are copied to their own places above,
# so only the scripts, the config and the notes land in /opt/open-computer/system.
# computer_setup.sh is the first-boot script: the bridge runs it inside the
# container with the values the user chose, so the account, the password, the
# time zone and the locale of the computer are set the way a real Linux is.
COPY system/system.conf system/install.sh system/control.sh \
     system/storage.sh system/cpu_core.sh system/gpu.sh system/ram.sh \
     system/computer_setup.sh system/system.md /opt/open-computer/system/
RUN chmod 0755 /opt/open-computer/system/*.sh \
  && bash /opt/open-computer/system/install.sh

# noVNC (6080) and the editor (8989) are the ports meant to be reached. Raw VNC
# (5900) is kept on loopback by run.sh, because this image has no VNC password.
EXPOSE 6080 5900 8989

WORKDIR /home/open-computer

CMD ["/bin/bash"]
