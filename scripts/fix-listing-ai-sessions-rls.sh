#!/usr/bin/env bash
# Apply listing_ai_sessions ownership + RLS on self-hosted Postgres.
set -euo pipefail

SQL_FILE="${1:-/tmp/listing_ai_sessions.sql}"
if [ ! -f "$SQL_FILE" ]; then
  echo "Missing $SQL_FILE" >&2
  exit 1
fi

DB_CONT="$(docker ps -qf name=supabase-db | head -1)"
if [ -z "$DB_CONT" ]; then
  echo "supabase-db container not found" >&2
  exit 1
fi

echo "==> Fix owner (supabase_admin)"
docker exec "$DB_CONT" psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 \
  -c 'ALTER TABLE IF EXISTS public.listing_ai_sessions OWNER TO postgres;' || true

echo "==> Apply $SQL_FILE as postgres"
docker exec -i "$DB_CONT" psql -U postgres -d postgres -v ON_ERROR_STOP=1 < "$SQL_FILE"

echo "==> Policies:"
docker exec "$DB_CONT" psql -U postgres -d postgres -tAc \
  "SELECT policyname FROM pg_policies WHERE tablename='listing_ai_sessions' ORDER BY 1;"

echo "OK"
