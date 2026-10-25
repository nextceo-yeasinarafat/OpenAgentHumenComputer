#!/usr/bin/env bash
set -euo pipefail

NAME="${OPEN_COMPUTER_NAME:-}"
USER_NAME="${OPEN_COMPUTER_USER:-}"
PASSWORD="${OPEN_COMPUTER_PASSWORD:-}"
TIMEZONE="${OPEN_COMPUTER_TIMEZONE:-UTC}"
LOCALE="${OPEN_COMPUTER_LOCALE:-}"
COUNTRY="${OPEN_COMPUTER_COUNTRY:-}"
LANGUAGE="${OPEN_COMPUTER_LANGUAGE:-}"

say() { printf 'computer: %s\n' "$*"; }

[[ "$(id -u)" -eq 0 ]] || { say "root is needed to set the computer up"; exit 1; }
[[ "$USER_NAME" =~ ^[a-z][a-z0-9_-]{1,31}$ ]] || { say "refusing an unsafe user name: ${USER_NAME}"; exit 1; }

if [[ -f "/usr/share/zoneinfo/${TIMEZONE}" ]]; then
  ln -sf "/usr/share/zoneinfo/${TIMEZONE}" /etc/localtime
  printf '%s\n' "$TIMEZONE" > /etc/timezone
  say "time zone set to ${TIMEZONE}"
else
  say "zone ${TIMEZONE} is not on this machine; keeping UTC"
fi

if [[ -n "$LOCALE" ]]; then
  base="${LOCALE%%.*}"
  if grep -qE "^#? *${base}(\\.UTF-8)? +UTF-8" /etc/locale.gen 2>/dev/null; then
    sed -i -E "s/^#? *(${base})(\\.UTF-8)? +UTF-8/\\1\\2 UTF-8/" /etc/locale.gen
    locale-gen "$base" >/dev/null 2>&1 || true
    update-locale "LANG=${LOCALE}" >/dev/null 2>&1 || true
    say "locale set to ${LOCALE}"
  else
    say "no locale for this language on the image; keeping en_US.UTF-8"
  fi
else
  say "no locale for this language on the image; keeping en_US.UTF-8"
fi

if id "$USER_NAME" >/dev/null 2>&1; then
  say "account ${USER_NAME} already exists"
else
  useradd --create-home --shell /bin/bash --groups sudo "$USER_NAME"
  say "account ${USER_NAME} created"
fi
printf '%s:%s\n' "$USER_NAME" "$PASSWORD" | chpasswd
printf '%s ALL=(ALL) NOPASSWD:ALL\n' "$USER_NAME" > "/etc/sudoers.d/91-${USER_NAME}"
chmod 0440 "/etc/sudoers.d/91-${USER_NAME}"
mkdir -p "/home/${USER_NAME}/workspace"
chown -R "${USER_NAME}:${USER_NAME}" "/home/${USER_NAME}"
install -d -m 0755 -o "${USER_NAME}" -g "${USER_NAME}" "/home/${USER_NAME}/.config"
touch "/home/${USER_NAME}/.sudo_as_admin_successful"
chown "${USER_NAME}:${USER_NAME}" "/home/${USER_NAME}/.sudo_as_admin_successful"
chmod 0644 "/home/${USER_NAME}/.sudo_as_admin_successful"

if [[ -x "/opt/open-computer/auth/init_user.py" ]]; then
  AUTH_USER="$USER_NAME" AUTH_PASSWORD="$PASSWORD" \
    /opt/python/current/bin/python3 /opt/open-computer/auth/init_user.py \
    && say "login of ${USER_NAME} is ready"
fi

mkdir -p /etc/open-computer
cat > /etc/open-computer/computer.env <<EOF
COMPUTER_NAME=${NAME}
COMPUTER_USER=${USER_NAME}
COMPUTER_COUNTRY=${COUNTRY}
COMPUTER_LANGUAGE=${LANGUAGE}
COMPUTER_TIMEZONE=${TIMEZONE}
COMPUTER_LOCALE=${LOCALE}
COMPUTER_CREATED_AT=$(date -Iseconds)
EOF
chmod 0644 /etc/open-computer/computer.env

say "the computer is up: ${USER_NAME}@${NAME:-computer} · ${TIMEZONE}"
