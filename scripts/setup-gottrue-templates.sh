#!/usr/bin/env bash
# Русские HTML-шаблоны Auth для self-hosted GoTrue.
# Official docker-compose НЕ прокидывает GOTRUE_MAILER_TEMPLATES_* из .env —
# поэтому скрипт пишет переменные и добавляет docker-compose.override.yml.
#
# Запускать на VPS от root:
#   bash /root/setup-gottrue-templates.sh

set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/supabase/.env}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/supabase}"
SITE_URL="${SITE_URL:-https://arendacity.com}"
OVERRIDE="${COMPOSE_DIR}/docker-compose.override.yml"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Нет файла $ENV_FILE"
  exit 1
fi

cp -a "$ENV_FILE" "${ENV_FILE}.bak.templates.$(date +%Y%m%d-%H%M%S)"

upsert() {
  local key="$1"
  local val="$2"
  local tmp
  tmp="$(mktemp)"
  if grep -qE "^${key}=" "$ENV_FILE"; then
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

upsert SMTP_SENDER_NAME "АрендаСити"

upsert MAILER_SUBJECTS_CONFIRMATION '"Подтвердите email — АрендаСити"'
upsert MAILER_SUBJECTS_RECOVERY '"Сброс пароля — АрендаСити"'
upsert MAILER_SUBJECTS_MAGIC_LINK '"Вход в кабинет — АрендаСити"'
upsert MAILER_SUBJECTS_INVITE '"Приглашение в АрендаСити"'
upsert MAILER_SUBJECTS_EMAIL_CHANGE '"Подтвердите новый email — АрендаСити"'
upsert MAILER_SUBJECTS_REAUTHENTICATION '"Код подтверждения — АрендаСити"'

upsert MAILER_TEMPLATES_CONFIRMATION "${SITE_URL}/email/confirm.html"
upsert MAILER_TEMPLATES_RECOVERY "${SITE_URL}/email/recovery.html"
upsert MAILER_TEMPLATES_MAGIC_LINK "${SITE_URL}/email/magic_link.html"
upsert MAILER_TEMPLATES_INVITE "${SITE_URL}/email/invite.html"
upsert MAILER_TEMPLATES_EMAIL_CHANGE "${SITE_URL}/email/email_change.html"
upsert MAILER_TEMPLATES_REAUTHENTICATION "${SITE_URL}/email/reauthentication.html"

if [[ ! -f "$OVERRIDE" ]]; then
  cat > "$OVERRIDE" <<'EOF'
services:
  auth:
    environment:
      GOTRUE_MAILER_TEMPLATES_CONFIRMATION: ${MAILER_TEMPLATES_CONFIRMATION}
      GOTRUE_MAILER_TEMPLATES_RECOVERY: ${MAILER_TEMPLATES_RECOVERY}
      GOTRUE_MAILER_TEMPLATES_MAGIC_LINK: ${MAILER_TEMPLATES_MAGIC_LINK}
      GOTRUE_MAILER_TEMPLATES_INVITE: ${MAILER_TEMPLATES_INVITE}
      GOTRUE_MAILER_TEMPLATES_EMAIL_CHANGE: ${MAILER_TEMPLATES_EMAIL_CHANGE}
      GOTRUE_MAILER_TEMPLATES_REAUTHENTICATION: ${MAILER_TEMPLATES_REAUTHENTICATION}
      GOTRUE_MAILER_SUBJECTS_CONFIRMATION: ${MAILER_SUBJECTS_CONFIRMATION}
      GOTRUE_MAILER_SUBJECTS_RECOVERY: ${MAILER_SUBJECTS_RECOVERY}
      GOTRUE_MAILER_SUBJECTS_MAGIC_LINK: ${MAILER_SUBJECTS_MAGIC_LINK}
      GOTRUE_MAILER_SUBJECTS_INVITE: ${MAILER_SUBJECTS_INVITE}
      GOTRUE_MAILER_SUBJECTS_EMAIL_CHANGE: ${MAILER_SUBJECTS_EMAIL_CHANGE}
      GOTRUE_MAILER_SUBJECTS_REAUTHENTICATION: ${MAILER_SUBJECTS_REAUTHENTICATION}
      GOTRUE_SMTP_SENDER_NAME: ${SMTP_SENDER_NAME}
EOF
  echo "Создан $OVERRIDE"
else
  echo "Уже есть $OVERRIDE — проверьте, что в services.auth.environment есть GOTRUE_MAILER_TEMPLATES_*"
fi

echo "Шаблоны записаны. URL: ${SITE_URL}/email/*.html"

cd "$COMPOSE_DIR"
docker compose up -d --force-recreate auth

echo "Готово. Проверка: docker exec supabase-auth env | grep MAILER_TEMPLATES"
