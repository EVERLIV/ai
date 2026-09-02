#!/usr/bin/env bash
#
# TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID → volumes/functions/.env
# Запуск на VPS:
#   bash scripts/set-telegram-leads.sh
#   bash scripts/set-telegram-leads.sh 'TOKEN' '-1001234567890'
#
set -euo pipefail

SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"
PRIMARY_ENV="${SUPABASE_ENV_FILE:-$SUPABASE_DIR/volumes/functions/.env}"

token="${1:-}"
chat="${2:-}"

if [ -z "$token" ]; then
  echo "TELEGRAM_BOT_TOKEN (от @BotFather):"
  read -rsp "TOKEN: " token
  echo
fi
if [ -z "$chat" ]; then
  echo "TELEGRAM_CHAT_ID (группа, например -100…):"
  read -r chat
fi

token="$(printf '%s' "$token" | tr -d '\r\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
chat="$(printf '%s' "$chat" | tr -d '\r\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

if [ -z "$token" ] || [ -z "$chat" ]; then
  echo "Ошибка: нужны TOKEN и CHAT_ID." >&2
  exit 1
fi

mkdir -p "$(dirname "$PRIMARY_ENV")"
touch "$PRIMARY_ENV"
grep -vE '^(TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID)=' "$PRIMARY_ENV" > /tmp/fn.env || true
{
  echo "TELEGRAM_BOT_TOKEN=$token"
  echo "TELEGRAM_CHAT_ID=$chat"
} >> /tmp/fn.env
mv /tmp/fn.env "$PRIMARY_ENV"
chmod 600 "$PRIMARY_ENV"

echo "OK: Telegram записан в $PRIMARY_ENV"
cd "$SUPABASE_DIR"
docker compose up -d functions --force-recreate
echo "OK: functions перезапущены"
