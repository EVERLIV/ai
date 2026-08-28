#!/usr/bin/env bash
# Скопируйте ВЕСЬ этот файл в консоль VPS (root@supabase-arendacity) и Enter.
# Работает из любой папки. Нужен только /opt/supabase.

set -e
cd /opt/supabase
mkdir -p volumes/functions/submit-lead volumes/functions/_shared

# --- Turnstile secret (НЕ коммитить в git; только env на сервере) ---
ENV_FILE="volumes/functions/.env"
KEY="${TURNSTILE_SECRET_KEY:-}"
if [ -z "$KEY" ]; then
  echo "Вставьте Turnstile Secret Key из Cloudflare и Enter:"
  read -rsp "TURNSTILE_SECRET_KEY: " KEY
  echo
fi
if [ -z "$KEY" ]; then
  echo "Ошибка: пустой TURNSTILE_SECRET_KEY" >&2
  exit 1
fi
touch "$ENV_FILE"
grep -v '^TURNSTILE_SECRET_KEY=' "$ENV_FILE" > /tmp/fn.env || true
echo "TURNSTILE_SECRET_KEY=$KEY" >> /tmp/fn.env
mv /tmp/fn.env "$ENV_FILE"
chmod 600 "$ENV_FILE"
echo "OK: Turnstile key записан"

# --- turnstile.ts ---
cat > volumes/functions/_shared/turnstile.ts << 'ENDFILE'
/** Cloudflare Turnstile — server-side verify */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY")?.trim();
  if (!secret) {
    return { ok: true };
  }

  if (!token?.trim()) {
    return { ok: false, error: "Не пройдена проверка captcha" };
  }

  const body: Record<string, string> = {
    secret,
    response: token.trim(),
  };
  if (remoteIp?.trim()) body.remoteip = remoteIp.trim();

  const resp = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const data = (await resp.json().catch(() => ({}))) as {
    success?: boolean;
    "error-codes"?: string[];
  };

  if (!resp.ok || !data.success) {
    const codes = data["error-codes"]?.join(", ") || `HTTP ${resp.status}`;
    console.warn("turnstile verify failed:", codes);
    return { ok: false, error: "Проверка captcha не пройдена" };
  }

  return { ok: true };
}
ENDFILE

# --- leadOps.ts ---
cat > volumes/functions/_shared/leadOps.ts << 'ENDFILE'
import {
  fetchPropertyAgencyId,
  internalSecret,
  supabaseUrl,
} from "./agencyTelegram.ts";

export type LeadPayload = {
  id?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  message?: string | null;
  source?: string | null;
  business_category?: string | null;
  object_id?: string | null;
  status?: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  contacts_page: "Контакты",
  price_offer: "Предложение цены",
  owner_message: "Вопрос по объекту",
  property_contact: "Форма на объекте",
  property_inquiry: "Заявка по объекту",
  consultation_widget: "Виджет консультации",
  homepage_owner: "Главная — сдать объект",
  vacancies_page: "Отклик на вакансию",
  category_contact: "Заявка по категории",
  management_request: "Передача в управление",
  docs_bug_report: "Баг на сайте",
  specialist_quiz: "Квиз специалистов",
  realtor_contact: "Риелтор",
  agency_contact: "Агентство",
  developer_contact: "Застройщик",
  catalog_sidebar: "Подбор из каталога",
  catalog_search_alert: "Подписка на поиск",
  ai_chat: "ИИ-чат",
  specialist_contact: "Специалист",
  docs_handbook: "Справочник",
  website: "Сайт",
};

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function formatLeadTelegram(lead: LeadPayload) {
  const source = SOURCE_LABELS[lead.source || ""] || lead.source || "Заявка";
  const lines = [
    `<b>Новая заявка — ${escapeHtml(source)}</b>`,
    lead.name ? `👤 <b>Имя:</b> ${escapeHtml(lead.name)}` : "",
    lead.phone ? `📞 <b>Телефон:</b> ${escapeHtml(lead.phone)}` : "",
    lead.email ? `✉️ <b>Email:</b> ${escapeHtml(lead.email)}` : "",
    lead.business_category
      ? `📍 <b>Объект/тема:</b> ${escapeHtml(lead.business_category)}`
      : "",
    lead.object_id
      ? `🆔 <b>ID объекта:</b> <code>${escapeHtml(lead.object_id)}</code>`
      : "",
    lead.message ? `\n💬 ${escapeHtml(lead.message)}` : "",
    lead.id ? `\n<code>${escapeHtml(lead.id)}</code>` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

export async function sendOpsTelegram(text: string) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!token || !chatId) {
    throw new Error("TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы");
  }

  const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.ok) {
    throw new Error(data.description || `Telegram HTTP ${resp.status}`);
  }
  return data;
}

