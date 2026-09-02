#!/usr/bin/env bash
# Apply support_tickets tables + RPC on self-hosted Supabase.
set -euo pipefail

SQL_FILE="${1:-/tmp/self_hosted_support_tickets.sql}"
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

echo "==> Verify tables"
docker exec "$DB_CONT" psql -U postgres -d postgres -tAc \
  "SELECT to_regclass('public.support_tickets'), to_regclass('public.support_ticket_messages');"

echo "OK"
