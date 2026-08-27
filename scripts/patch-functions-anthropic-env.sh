#!/usr/bin/env bash
# Adds ANTHROPIC_API_KEY to functions service in docker-compose.yml if missing.
set -euo pipefail

COMPOSE="${1:-/opt/supabase/docker-compose.yml}"
if [ ! -f "$COMPOSE" ]; then
  echo "Missing $COMPOSE" >&2
  exit 1
fi

if grep -q "ANTHROPIC_API_KEY" "$COMPOSE"; then
  echo "ANTHROPIC_API_KEY already in $COMPOSE"
  grep -n "ANTHROPIC_API_KEY" "$COMPOSE"
  exit 0
fi

backup="${COMPOSE}.bak.$(date +%Y%m%d%H%M%S)"
cp "$COMPOSE" "$backup"
echo "Backup: $backup"

python3 - "$COMPOSE" <<'PY'
import sys
from pathlib import Path
p = Path(sys.argv[1])
text = p.read_text()
needle = '      VERIFY_JWT: "${FUNCTIONS_VERIFY_JWT}"\n'
insert = needle + "      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}\n"
if needle not in text:
    raise SystemExit("VERIFY_JWT needle not found in compose")
p.write_text(text.replace(needle, insert, 1))
print("patched OK")
PY

grep -n "ANTHROPIC_API_KEY" "$COMPOSE"
echo
echo "Next (on this server):"
echo "  bash /tmp/set-anthropic-key.sh"
echo "  cd /opt/supabase && docker compose up -d functions --force-recreate"
echo
echo "Check (no secret printed):"
echo "  docker exec supabase-edge-functions sh -c 'k=\"\$ANTHROPIC_API_KEY\"; if echo \"\$k\" | grep -q \"^sk-ant-\"; then echo EDGE=ok; else echo EDGE=bad; fi'"
