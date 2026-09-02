/**
 * Fal AI — OpenAI-совместимый chat через OpenRouter.
 * https://fal.ai/models/openrouter/router/openai/v1/chat/completions
 */

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const FAL_CHAT_URL =
  "https://fal.run/openrouter/router/openai/v1/chat/completions";

/** Дешёвая модель для консультанта на сайте (русский, короткие ответы). */
export const DEFAULT_FAL_CHAT_MODEL = "google/gemini-2.5-flash-lite";

export function falChatModel(): string {
  return Deno.env.get("FAL_CHAT_MODEL")?.trim() || DEFAULT_FAL_CHAT_MODEL;
}

export async function completeFalChat(opts: {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const key = Deno.env.get("FAL_KEY")?.trim();
  if (!key) throw new Error("FAL_KEY не настроен");

  const apiMessages: ChatMessage[] = [
    { role: "system", content: opts.system },
    ...opts.messages.filter((m) => m.role === "user" || m.role === "assistant"),
  ];

  const resp = await fetch(FAL_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Key ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: falChatModel(),
      messages: apiMessages,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.6,
    }),
    signal: AbortSignal.timeout(45_000),
  });

  const raw = await resp.text();
  if (!resp.ok) {
    console.error("fal chat", resp.status, raw.slice(0, 400));
    throw new FalChatError(
      resp.status === 429
        ? "Слишком много запросов. Попробуйте через минуту."
        : "Чат временно недоступен.",
      resp.status,
    );
  }

  let data: {
    choices?: Array<{ message?: { content?: string | null } }>;
    error?: { message?: string };
  };
  try {
    data = JSON.parse(raw);
  } catch {
    throw new FalChatError("Некорректный ответ модели.", 502);
  }

  if (data.error?.message) {
    throw new FalChatError(data.error.message, 502);
  }

  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new FalChatError("Пустой ответ модели.", 502);
  return text;
}

export class FalChatError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "FalChatError";
    this.status = status;
  }
}
