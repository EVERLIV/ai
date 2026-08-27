import type { PropertySegment } from "@/config/propertySegments";
import type { ListingAiPhase } from "@/lib/listingAiDraft";

export type ListingAiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ListingAiResponse = {
  sessionId: string;
  reply: string;
  phase: ListingAiPhase;
  draft: Record<string, unknown>;
  missingFields: string[];
  suggestedQuestions: string[];
  readyForPhotos: boolean;
  readyToCommit: boolean;
  propertyId?: string | null;
  reasonedMs?: number;
};

const CLOUD_URL =
  "https://xbdwapunrlnxcuxjhaca.supabase.co/functions/v1/ai-listing-create";

function endpoint(): string {
  // Cloud Anthropic only — draft/history on client; publish via self-hosted user JWT
  return import.meta.env.VITE_LISTING_AI_URL || CLOUD_URL;
}

const CLIENT_TIMEOUT_MS = 45_000;

/** Локальный id сессии — без записи в listing_ai_sessions. */
export function newListingAiSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function welcomeListingAi(segment: PropertySegment): ListingAiResponse {
  const reply =
    segment === "residential"
      ? "Расскажите о жилье своими словами — или ткните быстрый вариант. Я соберу карточку."
      : segment === "land"
      ? "Расскажите об участке своими словами — или выберите вариант ниже."
      : "Расскажите об объекте своими словами — или ткните быстрый вариант. Я соберу карточку.";
  return {
    sessionId: newListingAiSessionId(),
    reply,
    phase: "intake",
    draft: { segment },
    missingFields: [],
    suggestedQuestions:
      segment === "residential"
        ? ["Квартира", "Дом", "Аренда", "Продажа", "Кировский"]
        : segment === "land"
        ? ["Земля", "Участок", "Аренда", "Продажа"]
        : ["Офис", "Склад", "Торговая", "Аренда", "Кировский"],
    readyForPhotos: false,
    readyToCommit: false,
    reasonedMs: 0,
  };
}

export async function invokeListingAi(input: {
  sessionId?: string | null;
  message?: string;
  segmentHint: PropertySegment;
  phase: ListingAiPhase;
  clientDraft?: Record<string, unknown>;
  messages?: ListingAiChatMessage[];
  bootstrap?: boolean;
}): Promise<ListingAiResponse> {
  if (input.bootstrap && !input.message?.trim()) {
    return welcomeListingAi(input.segmentHint);
  }

  const ac = new AbortController();
  const timer = window.setTimeout(() => ac.abort(), CLIENT_TIMEOUT_MS);
  let resp: Response;
  try {
    // Без JWT: функция verify_jwt=false и не пишет в каталог.
    resp = await fetch(endpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: ac.signal,
      body: JSON.stringify({
        sessionId: input.sessionId || undefined,
        message: input.message || "",
        segmentHint: input.segmentHint,
        phase: input.phase,
        clientDraft: input.clientDraft || {},
        messages: (input.messages || []).slice(-40),
      }),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("ИИ не ответил вовремя. Попробуйте ещё раз.");
    }
    throw e;
  } finally {
    window.clearTimeout(timer);
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(
      (data && (data.error || data.msg)) ||
        `Ошибка сервиса (${resp.status})`,
    );
  }
  if (data?.error) throw new Error(data.error);

  return {
    sessionId: String(data.sessionId || input.sessionId || newListingAiSessionId()),
    reply: String(data.reply || ""),
    phase: (data.phase || "clarify") as ListingAiPhase,
    draft:
      data.draft && typeof data.draft === "object"
        ? (data.draft as Record<string, unknown>)
        : {},
    missingFields: Array.isArray(data.missingFields)
      ? data.missingFields.map(String)
      : [],
    suggestedQuestions: Array.isArray(data.suggestedQuestions)
      ? data.suggestedQuestions
          .map(String)
          .filter((s) => s.trim() && !s.includes("?") && s.length <= 48)
          .slice(0, 6)
      : [],
    readyForPhotos: Boolean(data.readyForPhotos),
    readyToCommit: Boolean(data.readyToCommit),
    propertyId: null,
    reasonedMs: Number(data.reasonedMs) || 900,
  };
}
