#!/usr/bin/env bash
# Remove ANTHROPIC from compose `environment` so empty host var
# does not override volumes/functions/.env (env_file).
set -euo pipefail
COMPOSE=/opt/supabase/docker-compose.yml
backup="${COMPOSE}.bak.$(date +%Y%m%d%H%M%S)"
cp "$COMPOSE" "$backup"
echo "Backup: $backup"
# delete only the ANTHROPIC_API_KEY environment line we added
sed -i '/^[[:space:]]*ANTHROPIC_API_KEY: \${ANTHROPIC_API_KEY:-}/d' "$COMPOSE"
echo "After:"
grep -n ANTHROPIC "$COMPOSE" || echo "(no ANTHROPIC in compose — good, use env_file)"
