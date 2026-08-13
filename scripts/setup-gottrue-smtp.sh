#!/usr/bin/env bash
# Настройка SMTP Timeweb для self-hosted Supabase Auth (GoTrue).
# Запускать на VPS от root:
#   SMTP_PASS='пароль_ящика' bash /root/setup-gottrue-smtp.sh
#
# Ящик: noreply@arendacity.com  |  Хост: smtp.timeweb.ru

set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/supabase/.env}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/supabase}"
SMTP_HOST="${SMTP_HOST:-smtp.timeweb.ru}"
# 587 = STARTTLS (рекомендуем). 465 = SSL, если 587 закрыт файрволом.
SMTP_PORT="${SMTP_PORT:-587}"
SMTP_USER="${SMTP_USER:-noreply@arendacity.com}"
SMTP_ADMIN="${SMTP_ADMIN:-noreply@arendacity.com}"
SMTP_SENDER="${SMTP_SENDER:-АрендаСити}"
SITE_URL="${SITE_URL:-https://arendacity.com}"

if [[ -z "${SMTP_PASS:-}" ]]; then
  echo "Задайте пароль ящика:  SMTP_PASS='...' bash $0"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Нет файла $ENV_FILE"
  echo "Укажите путь: ENV_FILE=/путь/.env COMPOSE_DIR=/путь bash $0"
  exit 1
fi

cp -a "$ENV_FILE" "${ENV_FILE}.bak.$(date +%Y%m%d-%H%M%S)"
echo "Бэкап: ${ENV_FILE}.bak.*"

upsert() {
  local key="$1"
  local val="$2"
  local tmp
  tmp="$(mktemp)"
  if grep -qE "^${key}=" "$ENV_FILE"; then
    # не трогаем остальные строки
    awk -v k="$key" -v v="$val" '
      BEGIN { done=0 }
      $0 ~ "^" k "=" { print k "=" v; done=1; next }
      { print }
      END { if (!done) print k "=" v }
    ' "$ENV_FILE" > "$tmp"
    mv "$tmp" "$ENV_FILE"
  else
    printf '\n%s=%s\n' "$key" "$val" >> "$ENV_FILE"
  fi
}

upsert GOTRUE_SMTP_HOST "$SMTP_HOST"
upsert GOTRUE_SMTP_PORT "$SMTP_PORT"
upsert GOTRUE_SMTP_USER "$SMTP_USER"
upsert GOTRUE_SMTP_PASS "$SMTP_PASS"
upsert GOTRUE_SMTP_ADMIN_EMAIL "$SMTP_ADMIN"
upsert GOTRUE_SMTP_SENDER_NAME "$SMTP_SENDER"
upsert GOTRUE_MAILER_AUTOCONFIRM false
upsert GOTRUE_MAILER_SECURE_EMAIL_CHANGE_ENABLED true

upsert GOTRUE_MAILER_SUBJECTS_CONFIRMATION "Подтвердите аккаунт — АрендаСити"
upsert GOTRUE_MAILER_SUBJECTS_RECOVERY "Сброс пароля — АрендаСити"
upsert GOTRUE_MAILER_SUBJECTS_MAGIC_LINK "Вход в кабинет — АрендаСити"
upsert GOTRUE_MAILER_SUBJECTS_INVITE "Приглашение в АрендаСити"
upsert GOTRUE_MAILER_SUBJECTS_EMAIL_CHANGE "Подтвердите новый email — АрендаСити"
upsert GOTRUE_MAILER_SUBJECTS_REAUTHENTICATION "Код подтверждения — АрендаСити"

upsert GOTRUE_MAILER_TEMPLATES_CONFIRMATION "${SITE_URL}/email/confirm.html"
upsert GOTRUE_MAILER_TEMPLATES_RECOVERY "${SITE_URL}/email/recovery.html"
upsert GOTRUE_MAILER_TEMPLATES_MAGIC_LINK "${SITE_URL}/email/magic_link.html"
upsert GOTRUE_MAILER_TEMPLATES_INVITE "${SITE_URL}/email/invite.html"
upsert GOTRUE_MAILER_TEMPLATES_EMAIL_CHANGE "${SITE_URL}/email/email_change.html"
upsert GOTRUE_MAILER_TEMPLATES_REAUTHENTICATION "${SITE_URL}/email/reauthentication.html"

echo "Записано в $ENV_FILE (пароль не печатаем)."
echo "SMTP: $SMTP_USER @ $SMTP_HOST:$SMTP_PORT"

cd "$COMPOSE_DIR"

restart_auth() {
  if docker ps --format '{{.Names}}' | grep -qiE 'auth|gotrue'; then
    local name
    name="$(docker ps --format '{{.Names}}' | grep -iE 'auth|gotrue' | head -n1)"
    echo "Перезапуск контейнера: $name"
    docker restart "$name"
    return
  fi
  if [[ -f docker-compose.yml ]] || [[ -f compose.yml ]]; then
    echo "docker compose restart auth (или gotrue)"
    docker compose restart auth 2>/dev/null || docker compose restart gotrue 2>/dev/null || \
      docker compose up -d --force-recreate auth
    return
  fi
  echo "Контейнер Auth не найден. Перезапустите вручную:"
  echo "  docker ps | grep -i auth"
  echo "  docker restart <имя>"
  exit 1
}

restart_auth

echo
echo "Проверка логов (SMTP / mail):"
sleep 2
name="$(docker ps --format '{{.Names}}' | grep -iE 'auth|gotrue' | head -n1 || true)"
if [[ -n "$name" ]]; then
  docker logs --tail 40 "$name" 2>&1 | grep -iE 'smtp|mail|error' || docker logs --tail 20 "$name"
fi

echo
echo "Готово. Зарегистрируйте тестовый ящик на https://arendacity.com/auth?tab=register"
echo "Если письма нет — смените порт: SMTP_PORT=465 SMTP_PASS='...' bash $0"
