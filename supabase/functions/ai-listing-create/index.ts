/**
 * Stateless listing AI (cloud xbdwapunrlnxcuxjhaca).
 *
 * Secrets:
 *   ANTHROPIC_API_KEY
 *
 * Черновик и история живут на клиенте. Функция только отвечает моделью.
 * Публикация объекта — с фронта через self-hosted JWT пользователя.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "claude-haiku-4-5";
const MAX_MESSAGES = 40;
const MAX_LENGTH = 2000;
const ANTHROPIC_TIMEOUT_MS = 45_000;

type Phase =
  | "intake"
  | "clarify"
  | "photos"
  | "enhance"
  | "preview"
  | "commit"
  | "done";

type ChatMsg = { role: "user" | "assistant"; content: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function readAnthropicKey(): string {
  return (Deno.env.get("ANTHROPIC_API_KEY") ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/[\r\n\t]/g, "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .split("#")[0]
    .trim()
    .replace(/[^\x20-\x7E]/g, "");
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

function toAnthropicMessages(
  history: ChatMsg[],
  lastUserContent: string,
): { role: "user" | "assistant"; content: string }[] {
  const cleaned: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of history) {
    if (!m?.content?.trim()) continue;
    if (m.role !== "user" && m.role !== "assistant") continue;
    const last = cleaned[cleaned.length - 1];
    if (last && last.role === m.role) {
      last.content = `${last.content}\n\n${m.content}`;
    } else {
      cleaned.push({ role: m.role, content: m.content });
    }
  }
  while (cleaned.length && cleaned[0].role !== "user") cleaned.shift();
  if (cleaned.length && cleaned[cleaned.length - 1].role === "user") {
    cleaned[cleaned.length - 1].content = lastUserContent;
  } else {
    cleaned.push({ role: "user", content: lastUserContent });
  }
  return cleaned;
}

function systemPrompt(segmentHint: string, phase: string): string {
  return `Ты — умный ассистент АрендаСити: помогаешь создать карточку объекта в свободном диалоге (Иркутск и область).
Говори по-русски, коротко, по-человечески. Не веди себя как анкета с нумерованными шагами.

Сегмент: ${segmentHint}. Фаза: ${phase}.

Из рассказа клиента заполняй draftPatch. Не выдумывай адрес/кадастр.
Цены и площадь — числами.
description — 2–5 предложений из слов клиента.

КРИТИЧНО про suggestedQuestions:
- Это ТОЛЬКО готовые быстрые ОТВЕТЫ для кнопок (что пользователь нажмёт).
- НИКОГДА не пиши туда вопросы («Где находится…?», «Какая цена?»).
- Примеры правильных: «Кировский», «Октябрьский», «50 м²», «80 м²», «Аренда», «Продажа», «Офис», «2 комнаты», «30 000 ₽/мес».
- Районы Иркутска: Кировский, Октябрьский, Свердловский, Ленинский, Куйбышевский.
- 2–6 коротких вариантов под то, чего не хватает в черновике.

reply — один короткий ответ ассистента (можно с одним уточнением в тексте). Вопросы — только в reply, не в suggestedQuestions.

Когда area, price, address/district, types, deal_type и description есть → readyForPhotos=true, phase=photos.
Когда клиент подтвердил → readyToCommit=true, phase=commit.

Ответь ТОЛЬКО JSON:
{
  "reply": "...",
  "phase": "intake|clarify|photos|enhance|preview|commit|done",
  "draftPatch": {},
  "missingFields": [],
  "suggestedQuestions": ["ответ1","ответ2"],
  "readyForPhotos": false,
  "readyToCommit": false
}`;
}

function mergeDraft(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...base };
  for (const [k, v] of Object.entries(patch || {})) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && !v.trim()) continue;
    if (typeof v === "number" && !Number.isFinite(v)) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

function normalizeHistory(raw: unknown): ChatMsg[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMsg[] = [];
  for (const m of raw.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: string }).role;
    const content = String((m as { content?: string }).content || "").trim();
    if (!content) continue;
    if (role !== "user" && role !== "assistant") continue;
    out.push({ role, content: content.slice(0, MAX_LENGTH) });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const t0 = Date.now();
  try {
    const anthropicKey = readAnthropicKey();
    if (!anthropicKey) {
      return json(
        {
          error:
            "ANTHROPIC_API_KEY не настроен. Secrets → проект xbdwapunrlnxcuxjhaca",
        },
        500,
      );
    }
    if (!anthropicKey.startsWith("sk-ant-")) {
      return json(
        {
          error:
            "ANTHROPIC_API_KEY неверный формат (нужен sk-ant-…). Проверьте Secret.",
        },
        500,
      );
    }

    const body = await req.json().catch(() => ({}));
    const message = String(body.message || "").trim().slice(0, MAX_LENGTH);
    const segmentHint = ["commercial", "residential", "land"].includes(
        body.segmentHint,
      )
      ? body.segmentHint
      : "commercial";
    const clientPhase = String(body.phase || "intake") as Phase;
    const clientDraft =
      body.clientDraft && typeof body.clientDraft === "object"
        ? (body.clientDraft as Record<string, unknown>)
        : {};
    const sessionId =
      typeof body.sessionId === "string" && body.sessionId
        ? body.sessionId
        : crypto.randomUUID();

    let draft: Record<string, unknown> = {
      segment: segmentHint,
      ...clientDraft,
    };
    let phase: Phase = clientPhase;
    const history = normalizeHistory(body.messages);

    // Bootstrap без Anthropic — приветствие на клиенте; если вызвали — тоже ок
    if (body.bootstrap && !message) {
      const welcome =
        segmentHint === "residential"
          ? "Здравствуйте! Расскажите о жилье, которое хотите разместить: тип, район, площадь, цена и что важно арендатору или покупателю."
          : segmentHint === "land"
          ? "Здравствуйте! Расскажите об участке: где находится, площадь, назначение, цена аренды или продажи."
          : "Здравствуйте! Расскажите о коммерческом объекте своими словами — тип, адрес или район, площадь, ставка и особенности.";
      return json({
        sessionId,
        reply: welcome,
        phase: "intake",
        draft,
        missingFields: [
          "types",
          "deal_type",
          "area",
          "price",
          "address",
          "description",
        ],
        suggestedQuestions: ["Офис в аренду", "Квартира на продажу", "Склад"],
        readyForPhotos: false,
        readyToCommit: false,
        reasonedMs: Date.now() - t0,
      });
    }

    if (!message) {
      return json({ error: "Пустое сообщение" }, 400);
    }

    const contextBlock =
      `Текущий черновик JSON:\n${JSON.stringify(draft)}\nФаза: ${phase}`;
    const lastUserContent =
      `${contextBlock}\n\nСообщение клиента:\n${message}`;
    const anthropicMessages = toAnthropicMessages(
      [...history, { role: "user", content: message }],
      lastUserContent,
    );

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort("timeout"), ANTHROPIC_TIMEOUT_MS);
    let aiResp: Response;
    try {
      aiResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        signal: ac.signal,
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1200,
          system: systemPrompt(segmentHint, phase),
          messages: anthropicMessages,
        }),
      });
    } finally {
      clearTimeout(timer);
    }

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("Anthropic error", aiResp.status, errText.slice(0, 500));
      if (aiResp.status === 429) {
        return json(
          { error: "Слишком много запросов к ИИ. Подождите минуту." },
          429,
        );
      }
      return json({ error: `Ошибка ИИ (${aiResp.status})` }, 502);
    }

    const aiData = await aiResp.json();
    if (aiData.stop_reason === "refusal") {
      return json({ error: "Модель отклонила запрос" }, 502);
    }
    const textBlock = (aiData.content ?? []).find(
      (b: { type: string }) => b.type === "text",
    );
    const rawText = String(textBlock?.text || "");
    const parsedObj = parseJsonObject(rawText);
    if (!parsedObj || typeof parsedObj.reply !== "string") {
      console.error("bad model json", rawText.slice(0, 300));
      return json({ error: "Некорректный ответ модели" }, 502);
    }

    const draftPatch =
      parsedObj.draftPatch && typeof parsedObj.draftPatch === "object"
        ? (parsedObj.draftPatch as Record<string, unknown>)
        : {};
    draft = mergeDraft(draft, draftPatch);
    if (!draft.segment) draft.segment = segmentHint;
    phase = String(parsedObj.phase || phase) as Phase;

    return json({
      sessionId,
      reply: String(parsedObj.reply),
      phase,
      draft,
      missingFields: Array.isArray(parsedObj.missingFields)
        ? parsedObj.missingFields.map(String)
        : [],
      suggestedQuestions: Array.isArray(parsedObj.suggestedQuestions)
        ? parsedObj.suggestedQuestions.map(String).slice(0, 3)
        : [],
      readyForPhotos: Boolean(parsedObj.readyForPhotos),
      readyToCommit: Boolean(parsedObj.readyToCommit),
      reasonedMs: Date.now() - t0,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(e);
    if (
      message.includes("abort") ||
      message.includes("timeout") ||
      message.includes("Timeout")
    ) {
      return json(
        { error: "ИИ не ответил вовремя. Попробуйте ещё раз." },
        504,
      );
    }
    return json(
      { error: e instanceof Error ? e.message : "Внутренняя ошибка" },
      500,
    );
  }
});
