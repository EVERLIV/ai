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
if [ -z "$SRK" ]; then
  echo "Ошибка: SERVICE_ROLE_KEY не найден в $MAIN" >&2
  exit 1
fi

mkdir -p "$(dirname "$FN")"
touch "$FN"
grep -v '^SUPABASE_URL=' "$FN" | grep -v '^SUPABASE_SERVICE_ROLE_KEY=' > /tmp/fn.env || true
{
  echo 'SUPABASE_URL=http://kong:8000'
  echo "SUPABASE_SERVICE_ROLE_KEY=$SRK"
} >> /tmp/fn.env
mv /tmp/fn.env "$FN"
chmod 600 "$FN"

echo "OK: SUPABASE_URL + SERVICE_ROLE_KEY записаны в $FN"
cd "$SUPABASE_DIR"
docker compose up -d functions --force-recreate
echo "OK: functions перезапущены"
