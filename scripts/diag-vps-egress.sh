#!/usr/bin/env bash
set -euo pipefail
echo "== DNS =="
getent hosts api.anthropic.com || true
dig +short api.anthropic.com 2>/dev/null || nslookup api.anthropic.com 2>/dev/null | head -10 || true
echo
echo "== TCP 443 =="
timeout 8 bash -c 'echo >/dev/tcp/api.anthropic.com/443' && echo TCP_OK || echo TCP_FAIL
timeout 8 bash -c 'echo >/dev/tcp/1.1.1.1/443' && echo CF_TCP_OK || echo CF_TCP_FAIL
echo
echo "== HTTPS HEAD google =="
python3 - <<'PY'
import urllib.request, time
for url in ["https://www.google.com","https://cloudflare.com","https://api.anthropic.com"]:
  t0=time.time()
  try:
    urllib.request.urlopen(url, timeout=8)
    print(url, "OK", int((time.time()-t0)*1000), "ms")
  except Exception as e:
    print(url, "FAIL", int((time.time()-t0)*1000), "ms", type(e).__name__, e)
PY
echo
echo "== iptables outbound? =="
iptables -L OUTPUT -n 2>/dev/null | head -15 || true
echo
echo "== route =="
ip route | head -5
