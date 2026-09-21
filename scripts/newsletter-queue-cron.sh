#!/usr/bin/env bash
# Drain newsletter pending queue (call from cron every 5 minutes).
# Requires: NOTIFY_EMAIL_SECRET, SUPABASE edge URL.
#
# Crontab example (VPS):
#   */5 * * * * /opt/arendacity-ai/scripts/newsletter-queue-cron.sh >> /var/log/newsletter-queue.log 2>&1
#
# Env file (optional): /root/newsletter-cron.env
#   NOTIFY_EMAIL_SECRET=...
#   NEWSLETTER_FUNCTION_URL=https://api.arendacity.com/functions/v1/send-newsletter
set -euo pipefail

ENV_FILE="${NEWSLETTER_CRON_ENV:-/root/newsletter-cron.env}"
if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

# Fallbacks: functions env, then supabase root env
pick_secret() {
  local f="$1" val=""
  if [ -f "$f" ]; then
    val="$(grep -E '^NOTIFY_EMAIL_SECRET=' "$f" 2>/dev/null | tail -1 | cut -d= -f2- | tr -d '\r\n"' || true)"
  fi
  printf '%s' "$val"
  return 0
}

if [ -z "${NOTIFY_EMAIL_SECRET:-}" ]; then
  NOTIFY_EMAIL_SECRET="$(pick_secret /opt/supabase/volumes/functions/.env)"
fi
if [ -z "${NOTIFY_EMAIL_SECRET:-}" ]; then
  NOTIFY_EMAIL_SECRET="$(pick_secret /opt/supabase/.env)"
fi

URL="${NEWSLETTER_FUNCTION_URL:-https://api.arendacity.com/functions/v1/send-newsletter}"

HDRS=(-H "Content-Type: application/json")
if [ -n "${NOTIFY_EMAIL_SECRET:-}" ]; then
  HDRS+=(-H "x-notify-secret: ${NOTIFY_EMAIL_SECRET}")
else
  echo "$(date -Is) WARN: NOTIFY_EMAIL_SECRET missing — calling without header" >&2
fi

RESP="$(curl -sS --max-time 120 -X POST "$URL" \
  "${HDRS[@]}" \
  -d '{"mode":"process_queue"}')"

echo "$(date -Is) $RESP"
