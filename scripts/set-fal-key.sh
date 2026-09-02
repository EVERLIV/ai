#!/usr/bin/env bash
#
# Пишет FAL_KEY в volumes/functions/.env и перезапускает functions.
# Запуск на VPS:
#   bash scripts/set-fal-key.sh
#   # или: bash scripts/set-fal-key.sh 'fal_...'
#
set -euo pipefail

KEY_NAME="FAL_KEY"
SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"
PRIMARY_ENV="${SUPABASE_ENV_FILE:-$SUPABASE_DIR/volumes/functions/.env}"

key="${1:-}"
if [ -z "$key" ]; then
  echo "Вставьте ключ FAL_KEY с fal.ai и нажмите Enter (ввод скрыт)."
  read -rsp "FAL_KEY: " key
  echo
fi

key="$(printf '%s' "$key" | tr -d '\r\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

if [ -z "$key" ]; then
  echo "Ошибка: пустой ключ." >&2
  exit 1
fi

mkdir -p "$(dirname "$PRIMARY_ENV")"
touch "$PRIMARY_ENV"
grep -v "^${KEY_NAME}=" "$PRIMARY_ENV" > /tmp/fn.env || true
echo "${KEY_NAME}=${key}" >> /tmp/fn.env
grep -v '^FAL_CHAT_MODEL=' /tmp/fn.env > /tmp/fn2.env || true
echo 'FAL_CHAT_MODEL=google/gemini-2.0-flash-lite' >> /tmp/fn2.env
mv /tmp/fn2.env "$PRIMARY_ENV"
chmod 600 "$PRIMARY_ENV"

echo "OK: $KEY_NAME записан в $PRIMARY_ENV"
cd "$SUPABASE_DIR"
docker compose up -d functions --force-recreate
echo "OK: functions перезапущены"
