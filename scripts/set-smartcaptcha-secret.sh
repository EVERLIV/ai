#!/usr/bin/env bash
# Пишет SMARTCAPTCHA_SERVER_KEY в volumes/functions/.env и перезапускает functions.
#
#   bash scripts/set-smartcaptcha-secret.sh
#   bash scripts/set-smartcaptcha-secret.sh 'ysc2_...'
#   bash scripts/set-smartcaptcha-secret.sh --from-env
#
set -euo pipefail

KEY_NAME="SMARTCAPTCHA_SERVER_KEY"
SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"
PRIMARY_ENV="${SUPABASE_ENV_FILE:-$SUPABASE_DIR/volumes/functions/.env}"
REPO_ENV="${REPO_ENV:-.env}"

usage() {
  cat <<EOF
Яндекс SmartCaptcha — запись server key на VPS.

  bash scripts/set-smartcaptcha-secret.sh
  bash scripts/set-smartcaptcha-secret.sh 'ysc2_…'
  bash scripts/set-smartcaptcha-secret.sh --from-env

См. docs/SETUP_SMARTCAPTCHA.md
EOF
}

KEY="${1:-}"
if [ "$KEY" = "-h" ] || [ "$KEY" = "--help" ]; then
  usage
  exit 0
fi

if [ "$KEY" = "--from-env" ]; then
  if [ -f "$REPO_ENV" ]; then
    KEY="$(grep -E "^${KEY_NAME}=" "$REPO_ENV" | tail -1 | cut -d= -f2- | tr -d '\r\n' | tr -d '"' | tr -d "'")"
  fi
  if [ -z "$KEY" ] && [ -f "$REPO_ENV" ]; then
    KEY="$(grep -E '^RECAPTCHA_SECRET_KEY=' "$REPO_ENV" | tail -1 | cut -d= -f2- | tr -d '\r\n' | tr -d '"' | tr -d "'")"
  fi
  KEY="${KEY:-}"
fi

if [ -z "$KEY" ]; then
  echo
  read -rsp "SMARTCAPTCHA_SERVER_KEY: " KEY
  echo
fi

if [ -z "$KEY" ] || [ "${#KEY}" -lt 16 ]; then
  echo "Ошибка: пустой или слишком короткий server key." >&2
  exit 1
fi

mkdir -p "$(dirname "$PRIMARY_ENV")"
touch "$PRIMARY_ENV"
grep -vE "^(SMARTCAPTCHA_SERVER_KEY|RECAPTCHA_SECRET_KEY)=" "$PRIMARY_ENV" > /tmp/fn.env.sc || true
echo "${KEY_NAME}=${KEY}" >> /tmp/fn.env.sc
mv /tmp/fn.env.sc "$PRIMARY_ENV"
chmod 600 "$PRIMARY_ENV"

echo "OK: ${KEY_NAME} записан (len=${#KEY})"
cd "$SUPABASE_DIR"
if [ -f docker-compose.yml ] || [ -f compose.yaml ]; then
  docker compose up -d functions --force-recreate
else
  docker restart supabase-edge-functions
fi
echo "OK: functions перезапущены"
