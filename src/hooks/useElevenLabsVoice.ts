import { useConversation } from "@elevenlabs/react";
import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";

/** ID агента из ElevenLabs (уже настроен). Можно переопределить через VITE_ELEVENLABS_AGENT_ID */
export const ELEVENLABS_AGENT_ID =
  import.meta.env.VITE_ELEVENLABS_AGENT_ID ||
  "agent_7301kmyt4jxxf8etgj0av5x43qb4";

/** Cloud Edge — как ai-chat / notify-lead (не self-hosted api.arendacity.com) */
const ELEVENLABS_TOKEN_URL =
  import.meta.env.VITE_ELEVENLABS_TOKEN_URL ||
  "https://xbdwapunrlnxcuxjhaca.supabase.co/functions/v1/elevenlabs-conversation-token";

type VoiceMsg = { role: "user" | "assistant"; content: string };

/** ElevenLabs v3 пишет в транскрипт ремарки вроде [enthusiastic] */
export function stripVoiceStageDirections(text: string): string {
  return text
    .replace(/\[[^\]]{1,48}\]/g, (tag) => (/\d/.test(tag) ? tag : ""))
    .replace(
      /\((?:laughs|laughing|sighs|sighing|whispers|pauses|clears throat)\)/gi,
      "",
    )
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

type StartOpts = {
  propertyId?: string;
  propertyAddress?: string;
};

type TokenResponse = {
  token?: string;
  error?: string;
  site_url?: string;
  catalog?: { summary?: string; text?: string };
  count?: number;
  shown?: number;
  result?: string;
};

async function callElevenlabsFn(
  body: Record<string, unknown>,
): Promise<TokenResponse> {
  const resp = await fetch(ELEVENLABS_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await resp.json().catch(() => ({}))) as TokenResponse;
  if (!resp.ok) {
    throw new Error(data.error || `Edge Function HTTP ${resp.status}`);
  }
  return data;
}

/**
 * Голосовой звонок на ElevenLabs-агента с подгрузкой каталога объектов.
 */
export function useElevenLabsVoice() {
  const { toast } = useToast();
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcripts, setTranscripts] = useState<VoiceMsg[]>([]);

  const conversation = useConversation({
    onConnect: () => {
      setIsConnecting(false);
    },
    onDisconnect: () => {
      setIsVoiceMode(false);
      setIsConnecting(false);
    },
    onMessage: (message: unknown) => {
      const m = message as {
        type?: string;
        message?: string;
        source?: string;
        role?: string;
        agent_response_event?: { agent_response?: string };
        user_transcription_event?: { user_transcript?: string };
      };

      if (m.type === "agent_response") {
        const text = stripVoiceStageDirections(
          m.agent_response_event?.agent_response || m.message || "",
        );
        if (text)
          setTranscripts((prev) => [
            ...prev,
            { role: "assistant", content: text },
          ]);
        return;
      }
      if (m.type === "user_transcript") {
        const text = stripVoiceStageDirections(
          m.user_transcription_event?.user_transcript || m.message || "",
        );
        if (text)
          setTranscripts((prev) => [...prev, { role: "user", content: text }]);
        return;
      }
      if (typeof m.message === "string" && m.message.trim()) {
        const text = stripVoiceStageDirections(m.message);
        if (!text) return;
        const role =
          m.source === "user" || m.role === "user" ? "user" : "assistant";
        setTranscripts((prev) => [...prev, { role, content: text }]);
      }
    },
    onError: (error) => {
      console.error("ElevenLabs error:", error);
      toast({
        title: "Ошибка голосового агента",
        description:
          typeof error === "string"
            ? error
            : "Не удалось подключиться. Попробуйте позже.",
        variant: "destructive",
      });
      setIsConnecting(false);
      setIsVoiceMode(false);
    },
  });

  const searchPropertiesTool = useCallback(
    async (params: {
      query?: string;
      type?: string;
      district?: string;
      max_price?: number;
      min_area?: number;
      max_area?: number;
    }) => {
      try {
        const data = await callElevenlabsFn({ action: "search", ...params });
        if (!data?.result) return "Ничего не найдено.";
        return `Найдено: ${data.count ?? "?"}. Показываю ${data.shown ?? ""}:\n${data.result}`;
      } catch (e) {
        return `Ошибка поиска: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
    [],
  );

  const startVoiceCall = useCallback(
    async (opts: StartOpts = {}) => {
      if (!ELEVENLABS_AGENT_ID) {
        toast({
          title: "Агент не настроен",
          description: "Укажите VITE_ELEVENLABS_AGENT_ID.",
          variant: "destructive",
        });
        return;
      }

      setIsConnecting(true);
      setTranscripts([]);
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });

        const data = await callElevenlabsFn({
          agent_id: ELEVENLABS_AGENT_ID,
          include_catalog: true,
          property_id: opts.propertyId,
        });

        if (!data?.token) {
          throw new Error(
            data?.error || "Не удалось получить токен ElevenLabs",
          );
        }

        await conversation.startSession({
          conversationToken: data.token,
          connectionType: "webrtc",
          clientTools: {
            search_properties: searchPropertiesTool,
            searchProperties: searchPropertiesTool,
          },
          dynamicVariables: {
            catalog_summary: data.catalog?.summary || "",
            site_url: data.site_url || "https://arendacity.com",
            property_address: opts.propertyAddress || "",
          },
        } as Parameters<typeof conversation.startSession>[0]);

        const catalogBlock = [
          "Актуальный каталог АрендаСити. Называй только эти объекты, не выдумывай.",
          data.catalog?.summary || "",
          data.catalog?.text || "",
          "Голосом: адрес, площадь, цена. Ссылки не читай. На просмотр переведи на Марию через transfer_to_number.",
          opts.propertyAddress
            ? `Клиент смотрит объект: ${opts.propertyAddress}${opts.propertyId ? ` (id ${opts.propertyId})` : ""}.`
            : "",
        ]
          .filter(Boolean)
          .join("\n");

        try {
          conversation.sendContextualUpdate?.(catalogBlock);
        } catch (e) {
          console.warn("sendContextualUpdate failed", e);
        }

        setIsVoiceMode(true);
      } catch (err: unknown) {
        console.error("Voice call error:", err);
        const e = err as { name?: string; message?: string };
        const msg =
          e?.name === "NotAllowedError"
            ? "Разрешите доступ к микрофону для голосового звонка."
            : e?.message || "Не удалось начать звонок";
        toast({ title: "Ошибка", description: msg, variant: "destructive" });
        setIsConnecting(false);
      }
    },
    [conversation, searchPropertiesTool, toast],
  );

  const endVoiceCall = useCallback(async () => {
    try {
      await conversation.endSession();
    } finally {
      setIsVoiceMode(false);
      setIsConnecting(false);
    }
  }, [conversation]);

  return {
    isVoiceMode,
    isConnecting,
    isSpeaking: conversation.isSpeaking,
    transcripts,
    startVoiceCall,
    endVoiceCall,
  };
}
