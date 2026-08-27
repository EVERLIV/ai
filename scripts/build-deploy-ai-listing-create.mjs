/**
 * Generates scripts/deploy-ai-listing-create.sh with embedded function source.
 * Run: node scripts/build-deploy-ai-listing-create.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fn = readFileSync(
  join(root, "supabase/functions/ai-listing-create/index.ts"),
  "utf8",
);

const sh = `#!/usr/bin/env bash
# Автономный деплой ai-listing-create на self-hosted Supabase.
# На VPS из любой папки:
#   bash /tmp/deploy-ai-listing-create.sh
# С локальной машины:
#   scp scripts/deploy-ai-listing-create.sh root@SERVER:/tmp/
#   ssh root@SERVER 'bash /tmp/deploy-ai-listing-create.sh'
# SQL (один раз): sql/listing_ai_sessions.sql

set -euo pipefail

SUPABASE_DIR="\${SUPABASE_DIR:-/opt/supabase}"
ENV_FILE="\${SUPABASE_ENV_FILE:-\$SUPABASE_DIR/.env}"
API_URL="\${API_URL:-https://api.arendacity.com}"
FN_NAME="ai-listing-create"

echo "==> Деплой \$FN_NAME на self-hosted Supabase"
echo

TARGET_DIR="\${SUPABASE_FUNCTIONS_DIR:-}"
if [ -z "\$TARGET_DIR" ]; then
  TARGET_DIR="\$(docker inspect supabase-edge-functions \\
    --format '{{range .Mounts}}{{if eq .Destination "/home/deno/functions"}}{{.Source}}{{end}}{{end}}' \\
    2>/dev/null || true)"
fi
if [ -z "\$TARGET_DIR" ] || [ ! -d "\$TARGET_DIR" ]; then
  for candidate in \\
    "\$SUPABASE_DIR/volumes/functions" \\
    "\$SUPABASE_DIR/functions" \\
    /var/lib/supabase/functions; do
    if [ -d "\$candidate" ]; then
      TARGET_DIR="\$candidate"
      break
    fi
  done
fi
if [ -z "\$TARGET_DIR" ] || [ ! -d "\$TARGET_DIR" ]; then
  echo "Ошибка: не найден каталог edge-функций." >&2
  exit 1
fi

echo "    Каталог: \$TARGET_DIR"
mkdir -p "\$TARGET_DIR/\$FN_NAME"
cat > "\$TARGET_DIR/\$FN_NAME/index.ts" <<'EOF_FN'
${fn}
EOF_FN

echo "    записан \$TARGET_DIR/\$FN_NAME/index.ts"
ls -la "\$TARGET_DIR/\$FN_NAME/"

if [ -f "\$ENV_FILE" ] && grep -q "^ANTHROPIC_API_KEY=.\\+" "\$ENV_FILE" 2>/dev/null; then
  echo "    ANTHROPIC_API_KEY: ok"
else
  echo "    WARNING: ANTHROPIC_API_KEY missing in \$ENV_FILE" >&2
fi

echo "==> Restart functions..."
if [ -f "\$SUPABASE_DIR/docker-compose.yml" ] || [ -f "\$SUPABASE_DIR/compose.yaml" ]; then
  (cd "\$SUPABASE_DIR" && docker compose up -d functions --force-recreate)
else
  docker restart supabase-edge-functions
fi
sleep 4

echo "==> Smoke (expect 401 without user JWT)"
RESP="\$(curl -sS --max-time 20 -X POST "\$API_URL/functions/v1/\$FN_NAME" \\
  -H "Content-Type: application/json" -d '{}' -w "\\nHTTP:%{http_code}" 2>&1 || true)"
echo "\$RESP" | tail -8
HTTP="\$(echo "\$RESP" | grep -o 'HTTP:[0-9]*' | tail -1 | cut -d: -f2 || true)"
case "\${HTTP:-}" in
  401)
    echo "OK: entrypoint live (401 Unauthorized as expected)."
    ;;
  500)
    BODY="\$(echo "\$RESP" | sed '/^HTTP:/d')"
    if echo "\$BODY" | grep -qi entrypoint; then
      echo "FAIL: still InvalidWorkerCreation" >&2
      exit 1
    fi
    echo "HTTP 500 but not entrypoint error — check ANTHROPIC / SQL table."
    ;;
  *)
    echo "Unexpected HTTP \${HTTP:-none}. Check logs."
    ;;
esac

echo
echo "Remember SQL once: apply sql/listing_ai_sessions.sql on the DB."
`;

writeFileSync(join(root, "scripts/deploy-ai-listing-create.sh"), sh, "utf8");
console.log("OK scripts/deploy-ai-listing-create.sh");
