#!/usr/bin/env bash
#
# Открывает чат-бэкенд наружу через nginx на сервере Supabase.
#
# Проблема, которую решает: весь трафик api.arendacity.com уходит в Kong
# (шлюз Supabase), и он отвечает 401 на /api/chat, не доходя до нашего сервиса.
# Нужно перехватить этот путь ДО того, как запрос попадёт в Kong.
#
# Запуск на сервере:
#   bash expose-chat-nginx.sh

set -euo pipefail

PORT=8787
SNIPPET=/etc/nginx/snippets/arendacity-chat.conf

echo "=== 1/5 Проверяем, что сервис отвечает локально"
if ! curl -sf --max-time 10 "http://127.0.0.1:$PORT/health" >/dev/null; then
  echo "Сервис на 127.0.0.1:$PORT не отвечает." >&2
  echo "Проверьте:  systemctl status arendacity-chat" >&2
  echo "            journalctl -u arendacity-chat -n 40 --no-pager" >&2
  exit 1
fi
echo "  ok: $(curl -s --max-time 10 http://127.0.0.1:$PORT/health)"

echo "=== 2/5 Ищем конфиг nginx для api.arendacity.com"
CONF="$(grep -rl "api\.arendacity\.com" /etc/nginx/sites-enabled/ /etc/nginx/conf.d/ 2>/dev/null | head -1 || true)"
if [ -z "$CONF" ]; then
  echo "Не нашёл конфиг с api.arendacity.com. Посмотрите вручную:" >&2
  echo "  grep -rl arendacity /etc/nginx/" >&2
  exit 1
fi
echo "  конфиг: $CONF"

echo "=== 3/5 Готовим сниппет"
mkdir -p /etc/nginx/snippets
cat > "$SNIPPET" <<SNIPEOF
# Чат-бэкенд. Должен идти ДО location / (Kong), иначе Kong вернёт 401.
location = /api/chat {
    proxy_pass http://127.0.0.1:$PORT/api/chat;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;

    # Потоковый ответ: без буферизации, иначе текст придёт целиком в конце.
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 120s;
}

location = /api/chat/health {
    proxy_pass http://127.0.0.1:$PORT/health;
    proxy_set_header Host \$host;
}
SNIPEOF
echo "  создан: $SNIPPET"

echo "=== 4/5 Подключаем сниппет в server-блок"
if grep -q "arendacity-chat.conf" "$CONF"; then
  echo "  уже подключён — пропускаем"
else
  cp "$CONF" "$CONF.bak.$(date +%Y%m%d%H%M%S)"
  echo "  резервная копия: $CONF.bak.*"
  # Вставляем include сразу после строки с ssl-сертификатом либо после server_name.
  python3 - "$CONF" <<'PYEOF'
import re, sys
path = sys.argv[1]
src = open(path, encoding="utf-8").read()
inc = "\n    include /etc/nginx/snippets/arendacity-chat.conf;\n"
# Ищем server-блок, где упоминается api.arendacity.com
m = re.search(r"server_name[^;]*api\.arendacity\.com[^;]*;", src)
if not m:
    print("не нашёл server_name с api.arendacity.com", file=sys.stderr)
    sys.exit(1)
pos = m.end()
open(path, "w", encoding="utf-8").write(src[:pos] + inc + src[pos:])
print("  include добавлен после server_name")
PYEOF
fi

echo "=== 5/5 Проверяем и перезагружаем nginx"
if ! nginx -t; then
  echo "Конфиг nginx невалиден. Откатитесь из резервной копии:" >&2
  echo "  ls $CONF.bak.*" >&2
  exit 1
fi
systemctl reload nginx
sleep 2

echo
echo "Проверка снаружи:"
code="$(curl -s -o /tmp/_chat_out -w '%{http_code}' --max-time 60 \
  -X POST "https://api.arendacity.com/api/chat" \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Привет! Сколько объектов в аренду?"}]}' || true)"
echo "  HTTP $code"
head -c 300 /tmp/_chat_out; echo

if [ "$code" = "200" ]; then
  echo
  echo "ГОТОВО: чат доступен по https://api.arendacity.com/api/chat"
else
  echo
  echo "Пока не работает. Возможные причины:" >&2
  echo "  • location для /api/chat стоит ПОСЛЕ location / (Kong перехватывает первым)" >&2
  echo "  • трафик идёт не через этот server-блок" >&2
  echo "Посмотрите: grep -n 'location' $CONF" >&2
  exit 1
fi
