#!/usr/bin/env bash
set -euo pipefail
echo "== key types in /opt/supabase/.env =="
python3 - <<'PY'
from pathlib import Path
env = Path("/opt/supabase/.env").read_text()
interesting = ("ANON_KEY","SERVICE_ROLE_KEY","JWT_SECRET","SUPABASE_PUBLISHABLE_KEY","SUPABASE_SECRET_KEY","ANON","SERVICE")
for line in env.splitlines():
    if not line or line.startswith("#") or "=" not in line: continue
    k,v = line.split("=",1)
    if not any(x in k for x in ("ANON","SERVICE","JWT","PUBLISHABLE","SECRET_KEY")): continue
    v=v.strip().strip('"').strip("'")
    kind = "jwt" if v.startswith("eyJ") else ("sb_" if v.startswith("sb_") else ("hmac_secret" if k.endswith("JWT_SECRET") or "SECRET" in k and not v.startswith("eyJ") else "other"))
    print(f"{k}: kind={kind} len={len(v)} prefix={v[:12]}...")
PY

echo
echo "== postgREST JWT settings (compose snippet) =="
grep -n -E 'JWT|ANON|PGRST|PUBLISHABLE|SECRET_KEY' /opt/supabase/docker-compose.yml | head -40

echo
echo "== try insert with service_role (no user jwt) =="
python3 - <<'PY'
import json, urllib.request, pathlib
env={}
for line in pathlib.Path("/opt/supabase/.env").read_text().splitlines():
    if "=" in line and not line.startswith("#"):
        k,v=line.split("=",1); env[k]=v.strip().strip('"').strip("'")
sr=env.get("SERVICE_ROLE_KEY","")
anon=env.get("ANON_KEY","")
# pick any auth user id
import subprocess
uid=subprocess.check_output([
  "docker","exec","supabase-db","psql","-U","postgres","-d","postgres","-tAc",
  "select id::text from auth.users order by created_at desc limit 1"
], text=True).strip()
print("sample_user", uid[:8]+"...")
body=json.dumps({
  "user_id": uid,
  "segment": "commercial",
  "phase": "intake",
  "messages": [],
  "draft": {"segment":"commercial"},
}).encode()
req=urllib.request.Request(
  "https://api.arendacity.com/rest/v1/listing_ai_sessions",
  data=body,
  headers={
    "apikey": sr,
    "Authorization": f"Bearer {sr}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  },
  method="POST",
)
try:
  with urllib.request.urlopen(req, timeout=20) as resp:
    data=json.loads(resp.read().decode())
    row=data[0] if isinstance(data,list) else data
    print("SERVICE_INSERT=ok", row.get("id","")[:8], "status", resp.status)
except Exception as e:
  print("SERVICE_INSERT=fail", e)
  if hasattr(e,'read'):
    print(e.read().decode()[:300])
PY
