#!/usr/bin/env bash
#
# Пишет TURNSTILE_SECRET_KEY в volumes/functions/.env и перезапускает functions.
# Запуск на VPS (SSH):
#   cd /opt/supabase
#   curl -fsSL https://raw.githubusercontent.com/EVERLIV/ai/main/scripts/vps-setup-submit-lead.sh | bash
#
# Или из клонированного репозитория:
#   cd /opt/arendacity-ai && bash scripts/set-turnstile-secret.sh
#
# Или с ключом аргументом:
#   bash scripts/set-turnstile-secret.sh '0x4AAAAAAA...'
#
# Или взять ключ из локального .env рядом с проектом:
#   bash scripts/set-turnstile-secret.sh --from-env
#
set -euo pipefail

KEY_NAME="TURNSTILE_SECRET_KEY"
SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"
PRIMARY_ENV="${SUPABASE_ENV_FILE:-$SUPABASE_DIR/volumes/functions/.env}"
PROJECT_ENV="${PROJECT_ENV:-.env}"

usage() {
  cat <<'EOF'
Cloudflare Turnstile — запись secret key на VPS.

  bash scripts/set-turnstile-secret.sh              # вставить ключ вручную (скрытый ввод)
  bash scripts/set-turnstile-secret.sh '0x4AAA…'    # передать ключ аргументом
  bash scripts/set-turnstile-secret.sh --from-env   # взять TURNSTILE_SECRET_KEY из .env

Переменные:
  SUPABASE_DIR          /opt/supabase
  SUPABASE_ENV_FILE     $SUPABASE_DIR/volumes/functions/.env
  PROJECT_ENV           .env в корне проекта

После скрипта задеплойте функцию submit-lead:
  bash scripts/deploy-functions.sh
EOF
}

validate_key() {
  local key="$1"
  if [ -z "$key" ]; then
    echo "Ошибка: пустой ключ." >&2
    exit 1
  fi
  if [[ "$key" == *" "* ]] || [[ "$key" == cd\ * ]] || [[ "$key" == docker* ]]; then
    echo "Ошибка: похоже, в поле ключа попала команда shell." >&2
    exit 1
  fi
  case "$key" in
    0x4AAAAAA*)
      ;;
    *)
      echo "Ошибка: Turnstile secret key обычно начинается с 0x4AAAAAA… (len=${#key})." >&2
      exit 1
      ;;
  esac
  if [ "${#key}" -lt 30 ]; then
    echo "Ошибка: ключ слишком короткий (len=${#key})." >&2
    exit 1
  fi
}

read_key_from_env_file() {
  local file="$1"
  if [ ! -f "$file" ]; then
    echo "Ошибка: файл $file не найден." >&2
    exit 1
  fi
  local line
  line="$(grep -E "^${KEY_NAME}=" "$file" | tail -n 1 || true)"
  if [ -z "$line" ]; then
    echo "Ошибка: в $file нет строки ${KEY_NAME}=..." >&2
    exit 1
  fi
  printf '%s' "${line#*=}" | tr -d '\r\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

upsert_key() {
  local key="$1"
  mkdir -p "$(dirname "$PRIMARY_ENV")"
  if [ -f "$PRIMARY_ENV" ]; then
    backup="${PRIMARY_ENV}.bak.$(date +%Y%m%d%H%M%S)"
    cp "$PRIMARY_ENV" "$backup"
    echo "Backup: $backup"
  fi

  tmp="$(mktemp)"
  if [ -f "$PRIMARY_ENV" ]; then
    grep -v "^${KEY_NAME}=" "$PRIMARY_ENV" > "$tmp" || true
  else
    : > "$tmp"
  fi
  printf '%s=%s\n' "$KEY_NAME" "$key" >> "$tmp"
  mv "$tmp" "$PRIMARY_ENV"
  chmod 600 "$PRIMARY_ENV"
}

verify_file() {
  python3 - <<PY
from pathlib import Path
p = Path("$PRIMARY_ENV")
vals = [ln.split("=", 1)[1] for ln in p.read_text().splitlines() if ln.startswith("$KEY_NAME=")]
assert len(vals) == 1, vals
v = vals[0]
assert v.startswith("0x4AAAAAA"), "prefix"
assert len(v) >= 30, len(v)
print(f"FILE_OK len={len(v)} path={p}")
PY
}

restart_functions() {
  echo "Restarting functions..."
  cd "$SUPABASE_DIR"
  docker compose up -d functions --force-recreate
  sleep 3
  docker exec supabase-edge-functions sh -c \
    'k="$TURNSTILE_SECRET_KEY"; if echo "$k" | grep -q "^0x4AAAAAA" && [ "${#k}" -ge 30 ]; then echo EDGE=ok len=${#k}; else echo EDGE=bad len=${#k:-0}; exit 1; fi'
}

# --- main ---

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

key=""
if [ "${1:-}" = "--from-env" ]; then
  key="$(read_key_from_env_file "$PROJECT_ENV")"
  echo "Ключ прочитан из $PROJECT_ENV (len=${#key})"
elif [ -n "${1:-}" ]; then
  key="$(printf '%s' "$1" | tr -d '\r\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
else
  echo "Вставьте Turnstile Secret Key из Cloudflare (0x4AAAAAA…) и Enter."
  echo "Не вставляйте сюда команды shell."
  read -rsp "${KEY_NAME}: " key
  echo
fi

validate_key "$key"
upsert_key "$key"
verify_file
restart_functions

echo
echo "Готово. Задеплойте submit-lead, если ещё не делали:"
echo "  bash scripts/deploy-functions.sh"
echo
echo "Проверка endpoint (нужен валидный captcha_token с сайта):"
echo "  curl -s -X POST https://api.arendacity.com/functions/v1/submit-lead \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"name\":\"Test\",\"phone\":\"+79001234567\",\"source\":\"website\"}'"
