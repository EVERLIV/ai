#!/usr/bin/env bash
set -euo pipefail
echo "== logs =="
docker logs supabase-edge-functions --tail 50 2>&1 | tail -50
echo
echo "== key =="
docker exec supabase-edge-functions sh -c 'k="$ANTHROPIC_API_KEY"; if echo "$k" | grep -q "^sk-ant-" && [ ${#k} -ge 40 ]; then echo EDGE=ok len=${#k}; else echo EDGE=bad len=${#k}; fi'
echo
echo "== anthropic ping =="
docker exec supabase-edge-functions sh -c '
k="$ANTHROPIC_API_KEY"
code=$(curl -sS -o /tmp/anth.json -w "%{http_code}" --max-time 25 \
  https://api.anthropic.com/v1/messages \
  -X POST \
  -H "x-api-key: $k" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d "{\"model\":\"claude-haiku-4-5\",\"max_tokens\":32,\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}]}")
echo HTTP:$code
head -c 200 /tmp/anth.json; echo
'
echo
echo "== deployed fn hash =="
wc -c /opt/supabase/volumes/functions/ai-listing-create/index.ts
grep -n "ANTHROPIC_TIMEOUT\|toAnthropicMessages\|output_config\|parseJsonObject" /opt/supabase/volumes/functions/ai-listing-create/index.ts | head -20
