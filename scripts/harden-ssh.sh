#!/usr/bin/env bash
# SSH: только ключи, вход по паролю выключен.
# По умолчанию печатает план. Применить: APPLY=1 bash scripts/harden-ssh.sh
# Не запускать с рабочей станции на прод без явного APPLY=1 на самом VPS.
set -euo pipefail

APPLY="${APPLY:-0}"
SSHD_CONFIG="${SSHD_CONFIG:-/etc/ssh/sshd_config}"
AUTH_KEYS="${AUTH_KEYS:-}"

if [[ -z "$AUTH_KEYS" ]]; then
  if [[ -n "${SUDO_USER:-}" && -f "/home/${SUDO_USER}/.ssh/authorized_keys" ]]; then
    AUTH_KEYS="/home/${SUDO_USER}/.ssh/authorized_keys"
  elif [[ -f /root/.ssh/authorized_keys ]]; then
    AUTH_KEYS=/root/.ssh/authorized_keys
  else
    AUTH_KEYS=/root/.ssh/authorized_keys
  fi
fi

log() { printf '%s\n' "$*"; }

key_count=0
if [[ -f "$AUTH_KEYS" ]]; then
  key_count="$(grep -cE '^(ssh-|ecdsa-|sk-)' "$AUTH_KEYS" 2>/dev/null || true)"
fi

log "== harden-ssh =="
log "sshd_config: $SSHD_CONFIG"
log "authorized_keys: $AUTH_KEYS ($key_count ключей)"
log "APPLY=$APPLY"
log
log "Планируемые директивы:"
log "  PasswordAuthentication no"
log "  KbdInteractiveAuthentication no"
log "  ChallengeResponseAuthentication no"
log "  PermitRootLogin prohibit-password"
log "  PubkeyAuthentication yes"

if [[ "$key_count" -lt 1 ]]; then
  log
  log "ОШИБКА: нет SSH-ключей в $AUTH_KEYS."
  log "Сначала добавьте свой pubkey, иначе после APPLY потеряете доступ."
  exit 1
fi

apply_sshd() {
  local key="$1"
  local value="$2"
  if grep -qE "^[[:space:]]*#?[[:space:]]*${key}[[:space:]]" "$SSHD_CONFIG"; then
    sed -i -E "s|^[[:space:]]*#?[[:space:]]*${key}[[:space:]].*|${key} ${value}|" "$SSHD_CONFIG"
  else
    printf '\n%s %s\n' "$key" "$value" >> "$SSHD_CONFIG"
  fi
}

if [[ "$APPLY" != "1" ]]; then
  log
  log "Режим dry-run. На VPS: APPLY=1 bash scripts/harden-ssh.sh"
  log "Затем: sshd -t && systemctl reload sshd   # или ssh"
  exit 0
fi

cp -a "$SSHD_CONFIG" "${SSHD_CONFIG}.bak.$(date +%Y%m%d%H%M%S)"
apply_sshd PasswordAuthentication no
apply_sshd KbdInteractiveAuthentication no
apply_sshd ChallengeResponseAuthentication no
apply_sshd PermitRootLogin prohibit-password
apply_sshd PubkeyAuthentication yes

if sshd -t; then
  if systemctl reload sshd 2>/dev/null || systemctl reload ssh 2>/dev/null; then
    log "sshd перезагружен."
  else
    log "Конфиг валиден. Перезагрузите sshd вручную: systemctl reload sshd"
  fi
else
  log "sshd -t не прошёл. Восстановите бэкап ${SSHD_CONFIG}.bak.*"
  exit 1
fi
