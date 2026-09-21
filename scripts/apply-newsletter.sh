#!/usr/bin/env bash
# Apply newsletter tables + RPC on self-hosted Supabase (VPS).
# Usage on VPS:
#   bash scripts/apply-newsletter.sh
#   bash scripts/apply-newsletter.sh /path/to/self_hosted_newsletter.sql
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SQL_FILE="${1:-$SCRIPT_DIR/../supabase/self_hosted_newsletter.sql}"
if [ ! -f "$SQL_FILE" ]; then
  echo "Missing $SQL_FILE" >&2
  exit 1
fi

DB_CONT="$(docker ps -qf name=supabase-db | head -1)"
if [ -z "$DB_CONT" ]; then
  echo "supabase-db container not found" >&2
  exit 1
fi

echo "==> Apply $SQL_FILE"
docker exec -i "$DB_CONT" psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$SQL_FILE"

echo "==> Reload PostgREST schema"
docker exec "$DB_CONT" psql -U postgres -d postgres -c "NOTIFY pgrst, 'reload schema';"

echo "==> Verify"
docker exec "$DB_CONT" psql -U postgres -d postgres -tAc \
  "SELECT to_regclass('public.newsletter_subscribers'), to_regclass('public.newsletter_campaigns'), to_regclass('public.newsletter_sends');"

echo "OK — tables ready"
