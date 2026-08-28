cd /opt/supabase
mkdir -p volumes/functions/submit-lead volumes/functions/_shared
KEY="${TURNSTILE_SECRET_KEY:-}"
if [ -z "$KEY" ]; then
  echo "Ошибка: задайте TURNSTILE_SECRET_KEY перед запуском (ключ не хранится в git)." >&2
  exit 1
fi
grep -v TURNSTILE_SECRET_KEY volumes/functions/.env > /tmp/fn.env 2>/dev/null || true
echo "TURNSTILE_SECRET_KEY=$KEY" >> /tmp/fn.env
mv /tmp/fn.env volumes/functions/.env
chmod 600 volumes/functions/.env
echo "БЛОК 1 OK"
