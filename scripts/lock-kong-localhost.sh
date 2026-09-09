#!/usr/bin/env bash
# Kong только на 127.0.0.1. Снаружи остаётся nginx :80/:443 (api.arendacity.com).
# Закрывает прямой доступ вида http://VPS_IP:8000
#
# Dry-run (по умолчанию): bash scripts/lock-kong-localhost.sh
# На VPS: APPLY=1 bash scripts/lock-kong-localhost.sh
set -euo pipefail

APPLY="${APPLY:-0}"
COMPOSE_DIR="${COMPOSE_DIR:-/opt/supabase}"
COMPOSE_FILE=""

log() { printf '%s\n' "$*"; }

find_compose() {
  local f
  for f in \
    "$COMPOSE_DIR/docker-compose.yml" \
    "$COMPOSE_DIR/docker-compose.yaml" \
    "$COMPOSE_DIR/compose.yml"
  do
    if [[ -f "$f" ]]; then
      COMPOSE_FILE="$f"
      return 0
    fi
  done
  return 1
}

if ! find_compose; then
  log "Не найден compose в $COMPOSE_DIR. Задайте COMPOSE_DIR=."
  exit 1
fi

log "== lock-kong-localhost =="
log "compose: $COMPOSE_FILE"
log "APPLY=$APPLY"
log
log "Цель:"
log "  - порты Kong 8000/8443/8001 слушают только 127.0.0.1"
log "  - ufw: deny 8000, 8443, 8001; allow 22, 80, 443"
log "  - nginx по-прежнему proxy_pass http://localhost:8000"
log "  - https://api.arendacity.com остаётся публичным (нужен фронту)"
log "  - http://IP:8000 с интернета — закрыть"

if ! grep -qE '8000:8000|8000:8000/tcp|"8000:8000"' "$COMPOSE_FILE"; then
  log
  log "Внимание: в compose нет строки 8000:8000 — проверьте ports у kong вручную."
fi

rewrite_ports() {
  python3 - "$COMPOSE_FILE" <<'PY'
import pathlib, sys, re, time
p = pathlib.Path(sys.argv[1])
text = p.read_text()
orig = text
text = re.sub(r'0\.0\.0\.0:(8000|8443|8001):\1', r'127.0.0.1:\1:\1', text)
text = re.sub(r'(?<!127\.0\.0\.1:)(?<!\d)(8000|8443|8001):\1\b', r'127.0.0.1:\1:\1', text)
if text == orig:
    print("compose: порты уже localhost или шаблон другой — проверьте kong.ports")
else:
    bak = p.with_suffix(p.suffix + ".bak." + time.strftime("%Y%m%d%H%M%S"))
    bak.write_text(orig)
    p.write_text(text)
    print(f"compose обновлён, бэкап {bak}")
PY
}

if [[ "$APPLY" != "1" ]]; then
  log
  log "Dry-run. На VPS: APPLY=1 COMPOSE_DIR=/opt/supabase bash scripts/lock-kong-localhost.sh"
  exit 0
fi

rewrite_ports

if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp || true
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
  ufw deny 8000/tcp || true
  ufw deny 8443/tcp || true
  ufw deny 8001/tcp || true
  log "ufw: 22/80/443 allow, 8000/8443/8001 deny"
else
  iptables -C INPUT -p tcp --dport 8000 -j DROP 2>/dev/null \
    || iptables -I INPUT -p tcp --dport 8000 -j DROP
  iptables -C INPUT -p tcp --dport 8443 -j DROP 2>/dev/null \
    || iptables -I INPUT -p tcp --dport 8443 -j DROP
  iptables -C INPUT -p tcp --dport 8001 -j DROP 2>/dev/null \
    || iptables -I INPUT -p tcp --dport 8001 -j DROP
  log "iptables DROP 8000/8443/8001 (ufw нет)"
fi

cd "$(dirname "$COMPOSE_FILE")"
if docker compose ps >/dev/null 2>&1; then
  docker compose up -d kong
else
  docker-compose up -d kong
fi

log
log "Проверка с VPS:"
log "  ss -lntp | grep -E '8000|8443|443'"
log "  curl -sI http://127.0.0.1:8000 | head -3"
log "Снаружи 72.56.247.221:8000 должен быть недоступен; https://api.arendacity.com — доступен."
