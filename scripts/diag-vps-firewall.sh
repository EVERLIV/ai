#!/usr/bin/env bash
set -euo pipefail
echo "== firewall =="
command -v ufw >/dev/null && ufw status verbose || echo "no ufw"
echo
iptables -L OUTPUT -n -v | head -25
echo
echo "== ip6tables OUTPUT =="
ip6tables -L OUTPUT -n -v 2>/dev/null | head -15 || true
echo
echo "== try IPv4 only to Anthropic =="
python3 - <<'PY'
import socket, ssl, time
ip = "160.79.104.10"
t0 = time.time()
try:
  s = socket.create_connection((ip, 443), timeout=8)
  print("IPv4 TCP", ip, "OK", int((time.time()-t0)*1000), "ms")
  ctx = ssl.create_default_context()
  # SNI required
  with ctx.wrap_socket(s, server_hostname="api.anthropic.com") as ss:
    print("TLS OK", ss.version())
except Exception as e:
  print("IPv4 FAIL", int((time.time()-t0)*1000), "ms", type(e).__name__, e)
PY
echo
echo "== try IPv4 google =="
python3 - <<'PY'
import socket, time
t0=time.time()
try:
  # resolve A only
  infos = socket.getaddrinfo("www.google.com", 443, socket.AF_INET, socket.SOCK_STREAM)
  ip = infos[0][4][0]
  s = socket.create_connection((ip, 443), timeout=8)
  print("google IPv4", ip, "OK", int((time.time()-t0)*1000), "ms")
  s.close()
except Exception as e:
  print("google IPv4 FAIL", int((time.time()-t0)*1000), "ms", e)
PY
echo
echo "== default route / interfaces =="
ip -4 route | head -8
ip -6 route | head -8 || true
