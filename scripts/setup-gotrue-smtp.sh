#!/usr/bin/env bash
# Настройка GoTrue SMTP (Timeweb) для dadatut.ru
#
# Использование на VPS (пароль — только в ОДИНАРНЫХ кавычках!):
#   SMTP_PASS='ваш_пароль' bash scripts/setup-gotrue-smtp.sh
#
# Или из файла (удобно для спецсимволов):
#   echo -n 'ваш_пароль' > /root/smtp.pass && chmod 600 /root/smtp.pass
#   SMTP_PASS_FILE=/root/smtp.pass bash scripts/setup-gotrue-smtp.sh
set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/supabase/.env}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/supabase}"
SITE_URL="${SITE_URL:-https://dadatut.ru}"
SMTP_USER="${SMTP_USER:-noreply@dadatut.ru}"
SMTP_FROM="${SMTP_FROM:-noreply@dadatut.ru}"
SMTP_HOST="${SMTP_HOST:-smtp.timeweb.ru}"
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_PASS="${SMTP_PASS:-}"
SMTP_PASS_FILE="${SMTP_PASS_FILE:-}"

if [ -n "$SMTP_PASS_FILE" ] && [ -f "$SMTP_PASS_FILE" ]; then
  SMTP_PASS="$(cat "$SMTP_PASS_FILE")"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Не найден $ENV_FILE" >&2
  exit 1
fi

if [ -z "$SMTP_PASS" ]; then
  echo "Задайте SMTP_PASS='...' или SMTP_PASS_FILE=/path/to/file" >&2
  exit 1
fi

cp "$ENV_FILE" "${ENV_FILE}.bak.$(date +%Y%m%d%H%M%S)"

# Безопасная запись значений со спецсимволами (|, /, &, <, …)
set_kv() {
  local key="$1"
  local val="$2"
  grep -v "^${key}=" "$ENV_FILE" > "${ENV_FILE}.tmp" || true
  printf '%s=%s\n' "$key" "$val" >> "${ENV_FILE}.tmp"
  mv "${ENV_FILE}.tmp" "$ENV_FILE"
}

set_kv GOTRUE_SMTP_HOST "$SMTP_HOST"
set_kv GOTRUE_SMTP_PORT "$SMTP_PORT"
set_kv GOTRUE_SMTP_USER "$SMTP_USER"
set_kv GOTRUE_SMTP_PASS "$SMTP_PASS"
set_kv GOTRUE_SMTP_ADMIN_EMAIL "$SMTP_FROM"
set_kv GOTRUE_SMTP_SENDER_NAME "ДАДАТУТ"
set_kv GOTRUE_MAILER_AUTOCONFIRM "false"
set_kv GOTRUE_MAILER_SUBJECTS_CONFIRMATION "Подтвердите email — ДАДАТУТ"
set_kv GOTRUE_MAILER_SUBJECTS_RECOVERY "Сброс пароля — ДАДАТУТ"
set_kv GOTRUE_MAILER_SUBJECTS_MAGIC_LINK "Вход в кабинет — ДАДАТУТ"
set_kv GOTRUE_MAILER_SUBJECTS_INVITE "Приглашение — ДАДАТУТ"
set_kv GOTRUE_MAILER_SUBJECTS_EMAIL_CHANGE "Подтвердите новый email — ДАДАТУТ"
set_kv GOTRUE_MAILER_SUBJECTS_REAUTHENTICATION "Код подтверждения — ДАДАТУТ"
set_kv MAILER_TEMPLATES_CONFIRMATION "${SITE_URL}/email/confirm.html"
set_kv MAILER_TEMPLATES_RECOVERY "${SITE_URL}/email/recovery.html"
set_kv MAILER_TEMPLATES_MAGIC_LINK "${SITE_URL}/email/magic_link.html"
set_kv MAILER_TEMPLATES_INVITE "${SITE_URL}/email/invite.html"
set_kv MAILER_TEMPLATES_EMAIL_CHANGE "${SITE_URL}/email/email_change.html"
set_kv MAILER_TEMPLATES_REAUTHENTICATION "${SITE_URL}/email/reauthentication.html"

echo "==> Перезапуск auth"
cd "$COMPOSE_DIR"
docker compose restart auth 2>/dev/null || docker compose restart gotrue 2>/dev/null || true

echo "OK: SMTP $SMTP_USER via $SMTP_HOST:$SMTP_PORT, шаблоны $SITE_URL/email/"
