import { supabase } from "@/integrations/supabase/client";

export type LeadInput = {
  name: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  source: string;
  business_category?: string | null;
  object_id?: string | null;
};

/** Cloud edge-функция уведомлений (Telegram). */
const NOTIFY_URL =
  import.meta.env.VITE_NOTIFY_LEAD_URL ||
  "https://xbdwapunrlnxcuxjhaca.supabase.co/functions/v1/notify-lead";

/**
 * Сохраняет заявку в crm_leads (админка) и шлёт уведомление в Telegram
 * через Cloud Supabase Edge Function.
 */
export async function submitLead(input: LeadInput): Promise<{ id: string | null }> {
  const name = input.name.trim();
  const phone = input.phone.trim();
  if (name.length < 2) {
    throw new Error("Укажите имя");
  }
  const phoneOptional = input.source === "ai-chat";
  if (!phoneOptional && phone.length < 6) {
    throw new Error("Укажите имя и телефон");
  }

  const row = {
    name,
    phone,
    email: input.email?.trim() || null,
    message: input.message?.trim() || null,
    source: input.source,
    business_category: input.business_category?.trim() || null,
    object_id: input.object_id || null,
    status: "new",
  };

  // INSERT без SELECT: у anon есть только право вставлять, читать заявки нельзя.
  // .select() после insert даёт ошибку RLS, хотя строка уже записана.
  const { error } = await supabase.from("crm_leads").insert(row);
  if (error) throw error;

  // Telegram — best-effort: заявка уже в админке, уведомление не должно ломать форму
  try {
    await fetch(NOTIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });
  } catch (e) {
    console.warn("notify-lead failed", e);
  }

  return { id: null };
}
