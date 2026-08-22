#!/usr/bin/env bash
#
# Копирует edge-функции на self-hosted Supabase и перезапускает рантайм.
#
# Запускать НА VPS из корня проекта (там, где лежит папка supabase/functions):
#   bash scripts/deploy-functions.sh
#
# Проблема, которую скрипт решает: в контейнере лежат не все функции.
# В логах это выглядит так:
#   serving the request with /home/deno/functions/ai-chat
#   worker boot error: could not find an appropriate entry point
# То есть рантайм жив, но каталога функции на диске нет.

set -euo pipefail

# Куда смонтирован каталог функций на хосте.
TARGET_DIR="${SUPABASE_FUNCTIONS_DIR:-/opt/supabase/volumes/functions}"
SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"
SRC_DIR="supabase/functions"

if [ ! -d "$SRC_DIR" ]; then
  echo "Ошибка: не найден $SRC_DIR. Запустите скрипт из корня проекта." >&2
  exit 1
fi

if [ ! -d "$TARGET_DIR" ]; then
  echo "Ошибка: не найден каталог функций $TARGET_DIR" >&2
  echo "Найдите его так:" >&2
  echo "  docker inspect supabase-edge-functions --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{println}}{{end}}'" >&2
  echo "и запустите: SUPABASE_FUNCTIONS_DIR=<путь> bash $0" >&2
  exit 1
fi

echo "Источник:  $SRC_DIR"
echo "Назначение: $TARGET_DIR"
echo

# Копируем каждую функцию. Каталог main не трогаем — это роутер рантайма.
for fn_path in "$SRC_DIR"/*/; do
  fn="$(basename "$fn_path")"
  if [ "$fn" = "_shared" ]; then
    continue
  fi
  if [ ! -f "$fn_path/index.ts" ]; then
    echo "  пропуск $fn (нет index.ts)"
    continue
  fi
  mkdir -p "$TARGET_DIR/$fn"
  cp "$fn_path/index.ts" "$TARGET_DIR/$fn/index.ts"
  echo "  ✓ $fn"
done

# Общие модули (agencyTelegram.ts и т.д.) — импортируются как ../_shared/...
if [ -d "$SRC_DIR/_shared" ]; then
  mkdir -p "$TARGET_DIR/_shared"
  cp -r "$SRC_DIR/_shared/." "$TARGET_DIR/_shared/"
  echo "  ✓ _shared"
fi

echo
echo "Содержимое каталога функций:"
ls -1 "$TARGET_DIR"

echo
echo "Перезапуск рантайма функций..."
cd "$SUPABASE_DIR"
docker compose restart functions

echo
echo "Готово. Проверьте, что ai-chat отвечает:"
echo "  docker compose logs --tail=20 functions"
