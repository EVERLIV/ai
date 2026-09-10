#!/usr/bin/env bash
# Деплой auth-vkid на self-hosted Supabase (VPS).
# Cloud `supabase functions deploy` сюда НЕ попадает.
#
# На VPS:
#   bash /opt/arendacity-ai/scripts/deploy-auth-vkid.sh
# или из репо:
#   bash scripts/deploy-auth-vkid.sh
#
# Секреты в /opt/supabase/.env или volumes/functions/.env:
#   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
#   VK_ID_APP_ID=54763350
#   VK_ID_CLIENT_SECRET=...   (опционально пока)

set -euo pipefail

SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"
API_URL="${API_URL:-https://api.arendacity.com}"
FN_NAME="auth-vkid"
REPO_FN=""

# Источник: репозиторий, если есть
for cand in \
  "${SRC_DIR:-}" \
  "$(cd "$(dirname "$0")/.." && pwd)/supabase/functions/$FN_NAME" \
  /opt/arendacity-ai/supabase/functions/$FN_NAME; do
  if [ -n "$cand" ] && [ -f "$cand/index.ts" ]; then
    REPO_FN="$cand"
    break
  fi
done

echo "==> Деплой $FN_NAME на self-hosted"
echo

TARGET_DIR="${SUPABASE_FUNCTIONS_DIR:-}"
if [ -z "$TARGET_DIR" ]; then
  TARGET_DIR="$(docker inspect supabase-edge-functions \
    --format '{{range .Mounts}}{{if eq .Destination "/home/deno/functions"}}{{.Source}}{{end}}{{end}}' \
    2>/dev/null || true)"
fi
if [ -z "$TARGET_DIR" ] || [ ! -d "$TARGET_DIR" ]; then
  for candidate in \
    "$SUPABASE_DIR/volumes/functions" \
    "$SUPABASE_DIR/functions" \
    /var/lib/supabase/functions; do
    if [ -d "$candidate" ]; then
      TARGET_DIR="$candidate"
      break
    fi
  done
fi
if [ -z "$TARGET_DIR" ] || [ ! -d "$TARGET_DIR" ]; then
  echo "Ошибка: не найден каталог edge-функций." >&2
  exit 1
fi

echo "    Каталог: $TARGET_DIR"
mkdir -p "$TARGET_DIR/$FN_NAME"

if [ -n "$REPO_FN" ]; then
  echo "    Источник: $REPO_FN/index.ts"
  cp "$REPO_FN/index.ts" "$TARGET_DIR/$FN_NAME/index.ts"
else
  echo "    Репозиторий не найден — пишем встроенный index.ts"
  cat > "$TARGET_DIR/$FN_NAME/index.ts" <<'EOF_FN'
