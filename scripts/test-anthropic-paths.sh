#!/usr/bin/env bash
set -euo pipefail
echo "== Anthropic from VPS host =="
python3 - <<'PY'
import json, urllib.request, pathlib, time
env = pathlib.Path("/opt/supabase/volumes/functions/.env").read_text()
key = ""
for line in env.splitlines():
    if line.startswith("ANTHROPIC_API_KEY="):
        key = line.split("=",1)[1].strip().strip('"').strip("'")
        break
print("key_ok", key.startswith("sk-ant-"), "len", len(key))
body = json.dumps({
  "model": "claude-haiku-4-5",
  "max_tokens": 64,
  "messages": [{"role":"user","content":"Reply with one word: ok"}],
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
  with urllib.request.urlopen(req, timeout=45) as resp:
    data = json.loads(resp.read().decode())
    text = "".join(b.get("text","") for b in data.get("content",[]) if b.get("type")=="text")
    print(f"HOST=ok http={resp.status} ms={int((time.time()-t0)*1000)} text={text[:60]!r}")
except Exception as e:
    print(f"HOST=fail ms={int((time.time()-t0)*1000)} {type(e).__name__}: {e}")
PY

echo "== Deno fetch from edge container =="
docker exec supabase-edge-functions deno eval --no-lock '
const key = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const t0 = Date.now();
try {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort("timeout"), 25000);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    signal: ac.signal,
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 64,
      messages: [{ role: "user", content: "Reply with one word: ok" }],
    }),
  });
  clearTimeout(t);
  const text = await res.text();
  console.log(`DENO=ok http=${res.status} ms=${Date.now()-t0} body=${text.slice(0,120)}`);
} catch (e) {
  console.log(`DENO=fail ms=${Date.now()-t0} err=${e}`);
}
' 2>&1 | tail -20

echo "== chat server? =="
ss -lntp | grep -E ':8787|:3000' || true
systemctl is-active chat-server 2>/dev/null || true
docker ps --format '{{.Names}}' | head -20
