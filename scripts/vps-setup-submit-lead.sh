#!/usr/bin/env bash
#
# Полная настройка submit-lead + Turnstile на VPS.
# Запуск из любой папки (обычно вы уже в /opt/supabase):
#
#   curl -fsSL https://raw.githubusercontent.com/EVERLIV/ai/main/scripts/vps-setup-submit-lead.sh | bash
#
# Или после git clone:
#   bash /opt/arendacity-ai/scripts/vps-setup-submit-lead.sh
#
# С ключом Turnstile сразу:
#   TURNSTILE_SECRET_KEY='0x4AAAAAA...' bash vps-setup-submit-lead.sh
#
set -euo pipefail

SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"
REPO_DIR="${REPO_DIR:-/opt/arendacity-ai}"
REPO_URL="${REPO_URL:-https://github.com/EVERLIV/ai.git}"
BRANCH="${BRANCH:-main}"

echo "=== ArendaCity: submit-lead + Turnstile ==="
echo "Supabase: $SUPABASE_DIR"
echo "Repo:     $REPO_DIR"
echo

# 1. Репозиторий с edge-функциями
if [ ! -d "$REPO_DIR/.git" ]; then
  echo "Клонируем репозиторий в $REPO_DIR ..."
  git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$REPO_DIR"
else
  echo "Обновляем $REPO_DIR ..."
  git -C "$REPO_DIR" fetch origin "$BRANCH"
  git -C "$REPO_DIR" checkout "$BRANCH"
  git -C "$REPO_DIR" pull origin "$BRANCH"
fi

# 2. Turnstile secret
KEY="${TURNSTILE_SECRET_KEY:-}"
if [ -z "$KEY" ]; then
  echo
  echo "Вставьте Turnstile Secret Key (0x4AAAAAA...) и Enter:"
  read -rsp "TURNSTILE_SECRET_KEY: " KEY
  echo
fi

if [ -z "$KEY" ]; then
  echo "Ошибка: ключ не задан." >&2
  exit 1
fi

bash "$REPO_DIR/scripts/set-turnstile-secret.sh" "$KEY"

# 3. Копируем все edge-функции в volumes
echo
echo "Деплой edge-функций ..."
SRC_DIR="$REPO_DIR/supabase/functions" \
  SUPABASE_DIR="$SUPABASE_DIR" \
  bash "$REPO_DIR/scripts/deploy-functions.sh"

echo
echo "=== Готово ==="
echo
echo "Проверка (должен быть JSON с error «Укажите имя», не 404/500):"
echo "  curl -s -X POST https://api.arendacity.com/functions/v1/submit-lead \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"name\":\"T\",\"phone\":\"+7900\",\"source\":\"website\"}'"
echo
echo "Логи функций:"
echo "  cd $SUPABASE_DIR && docker compose logs --tail=30 functions"
