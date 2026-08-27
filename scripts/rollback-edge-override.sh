#!/usr/bin/env bash
set -euo pipefail
OVERRIDE=/opt/supabase/docker-compose.override.yml
cat > "$OVERRIDE" <<'EOF'
services:
  functions:
    env_file:
      - ./volumes/functions/.env
EOF
echo "Restored override:"
cat "$OVERRIDE"
cd /opt/supabase
docker compose up -d functions --force-recreate
sleep 5
docker ps --filter name=supabase-edge-functions --format '{{.Names}} {{.Status}}'
docker exec supabase-edge-functions sh -c 'k="$ANTHROPIC_API_KEY"; if echo "$k" | grep -q "^sk-ant-" && [ ${#k} -ge 40 ]; then echo EDGE=ok; else echo EDGE=bad; fi'
