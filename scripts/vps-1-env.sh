cd /opt/supabase
mkdir -p volumes/functions/submit-lead volumes/functions/_shared
grep -v TURNSTILE_SECRET_KEY volumes/functions/.env > /tmp/fn.env 2>/dev/null || true
echo 'TURNSTILE_SECRET_KEY=0x4AAAAAAEe5BJlhGE6gZCE7TzNn-vEb_Qk' >> /tmp/fn.env
mv /tmp/fn.env volumes/functions/.env
chmod 600 volumes/functions/.env
echo "БЛОК 1 OK"
