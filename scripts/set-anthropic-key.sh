#!/usr/bin/env bash
#
# Прописывает ANTHROPIC_API_KEY в окружение self-hosted Supabase на VPS
# и перезапускает контейнер edge-функций.
#
# Запускать НА СЕРВЕРЕ (ssh на VPS), а не на локальной машине:
#   bash set-anthropic-key.sh sk-ant-api03-...
#
# Ключ можно не передавать аргументом — скрипт спросит его без эха,
# чтобы он не попал в историю команд (~/.bash_history).

set -euo pipefail

ENV_FILE="${SUPABASE_ENV_FILE:-/opt/supabase/.env}"
KEY_NAME="ANTHROPIC_API_KEY"

key="${1:-}"
if [ -z "$key" ]; then
  read -rsp "Вставьте ANTHROPIC_API_KEY (ввод скрыт): " key
  echo
fi

if [ -z "$key" ]; then
  echo "Ошибка: ключ не указан." >&2
  exit 1
fi

case "$key" in
  sk-ant-*) ;;
  *) echo "Ошибка: ключ должен начинаться с 'sk-ant-'." >&2; exit 1 ;;
esac

if [ ! -f "$ENV_FILE" ]; then
  echo "Ошибка: не найден $ENV_FILE" >&2
  echo "Укажите путь: SUPABASE_ENV_FILE=/путь/к/.env bash $0" >&2
  exit 1
fi

# Резервная копия перед изменением.
backup="${ENV_FILE}.bak.$(date +%Y%m%d%H%M%S)"
cp "$ENV_FILE" "$backup"
echo "Резервная копия: $backup"

# Обновляем существующую строку или добавляем новую.
if grep -q "^${KEY_NAME}=" "$ENV_FILE"; then
  tmp="$(mktemp)"
  grep -v "^${KEY_NAME}=" "$ENV_FILE" > "$tmp"
  printf '%s=%s\n' "$KEY_NAME" "$key" >> "$tmp"
  mv "$tmp" "$ENV_FILE"
  echo "Обновлён существующий $KEY_NAME."
else
  printf '%s=%s\n' "$KEY_NAME" "$key" >> "$ENV_FILE"
  echo "Добавлен $KEY_NAME."
fi

chmod 600 "$ENV_FILE"

echo "Проверка (значение скрыто):"
grep "^${KEY_NAME}=" "$ENV_FILE" | sed 's/=.*/=***/'

echo
echo "Перезапустите контейнер функций, чтобы переменная подхватилась:"
echo "  cd \"$(dirname "$ENV_FILE")\" && docker compose up -d functions"
echo
echo "Затем проверьте, что чат отвечает:"
echo "  curl -s -X POST https://api.arendacity.com/functions/v1/ai-chat \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H \"Authorization: Bearer \$SUPABASE_ANON_KEY\" \\"
echo "    -d '{\"messages\":[{\"role\":\"user\",\"content\":\"привет\"}]}' | head -c 300"
