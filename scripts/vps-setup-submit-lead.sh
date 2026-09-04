#!/usr/bin/env bash
#
# Полная настройка submit-lead + Google reCAPTCHA v3 на VPS.
# Запуск из любой папки (обычно вы уже в /opt/supabase):
#
#   curl -fsSL https://raw.githubusercontent.com/EVERLIV/ai/main/scripts/vps-setup-submit-lead.sh | bash
#
# Или после git clone:
#   bash /opt/arendacity-ai/scripts/vps-setup-submit-lead.sh
#
# С ключом reCAPTCHA сразу:
#   RECAPTCHA_SECRET_KEY='6L...' bash vps-setup-submit-lead.sh
#
set -euo pipefail

SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"
REPO_DIR="${REPO_DIR:-/opt/arendacity-ai}"
REPO_URL="${REPO_URL:-https://github.com/EVERLIV/ai.git}"
BRANCH="${BRANCH:-main}"

echo "=== ArendaCity: submit-lead + reCAPTCHA v3 ==="
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

# 2. reCAPTCHA secret
KEY="${RECAPTCHA_SECRET_KEY:-}"
if [ -z "$KEY" ]; then
  echo
  echo "Вставьте Google reCAPTCHA Secret Key и Enter:"
  read -rsp "RECAPTCHA_SECRET_KEY: " KEY
  echo
fi

if [ -z "$KEY" ]; then
  echo "Ошибка: ключ не задан." >&2
  exit 1
fi

bash "$REPO_DIR/scripts/set-recaptcha-secret.sh" "$KEY"

# 3. Копируем все edge-функции в volumes
echo
echo "Деплой edge-функций ..."
SRC_DIR="$REPO_DIR/supabase/functions" \
  SUPABASE_DIR="$SUPABASE_DIR" \
  bash "$REPO_DIR/scripts/deploy-functions.sh"

echo
echo "Готово. Фронт: VITE_RECAPTCHA_SITE_KEY в .env + rebuild."
echo "Cloudflare Bot Fight: docs/SETUP_CLOUDFLARE_BOTS.md"
