#!/usr/bin/env bash
# Зашифрованный pg_dump → Timeweb S3 (бакет в РФ).
# Шифрование AES-256 (openssl) ДО загрузки. Секреты не коммитить.
#
# Обязательные переменные:
#   BACKUP_PASSPHRASE  — пароль шифрования архива
#   S3_ENDPOINT        — например https://s3.timeweb.cloud
#   S3_BUCKET          — имя бакета
#   S3_ACCESS_KEY
#   S3_SECRET_KEY
#
# Опционально:
#   CONTAINER          — docker-контейнер Postgres (по умолчанию supabase-db)
#   PG_DUMP_URI        — если задан, pg_dump с хоста вместо docker exec
#   BACKUP_DIR         — локальный каталог (/var/backups/postgres)
#   S3_PREFIX          — префикс ключа (postgres)
#   RETAIN_DAYS        — удалять объекты старше N дней (0 = не чистить)
#
# Пример cron (ежедневно 03:15):
#   15 3 * * * . /root/backup-s3.env && /opt/arendacity/scripts/backup-postgres-s3.sh >> /var/log/pg-backup.log 2>&1
set -euo pipefail

CONTAINER="${CONTAINER:-supabase-db}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/postgres}"
S3_PREFIX="${S3_PREFIX:-postgres}"
RETAIN_DAYS="${RETAIN_DAYS:-30}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BASE="pgdump-${STAMP}.sql.gz"
PLAIN="${BACKUP_DIR}/${BASE}"
ENC="${PLAIN}.enc"
S3_KEY="${S3_PREFIX}/${BASE}.enc"

: "${BACKUP_PASSPHRASE:?Задайте BACKUP_PASSPHRASE}"
: "${S3_ENDPOINT:?Задайте S3_ENDPOINT (Timeweb S3)}"
: "${S3_BUCKET:?Задайте S3_BUCKET}"
: "${S3_ACCESS_KEY:?Задайте S3_ACCESS_KEY}"
: "${S3_SECRET_KEY:?Задайте S3_SECRET_KEY}"

mkdir -p "$BACKUP_DIR"
umask 077

echo "== dump $STAMP =="

if [[ -n "${PG_DUMP_URI:-}" ]]; then
  pg_dump --no-owner --format=plain "$PG_DUMP_URI" | gzip -9 > "$PLAIN"
else
  if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
    echo "Контейнер $CONTAINER не найден. Задайте CONTAINER= или PG_DUMP_URI=." >&2
    exit 1
  fi
  docker exec -i "$CONTAINER" pg_dump -U postgres -d postgres --no-owner --format=plain \
    | gzip -9 > "$PLAIN"
fi

echo "== encrypt =="
openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt \
  -in "$PLAIN" -out "$ENC" -pass env:BACKUP_PASSPHRASE
rm -f "$PLAIN"

echo "== upload s3://$S3_BUCKET/$S3_KEY =="
export AWS_ACCESS_KEY_ID="$S3_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$S3_SECRET_KEY"
export AWS_DEFAULT_REGION="${S3_REGION:-ru-1}"

if command -v aws >/dev/null 2>&1; then
  aws --endpoint-url "$S3_ENDPOINT" s3 cp "$ENC" "s3://${S3_BUCKET}/${S3_KEY}"
elif command -v s3cmd >/dev/null 2>&1; then
  s3cmd --ssl --host="${S3_ENDPOINT#https://}" --host-bucket="%(bucket)s.${S3_ENDPOINT#https://}" \
    --access_key="$S3_ACCESS_KEY" --secret_key="$S3_SECRET_KEY" \
    put "$ENC" "s3://${S3_BUCKET}/${S3_KEY}"
else
  echo "Нужен aws CLI или s3cmd." >&2
  exit 1
fi

rm -f "$ENC"
echo "OK $S3_KEY"

if [[ "$RETAIN_DAYS" -gt 0 ]] && command -v aws >/dev/null 2>&1; then
  cutoff="$(date -u -d "-${RETAIN_DAYS} days" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || true)"
  if [[ -n "$cutoff" ]]; then
    echo "== retain ${RETAIN_DAYS}d (cutoff $cutoff) =="
    aws --endpoint-url "$S3_ENDPOINT" s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/" \
      | awk '{print $1"T"$2","$4}' \
      | while IFS=, read -r mtime key; do
          [[ -z "${key:-}" ]] && continue
          if [[ "$mtime" < "$cutoff" ]]; then
            aws --endpoint-url "$S3_ENDPOINT" s3 rm "s3://${S3_BUCKET}/${S3_PREFIX}/${key}"
          fi
        done
  fi
fi
