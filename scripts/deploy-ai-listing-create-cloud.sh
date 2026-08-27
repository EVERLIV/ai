#!/usr/bin/env bash
# Deploy ai-listing-create to ArendaCity cloud project.
# Requires: npx supabase login (account that owns xbdwapunrlnxcuxjhaca)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REF="${SUPABASE_PROJECT_REF:-xbdwapunrlnxcuxjhaca}"
cd "$ROOT"
echo "Deploying ai-listing-create → $REF"
npx supabase functions deploy ai-listing-create \
  --project-ref "$REF" \
  --no-verify-jwt
echo "OK https://${REF}.supabase.co/functions/v1/ai-listing-create"
echo
echo "Secrets (if missing) — same as ai-chat:"
echo "  ANTHROPIC_API_KEY, CATALOG_URL, CATALOG_ANON_KEY"
echo "  node scripts/set-listing-ai-cloud-secrets.mjs"
