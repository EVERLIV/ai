#!/usr/bin/env bash
set -euo pipefail
DB=$(docker ps -qf name=supabase-db | head -1)
psql() { docker exec "$DB" psql -U postgres -d postgres -v ON_ERROR_STOP=0 "$@"; }

echo "== table =="
psql -c "SELECT to_regclass('public.listing_ai_sessions') AS reg;"

echo "== rls =="
psql -c "SELECT relrowsecurity FROM pg_class WHERE relname='listing_ai_sessions';"

echo "== policies =="
psql -c "SELECT policyname, cmd, roles::text FROM pg_policies WHERE tablename='listing_ai_sessions';"

echo "== grants =="
psql -c "SELECT grantee, string_agg(privilege_type, ',') FROM information_schema.role_table_grants WHERE table_name='listing_ai_sessions' GROUP BY 1 ORDER BY 1;"

echo "== reapply sql =="
# file should already be on /tmp from earlier; copy again if missing
if [ ! -f /tmp/listing_ai_sessions.sql ]; then
  echo "missing /tmp/listing_ai_sessions.sql"
fi
