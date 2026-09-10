/**
 * VK ID → сессия Supabase.
 *
 * Клиент обменивает code на access_token (SDK), затем POST сюда.
 * Сервер проверяет токен через VK user_info и выдаёт magic-link token_hash.
 *
 * Secrets (VPS /opt/supabase/volumes/functions/.env):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   VK_ID_APP_ID          — тот же, что VITE_VK_ID_APP_ID (опционально, для логов)
 *   VK_ID_CLIENT_SECRET   — защищённый ключ приложения (когда выдадите)
 *
 * Docs: docs/SETUP_VKID.md
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
    const vkUserId = String(
      vkUser.user_id ?? body.user_id ?? "",
    ).trim();
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

    // VK_ID_CLIENT_SECRET пока не обязателен (проверка через user_info).
    // После выдачи секрета можно добавить серверный exchange code.
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
