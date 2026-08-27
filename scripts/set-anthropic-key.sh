#!/usr/bin/env bash
#
# Пишет ANTHROPIC_API_KEY в volumes/functions/.env и перезапускает functions.
# Запуск на VPS:
#   bash /tmp/set-anthropic-key.sh
#   # или: bash /tmp/set-anthropic-key.sh 'sk-ant-api03-...'
#
set -euo pipefail

KEY_NAME="ANTHROPIC_API_KEY"
SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"
PRIMARY_ENV="${SUPABASE_ENV_FILE:-$SUPABASE_DIR/volumes/functions/.env}"

key="${1:-}"
if [ -z "$key" ]; then
  echo "Вставьте ТОЛЬКО ключ sk-ant-... и нажмите Enter (ввод скрыт)."
  echo "Не вставляйте сюда другие команды."
  read -rsp "ANTHROPIC_API_KEY: " key
  echo
fi

# trim whitespace / CR
key="$(printf '%s' "$key" | tr -d '\r\n' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"

if [ -z "$key" ]; then
  echo "Ошибка: пустой ключ." >&2
  exit 1
fi

if [[ "$key" == *" "* ]] || [[ "$key" == cd\ * ]] || [[ "$key" == docker* ]]; then
  echo "Ошибка: похоже, в поле ключа попала команда shell, а не API key." >&2
  echo "len=${#key}" >&2
  exit 1
fi

case "$key" in
  sk-ant-*) ;;
  *)
    echo "Ошибка: ключ должен начинаться с sk-ant- (сейчас len=${#key})." >&2
    exit 1
    ;;
esac

if [ "${#key}" -lt 40 ]; then
  echo "Ошибка: ключ слишком короткий (len=${#key}, нужно обычно 100+)." >&2
  echo "Скопируйте полный ключ из console.anthropic.com" >&2
  exit 1
fi

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

# verify file (no secret printed)
python3 - <<PY
from pathlib import Path
p = Path("$PRIMARY_ENV")
vals = []
for line in p.read_text().splitlines():
    if line.startswith("$KEY_NAME="):
        vals.append(line.split("=", 1)[1])
assert len(vals) == 1, vals
v = vals[0]
assert v.startswith("sk-ant-"), "prefix"
assert len(v) >= 40, len(v)
print(f"FILE_OK len={len(v)} path={p}")
PY

echo "Restarting functions..."
cd "$SUPABASE_DIR"
docker compose up -d functions --force-recreate
sleep 3

docker exec supabase-edge-functions sh -c \
  'k="$ANTHROPIC_API_KEY"; if echo "$k" | grep -q "^sk-ant-" && [ "${#k}" -ge 40 ]; then echo EDGE=ok len=${#k}; else echo EDGE=bad len=${#k}; exit 1; fi'

echo "Готово."
