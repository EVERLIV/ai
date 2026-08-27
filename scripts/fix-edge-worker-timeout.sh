#!/usr/bin/env bash
# Raise edge-runtime worker wall-clock and smoke Anthropic from the host.
set -euo pipefail

OVERRIDE=/opt/supabase/docker-compose.override.yml
BACKUP="${OVERRIDE}.bak.$(date +%Y%m%d%H%M%S)"
cp "$OVERRIDE" "$BACKUP"
echo "Backup: $BACKUP"

python3 - <<'PY'
from pathlib import Path
p = Path("/opt/supabase/docker-compose.override.yml")
text = p.read_text()
# Desired override: keep env_file + longer worker timeout
desired = """services:
  functions:
    env_file:
      - ./volumes/functions/.env
    command:
      [
        "start",
        "--main-service",
        "/home/deno/functions/main",
        "--worker-timeout-ms",
        "120000",
      ]
"""
p.write_text(desired)
print("wrote override:")
print(desired)
PY

cd /opt/supabase
docker compose up -d functions --force-recreate
sleep 5

echo "== EDGE key =="
docker exec supabase-edge-functions sh -c \
  'k="$ANTHROPIC_API_KEY"; if echo "$k" | grep -q "^sk-ant-" && [ ${#k} -ge 40 ]; then echo EDGE=ok; else echo EDGE=bad; fi'

echo "== Anthropic from host (via container env) =="
# Use python in analytics/db? Prefer host python with key from file without printing it
python3 - <<'PY'
import json, urllib.request, os, pathlib, time
env = pathlib.Path("/opt/supabase/volumes/functions/.env").read_text()
key = ""
for line in env.splitlines():
    if line.startswith("ANTHROPIC_API_KEY="):
        key = line.split("=",1)[1].strip().strip('"').strip("'")
        break
assert key.startswith("sk-ant-"), "bad key in functions .env"
body = json.dumps({
  "model": "claude-haiku-4-5",
  "max_tokens": 64,
  "messages": [{"role":"user","content":"Ответь одним словом: ок"}],
}).encode()
req = urllib.request.Request(
  "https://api.anthropic.com/v1/messages",
  data=body,
  headers={
    "x-api-key": key,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
  },
  method="POST",
)
t0 = time.time()
try:
  with urllib.request.urlopen(req, timeout=30) as resp:
    data = json.loads(resp.read().decode())
    text = "".join(
      b.get("text","") for b in data.get("content",[]) if b.get("type")=="text"
    )
    print(f"HOST_ANTHROPIC=ok status={resp.status} ms={int((time.time()-t0)*1000)} reply={text[:80]!r}")
except Exception as e:
  print(f"HOST_ANTHROPIC=fail ms={int((time.time()-t0)*1000)} err={type(e).__name__}: {e}")
PY

echo "== compose command =="
docker inspect supabase-edge-functions --format '{{json .Config.Cmd}}'
echo
echo "Done. Try chat again."
