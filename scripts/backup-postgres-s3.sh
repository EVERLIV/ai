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

if [[ -f /root/backup-s3.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(sed 's/\r$//' /root/backup-s3.env)
  set +a
fi

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
  export ENC S3_KEY
  python3 - <<'PY'
import datetime, hashlib, hmac, os, urllib.parse, urllib.request

def sign(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()

payload = open(os.environ["ENC"], "rb").read()
payload_hash = hashlib.sha256(payload).hexdigest()
host = os.environ["S3_ENDPOINT"].removeprefix("https://").removeprefix("http://").split("/")[0]
bucket = os.environ["S3_BUCKET"]
key = os.environ["S3_KEY"]
region = os.environ.get("S3_REGION", "ru-1")
access = os.environ["S3_ACCESS_KEY"]
secret = os.environ["S3_SECRET_KEY"]
now = datetime.datetime.now(datetime.UTC)
amzdate = now.strftime("%Y%m%dT%H%M%SZ")
datestamp = now.strftime("%Y%m%d")
canonical_uri = "/" + urllib.parse.quote(bucket, safe="") + "/" + urllib.parse.quote(key, safe="/")
canonical_headers = f"host:{host}\nx-amz-content-sha256:{payload_hash}\nx-amz-date:{amzdate}\n"
signed_headers = "host;x-amz-content-sha256;x-amz-date"
canonical_request = "\n".join(
    ["PUT", canonical_uri, "", canonical_headers, signed_headers, payload_hash]
)
scope = f"{datestamp}/{region}/s3/aws4_request"
string_to_sign = "\n".join(
    [
        "AWS4-HMAC-SHA256",
        amzdate,
        scope,
        hashlib.sha256(canonical_request.encode()).hexdigest(),
    ]
)
signing_key = sign(("AWS4" + secret).encode(), datestamp)
signing_key = hmac.new(signing_key, region.encode(), hashlib.sha256).digest()
signing_key = hmac.new(signing_key, b"s3", hashlib.sha256).digest()
signing_key = hmac.new(signing_key, b"aws4_request", hashlib.sha256).digest()
signature = hmac.new(signing_key, string_to_sign.encode(), hashlib.sha256).hexdigest()
auth = (
    f"AWS4-HMAC-SHA256 Credential={access}/{scope}, "
    f"SignedHeaders={signed_headers}, Signature={signature}"
)
req = urllib.request.Request(f"https://{host}{canonical_uri}", data=payload, method="PUT")
req.add_header("Host", host)
req.add_header("x-amz-content-sha256", payload_hash)
req.add_header("x-amz-date", amzdate)
req.add_header("Authorization", auth)
req.add_header("Content-Type", "application/octet-stream")
with urllib.request.urlopen(req, timeout=300) as resp:
    print(f"python upload HTTP {resp.status}")
PY
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
