#!/usr/bin/env bash
# Синхронизирует SUPABASE_URL + SERVICE_ROLE_KEY в volumes/functions/.env
# Запуск на VPS: bash scripts/sync-functions-env.sh
set -euo pipefail

MAIN="${SUPABASE_MAIN_ENV:-/opt/supabase/.env}"
FN="${SUPABASE_ENV_FILE:-/opt/supabase/volumes/functions/.env}"
SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"

if [ ! -f "$MAIN" ]; then
  echo "Ошибка: не найден $MAIN" >&2
  exit 1
fi

SRK="$(grep -E '^SERVICE_ROLE_KEY=' "$MAIN" | tail -1 | cut -d= -f2- | tr -d '\r\n')"
ANON="$(grep -E '^ANON_KEY=' "$MAIN" | tail -1 | cut -d= -f2- | tr -d '\r\n')"
if [ -z "$ANON" ]; then
  ANON="$(grep -E '^SUPABASE_ANON_KEY=' "$MAIN" | tail -1 | cut -d= -f2- | tr -d '\r\n')"
fi
ANTH="$(grep -E '^ANTHROPIC_API_KEY=' "$MAIN" | tail -1 | cut -d= -f2- | tr -d '\r\n')"
TG_TOKEN="$(grep -E '^TELEGRAM_BOT_TOKEN=' "$MAIN" | tail -1 | cut -d= -f2- | tr -d '\r\n')"
TG_CHAT="$(grep -E '^TELEGRAM_CHAT_ID=' "$MAIN" | tail -1 | cut -d= -f2- | tr -d '\r\n')"
FAL="$(grep -E '^FAL_KEY=' "$MAIN" | tail -1 | cut -d= -f2- | tr -d '\r\n')"
if [ -z "$ANTH" ] && [ -f /opt/supabase/volumes/functions/.env ]; then
  ANTH="$(grep -E '^ANTHROPIC_API_KEY=' /opt/supabase/volumes/functions/.env | tail -1 | cut -d= -f2- | tr -d '\r\n')"
fi
if [ -z "$FAL" ] && [ -f /opt/supabase/volumes/functions/.env ]; then
  FAL="$(grep -E '^FAL_KEY=' /opt/supabase/volumes/functions/.env | tail -1 | cut -d= -f2- | tr -d '\r\n')"
fi
if [ -z "$TG_TOKEN" ] && [ -f /opt/supabase/volumes/functions/.env ]; then
  TG_TOKEN="$(grep -E '^TELEGRAM_BOT_TOKEN=' /opt/supabase/volumes/functions/.env | tail -1 | cut -d= -f2- | tr -d '\r\n')"
fi
if [ -z "$TG_CHAT" ] && [ -f /opt/supabase/volumes/functions/.env ]; then
  TG_CHAT="$(grep -E '^TELEGRAM_CHAT_ID=' /opt/supabase/volumes/functions/.env | tail -1 | cut -d= -f2- | tr -d '\r\n')"
fi
if [ -z "$SRK" ]; then
  echo "Ошибка: SERVICE_ROLE_KEY не найден в $MAIN" >&2
  exit 1
fi

mkdir -p "$(dirname "$FN")"
touch "$FN"
grep -vE '^(SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|CATALOG_URL|CATALOG_ANON_KEY|ANTHROPIC_API_KEY|FAL_KEY|FAL_CHAT_MODEL|TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID)=' "$FN" > /tmp/fn.env || true
{
  echo 'SUPABASE_URL=http://kong:8000'
  echo "SUPABASE_SERVICE_ROLE_KEY=$SRK"
  echo 'CATALOG_URL=https://api.arendacity.com'
  [ -n "$ANON" ] && echo "CATALOG_ANON_KEY=$ANON"
  [ -n "$ANTH" ] && echo "ANTHROPIC_API_KEY=$ANTH"
  [ -n "$FAL" ] && echo "FAL_KEY=$FAL"
  echo 'FAL_CHAT_MODEL=google/gemini-2.5-flash-lite'
  [ -n "$TG_TOKEN" ] && echo "TELEGRAM_BOT_TOKEN=$TG_TOKEN"
  [ -n "$TG_CHAT" ] && echo "TELEGRAM_CHAT_ID=$TG_CHAT"
} >> /tmp/fn.env
mv /tmp/fn.env "$FN"
chmod 600 "$FN"

echo "OK: SUPABASE_URL + SERVICE_ROLE_KEY записаны в $FN"
cd "$SUPABASE_DIR"
docker compose up -d functions --force-recreate
echo "OK: functions перезапущены"
