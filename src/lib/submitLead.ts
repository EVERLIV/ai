import { isRecaptchaEnabled } from "@/lib/botGuard";
import { getEdgeFunctionUrl } from "@/lib/edgeFunctions";

export type LeadInput = {
  name: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  source: string;
  business_category?: string | null;
  object_id?: string | null;
  /** Привязка к агентству (страница риелтора / агентства) */
  agency_id?: string | null;
  /** Риелтор, если заявка со страницы /rieltor/... */
  manager_id?: string | null;
  /** Honeypot — заполняют только боты */
  website?: string;
  /** Google reCAPTCHA v3 token */
  captchaToken?: string | null;
};

function getSubmitLeadUrl(): string {
  return getEdgeFunctionUrl("submit-lead", "VITE_SUBMIT_LEAD_URL");
}

/**
 * Отправляет заявку через edge function submit-lead:
 * honeypot + reCAPTCHA v3 на сервере → crm_leads → Telegram.
 */
export async function submitLead(
  input: LeadInput,
): Promise<{ id: string | null }> {
  const name = input.name.trim();
  const phone = input.phone.trim();
  if (name.length < 2) {
    throw new Error("Укажите имя");
  }
  const phoneOptional =
    input.source === "ai-chat" || input.source === "catalog_search_alert";
  if (!phoneOptional && phone.length < 6) {
    throw new Error("Укажите имя и телефон");
  }
  if (
    phoneOptional &&
    input.source === "catalog_search_alert" &&
    phone.length < 6 &&
    !input.email?.includes("@")
  ) {
    throw new Error("Укажите телефон или email");
  }

  if (input.website?.trim()) {
    return { id: null };
  }

  if (isRecaptchaEnabled() && !input.captchaToken?.trim()) {
    throw new Error("Подтвердите, что вы не робот");
  }

  const row = {
    name,
    phone,
    email: input.email?.trim() || null,
    message: input.message?.trim() || null,
    source: input.source,
    business_category: input.business_category?.trim() || null,
    object_id: input.object_id || null,
    agency_id: input.agency_id?.trim() || null,
    manager_id: input.manager_id?.trim() || null,
    status: "new",
    website: input.website?.trim() || "",
    captcha_token: input.captchaToken?.trim() || null,
  };

  const resp = await fetch(getSubmitLeadUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row),
    signal: AbortSignal.timeout(20_000),
  });

  const data = (await resp.json().catch(() => ({}))) as {
    ok?: boolean;
    id?: string | null;
    error?: string;
    skipped?: string;
  };

  if (!resp.ok) {
    throw new Error(data.error || `Ошибка отправки (${resp.status})`);
  }

  if (data.skipped === "bot") {
    return { id: null };
  }

  return { id: data.id ?? null };
}