export async function insertCrmLead(row: Record<string, unknown>) {
  const base = supabaseUrl();
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!base || !key) {
    throw new Error("SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не заданы");
  }

  const resp = await fetch(`${base.replace(/\/$/, "")}/rest/v1/crm_leads`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });

  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: string }).message)
        : `HTTP ${resp.status}`;
    throw new Error(msg);
  }

  const inserted = Array.isArray(data) ? data[0] : data;
  return inserted as { id?: string } | null;
}

export async function notifyAgencyForLead(body: LeadPayload) {
  if (!body.object_id) return;
  const prop = await fetchPropertyAgencyId(body.object_id);
  if (!prop?.agency_id) return;

  const base = supabaseUrl();
  const secret = internalSecret();
  if (!base) return;

  await fetch(`${base.replace(/\/$/, "")}/functions/v1/agency-notify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "X-Agency-Notify-Secret": secret } : {}),
    },
    body: JSON.stringify({
      type: "lead",
      agency_id: prop.agency_id,
      payload: body,
    }),
  }).catch((e) => console.warn("agency-notify:", e));
}
ENDFILE

# --- submit-lead/index.ts ---
cat > volumes/functions/submit-lead/index.ts << 'ENDFILE'
import {
  formatLeadTelegram,
  insertCrmLead,
  notifyAgencyForLead,
  sendOpsTelegram,
  type LeadPayload,
} from "../_shared/leadOps.ts";
import { verifyTurnstileToken } from "../_shared/turnstile.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json().catch(() => ({}))) as LeadPayload & {
      website?: string;
      captcha_token?: string | null;
    };

    if (body.website?.trim()) {
      return json({ ok: true, skipped: "bot" });
    }

    const captcha = await verifyTurnstileToken(
      body.captcha_token,
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("cf-connecting-ip"),
    );
    if (!captcha.ok) {
      return json({ error: captcha.error || "Captcha failed" }, 400);
    }

    const name = body.name?.trim() || "";
    const phone = body.phone?.trim() || "";
    const email = body.email?.trim() || null;
    const message = body.message?.trim() || null;

    if (name.length < 2) {
      return json({ error: "Укажите имя" }, 400);
    }

    const phoneOptional =
      body.source === "ai-chat" || body.source === "catalog_search_alert";
    if (!phoneOptional && phone.length < 6) {
      return json({ error: "Укажите имя и телефон" }, 400);
    }
    if (phoneOptional && phone.length < 6 && !email?.includes("@")) {
      return json({ error: "Укажите телефон или email" }, 400);
    }

    if (!phone && !name && !message) {
      return json({ error: "Пустая заявка" }, 400);
    }

    const row = {
      name,
      phone: phone || "",
      email,
      message,
      source: body.source?.trim() || "website",
      business_category: body.business_category?.trim() || null,
      object_id: body.object_id || null,
      status: "new",
    };

    const inserted = await insertCrmLead(row);
    const leadPayload: LeadPayload = {
      ...row,
      id: inserted?.id || null,
    };

    try {
      await sendOpsTelegram(formatLeadTelegram(leadPayload));
    } catch (e) {
      console.warn("submit-lead ops telegram:", e);
    }

    await notifyAgencyForLead(leadPayload);

    return json({ ok: true, id: inserted?.id || null });
  } catch (e) {
    console.error("submit-lead:", e);
    return json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      500,
    );
  }
});
ENDFILE

echo "OK: файлы созданы"
ls -la volumes/functions/submit-lead/
ls -la volumes/functions/_shared/turnstile.ts volumes/functions/_shared/leadOps.ts

docker compose up -d functions --force-recreate
sleep 4

echo
echo "=== Проверка ==="
curl -s -X POST "https://api.arendacity.com/functions/v1/submit-lead" \
  -H "Content-Type: application/json" \
  -d '{"name":"T","phone":"+7900","source":"website"}'
echo
echo
echo "Готово. Если видите {\"error\":\"Укажите имя\"} — всё работает."
