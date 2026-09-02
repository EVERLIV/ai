#!/usr/bin/env bash
#
# Прописывает секреты бота агентств в /opt/supabase/.env и перезапускает functions.
# Запускать НА VPS по SSH:
#   bash scripts/set-agency-telegram-secrets.sh
#
# Или с путём к .env:
#   SUPABASE_ENV_FILE=/path/to/.env bash scripts/set-agency-telegram-secrets.sh

set -euo pipefail

ENV_FILE="${SUPABASE_ENV_FILE:-/opt/supabase/.env}"
COMPOSE_DIR="${SUPABASE_DIR:-$(dirname "$ENV_FILE")}"

upsert_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    local tmp
    tmp="$(mktemp)"
    grep -v "^${key}=" "$ENV_FILE" > "$tmp"
    printf '%s=%s\n' "$key" "$value" >> "$tmp"
    mv "$tmp" "$ENV_FILE"
    echo "  обновлён $key"
  else
    printf '%s=%s\n' "$key" "$value" >> "$ENV_FILE"
    echo "  добавлен $key"
  fi
}

if [ ! -f "$ENV_FILE" ]; then
  echo "Файл $ENV_FILE не найден." >&2
  echo "Поиск .env на сервере:" >&2
  find /opt /root /home -maxdepth 4 -name '.env' 2>/dev/null | head -10 || true
  echo "Запустите: SUPABASE_ENV_FILE=/найденный/.env bash $0" >&2
  exit 1
fi

backup="${ENV_FILE}.bak.$(date +%Y%m%d%H%M%S)"
cp "$ENV_FILE" "$backup"
echo "Резервная копия: $backup"
echo

read -rsp "AGENCY_TELEGRAM_BOT_TOKEN (от @BotFather): " bot_token
echo
read -rsp "AGENCY_TELEGRAM_WEBHOOK_SECRET (случайная строка): " webhook_secret
echo
read -rsp "AGENCY_NOTIFY_INTERNAL_SECRET (другая случайная строка): " notify_secret
echo

if [ -z "$bot_token" ] || [ -z "$webhook_secret" ] || [ -z "$notify_secret" ]; then
  echo "Ошибка: все три значения обязательны." >&2
  exit 1
fi

upsert_env "AGENCY_TELEGRAM_BOT_TOKEN" "$bot_token"
upsert_env "AGENCY_TELEGRAM_WEBHOOK_SECRET" "$webhook_secret"
upsert_env "AGENCY_NOTIFY_INTERNAL_SECRET" "$notify_secret"

# Часто нужны для agency-функций; не перезаписываем, если уже есть
grep -q '^SUPABASE_URL=' "$ENV_FILE" || upsert_env "SUPABASE_URL" "https://api.arendacity.com"
grep -q '^SITE_URL=' "$ENV_FILE" || upsert_env "SITE_URL" "https://dadatut.ru"

chmod 600 "$ENV_FILE"

echo
echo "Проверка (значения скрыты):"
grep -E '^AGENCY_|^SUPABASE_URL=|^SITE_URL=' "$ENV_FILE" | sed 's/=.*/=***/'

echo
echo "Перезапуск edge functions..."
if [ -f "$COMPOSE_DIR/docker-compose.yml" ] || [ -f "$COMPOSE_DIR/compose.yaml" ]; then
  (cd "$COMPOSE_DIR" && docker compose up -d functions)
else
  echo "docker-compose не найден в $COMPOSE_DIR — перезапустите functions вручную."
fi

echo
echo "Webhook Telegram (выполните на своём ПК или здесь):"
echo "  curl -G \"https://api.telegram.org/bot<TOKEN>/setWebhook\" \\"
echo "    --data-urlencode \"url=https://api.arendacity.com/functions/v1/agency-telegram-bot?secret=<WEBHOOK_SECRET>\""