/**
 * VK ID → сессия Supabase (self-hosted).
 * Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VK_ID_APP_ID, VK_ID_CLIENT_SECRET?
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Body = {
  access_token?: string;
  user_id?: number | string;
  account_type?: string;
  full_name?: string;
  phone?: string;
};

type VkUser = {
  user_id?: string | number;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function syntheticEmail(vkUserId: string) {
  return `vk${vkUserId}@users.dadatut.ru`;
}

async function fetchVkUserInfo(accessToken: string): Promise<VkUser> {
  const res = await fetch("https://id.vk.ru/oauth2/user_info", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${accessToken}`,
    },
    body: new URLSearchParams({
      client_id: Deno.env.get("VK_ID_APP_ID")?.trim() || "",
      access_token: accessToken,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    user?: VkUser;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.user) {
    throw new Error(
      data.error_description || data.error || "VK user_info failed",
    );
  }
  return data.user;
}

function normalizeAccountType(raw: string | undefined): string {
  const t = (raw || "seeker").trim();
  const allowed = new Set([
    "seeker",
    "owner",
    "agency",
    "realtor",
    "developer",
  ]);
  return allowed.has(t) ? t : "seeker";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim() || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim() || "";
  if (!supabaseUrl || !serviceKey) {
    return json(
      {
        error:
          "auth-vkid не настроен: задайте SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY",
      },
      503,
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const accessToken = body.access_token?.trim();
    if (!accessToken) {
      return json({ error: "Нужен access_token" }, 400);
    }

    const vkUser = await fetchVkUserInfo(accessToken);
    const vkUserId = String(vkUser.user_id ?? body.user_id ?? "").trim();
    if (!vkUserId) {
      return json({ error: "Не удалось определить VK user_id" }, 400);
    }

    const email =
      (vkUser.email && vkUser.email.includes("@")
        ? vkUser.email.trim().toLowerCase()
        : null) || syntheticEmail(vkUserId);

    const fullName =
      body.full_name?.trim() ||
      [vkUser.first_name, vkUser.last_name].filter(Boolean).join(" ").trim() ||
      `VK ${vkUserId}`;
    const phone = body.phone?.trim() || vkUser.phone?.trim() || "";
    const accountType = normalizeAccountType(body.account_type);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const meta = {
      full_name: fullName,
      phone,
      account_type: accountType,
      vk_user_id: vkUserId,
      auth_provider: "vkid",
      avatar_url: vkUser.avatar || "",
    };

    const { data: created, error: createErr } =
      await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: meta,
        app_metadata: {
          provider: "vkid",
          providers: ["vkid"],
          vk_user_id: vkUserId,
        },
      });

    if (createErr && !/already|registered|exists/i.test(createErr.message)) {
      console.error("auth-vkid createUser:", createErr.message);
      return json({ error: createErr.message }, 400);
    }

    const isNew = Boolean(created?.user && !createErr);

    const { data: linkData, error: linkErr } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
      });

    if (linkErr || !linkData?.properties?.hashed_token) {
      console.error("auth-vkid generateLink:", linkErr?.message);
      return json(
        { error: linkErr?.message || "Не удалось создать сессию" },
        500,
      );
    }

    if (!isNew && linkData.user?.id) {
      await admin.auth.admin.updateUserById(linkData.user.id, {
        user_metadata: {
          ...linkData.user.user_metadata,
          vk_user_id: vkUserId,
          auth_provider: "vkid",
        },
        app_metadata: {
          ...linkData.user.app_metadata,
          provider: "vkid",
          vk_user_id: vkUserId,
        },
      });
    }

    void Deno.env.get("VK_ID_CLIENT_SECRET");

    return json({
      token_hash: linkData.properties.hashed_token,
      email,
      is_new: isNew,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "VK auth failed";
    console.error("auth-vkid:", msg);
    return json({ error: msg }, 400);
  }
});
EOF_FN
fi

ls -la "$TARGET_DIR/$FN_NAME/"
wc -c "$TARGET_DIR/$FN_NAME/index.ts"

# Проверка секретов (без вывода значений)
ENV_CANDIDATES=(
  "$SUPABASE_DIR/volumes/functions/.env"
  "$SUPABASE_DIR/.env"
)
echo
echo "==> Секреты (наличие ключей):"
for f in "${ENV_CANDIDATES[@]}"; do
  if [ -f "$f" ]; then
    echo "  файл: $f"
    for k in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY VK_ID_APP_ID VK_ID_CLIENT_SECRET; do
      if grep -qE "^${k}=.+" "$f" 2>/dev/null; then
        echo "    ✓ $k"
      else
        echo "    ✗ $k (нет)"
      fi
    done
  fi
done

echo
echo "==> Restart functions..."
if [ -f "$SUPABASE_DIR/docker-compose.yml" ] || [ -f "$SUPABASE_DIR/compose.yaml" ]; then
  (cd "$SUPABASE_DIR" && docker compose up -d functions --force-recreate)
else
  docker restart supabase-edge-functions
fi
sleep 4

echo
echo "==> Smoke POST (ожидаем 400 «Нужен access_token», не entrypoint):"
RESP="$(curl -sS --max-time 20 -X POST "$API_URL/functions/v1/$FN_NAME" \
  -H "Content-Type: application/json" -d '{}' -w "\nHTTP:%{http_code}" 2>&1 || true)"
echo "$RESP" | tail -6
HTTP="$(echo "$RESP" | grep -o 'HTTP:[0-9]*' | tail -1 | cut -d: -f2 || true)"
BODY="$(echo "$RESP" | sed '/^HTTP:/d')"

if echo "$BODY" | grep -qi entrypoint; then
  echo "FAIL: всё ещё InvalidWorkerCreation — проверьте mount volumes/functions" >&2
  exit 1
fi

case "${HTTP:-}" in
  400)
    if echo "$BODY" | grep -qi "access_token"; then
      echo "OK: entrypoint жив (400 без токена — норма)."
    else
      echo "HTTP 400: $BODY"
    fi
    ;;
  503)
    echo "Entrypoint жив, но нет SUPABASE_URL / SERVICE_ROLE_KEY в env функций."
    ;;
  *)
    echo "HTTP ${HTTP:-none}. Смотрите: cd $SUPABASE_DIR && docker compose logs --tail=40 functions"
    ;;
esac
