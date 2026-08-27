#!/usr/bin/env bash
# Diagnose + optionally fix common .env issues (no secret printed).
set -euo pipefail

ENVF=/opt/supabase/volumes/functions/.env

echo "== files =="
if [ -f "$ENVF" ]; then
  echo "exists $ENVF bytes=$(wc -c < "$ENVF")"
  # show only key NAMES
  echo "var names:"
  grep -E '^[A-Za-z_][A-Za-z0-9_]*=' "$ENVF" | cut -d= -f1 | sort -u
  # ANTHROPIC line stats only
  if grep -q '^ANTHROPIC_API_KEY=' "$ENVF"; then
    n=$(grep -c '^ANTHROPIC_API_KEY=' "$ENVF" || true)
    echo "ANTHROPIC lines: $n"
    # length of value after first =, strip CR and surrounding quotes
    python3 - <<'PY'
from pathlib import Path
p = Path("/opt/supabase/volumes/functions/.env")
vals = []
for line in p.read_text(encoding="utf-8", errors="replace").splitlines():
    if line.startswith("ANTHROPIC_API_KEY="):
        v = line.split("=", 1)[1].strip().strip("\r")
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            v = v[1:-1]
        vals.append(v)
print("values_count", len(vals))
for i, v in enumerate(vals):
    ok = v.startswith("sk-ant-")
    print(f"value[{i}] len={len(v)} ok_prefix={ok} has_space={(' ' in v)} has_cr={('\\r' in v)}")
PY
  else
    echo "ANTHROPIC lines: 0"
  fi
else
  echo "MISSING $ENVF"
fi

echo
echo "== container =="
docker exec supabase-edge-functions sh -c \
  'echo "has_var=$( [ -n "${ANTHROPIC_API_KEY+x}" ] && echo yes || echo no )"; k="$ANTHROPIC_API_KEY"; echo "len=${#k}"; if [ -z "$k" ]; then echo status=EMPTY; elif echo "$k" | grep -q "^sk-ant-"; then echo status=OK; else echo status=BAD_PREFIX; fi'

echo
echo "== compose env wiring =="
grep -n -E 'ANTHROPIC|env_file|environment:' /opt/supabase/docker-compose.yml | head -40
echo "--- override ---"
cat /opt/supabase/docker-compose.override.yml

echo
echo "== inspect Config.Env names only =="
docker inspect supabase-edge-functions --format '{{range .Config.Env}}{{println .}}{{end}}' \
  | cut -d= -f1 | grep -E 'ANTHROPIC|SUPABASE' | sort
