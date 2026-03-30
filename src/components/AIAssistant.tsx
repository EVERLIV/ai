import { useState, useRef, useEffect, useCallback } from "react";
import { useConversation } from "@elevenlabs/react";
import { Sparkles, X, Send, Phone, PhoneOff, Mic, MicOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

const quickChips = ["Офис до 100 м² в Иркутске", "Склад в Ангарске", "Торговое на Карла Маркса"];

const ELEVENLABS_AGENT_ID = "agent_7301kmyt4jxxf8etgj0av5x43qb4"; // TODO: paste your ElevenLabs agent ID here

export default function AIAssistant({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Привет! Я помогу подобрать коммерческую недвижимость под ваши задачи. Расскажите: что ищете — аренда или покупка? Какой бюджет и площадь?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [voiceTranscripts, setVoiceTranscripts] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const conversation = useConversation({
    onConnect: () => {
      console.log("ElevenLabs agent connected");
      setIsConnecting(false);
      setVoiceTranscripts([]);
    },
    onDisconnect: () => {
      console.log("ElevenLabs agent disconnected");
      setIsVoiceMode(false);
    },
    onMessage: (message: any) => {
      if (message.type === "agent_response") {
        const text = message.agent_response_event?.agent_response;
        if (text) {
          setVoiceTranscripts((prev) => [...prev, `🤖 ${text}`]);
        }
      }
      if (message.type === "user_transcript") {
        const text = message.user_transcription_event?.user_transcript;
        if (text) {
          setVoiceTranscripts((prev) => [...prev, `👤 ${text}`]);
        }
      }
    },
    onError: (error) => {
      console.error("ElevenLabs error:", error);
      toast({
        title: "Ошибка голосового агента",
        description: "Не удалось подключиться. Попробуйте позже.",
        variant: "destructive",
      });
      setIsConnecting(false);
      setIsVoiceMode(false);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, voiceTranscripts]);

  const startVoiceCall = useCallback(async () => {
    if (!ELEVENLABS_AGENT_ID) {
      toast({
        title: "Агент не настроен",
        description: "Укажите ELEVENLABS_AGENT_ID в настройках компонента.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error } = await supabase.functions.invoke("elevenlabs-conversation-token", {
        body: { agent_id: ELEVENLABS_AGENT_ID },
      });

      if (error || !data?.token) {
        throw new Error(error?.message || "Не удалось получить токен");
      }

      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });

      setIsVoiceMode(true);
    } catch (err: any) {
      console.error("Voice call error:", err);
      const msg =
        err?.name === "NotAllowedError"
          ? "Разрешите доступ к микрофону для голосового звонка."
          : err?.message || "Не удалось начать звонок";
      toast({ title: "Ошибка", description: msg, variant: "destructive" });
      setIsConnecting(false);
    }
  }, [conversation, toast]);

  const endVoiceCall = useCallback(async () => {
    await conversation.endSession();
    setIsVoiceMode(false);
  }, [conversation]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Для подключения реального ИИ-ассистента необходимо активировать Lovable Cloud. Пока что я работаю в демо-режиме. Расскажите подробнее о вашем запросе!",
        },
      ]);
      setLoading(false);
    }, 1500);
  };

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={onToggle}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gold shadow-float flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform group"
        >
          <Sparkles className="w-6 h-6" />
          <span className="absolute -top-8 right-0 bg-foreground text-background text-xs px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            ИИ-помощник
          </span>
        </button>
      )}

      {/* Drawer */}
      {open && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-card shadow-float flex flex-col border-l border-border">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center ${isVoiceMode ? "bg-primary/15" : "bg-gold/15"}`}
              >
                {isVoiceMode ? <Phone className="w-4 h-4 text-primary" /> : <Sparkles className="w-4 h-4 text-gold" />}
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {isVoiceMode ? "Голосовой звонок" : "Коммерц ИИ"}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${isVoiceMode ? "bg-primary animate-pulse" : "bg-green-500"} status-pulse`}
                  />
                  {isVoiceMode ? (conversation.isSpeaking ? "говорит..." : "слушает...") : "онлайн"}
                </div>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Voice Mode */}
          {isVoiceMode ? (
            <div className="flex-1 flex flex-col">
              {/* Transcripts */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {voiceTranscripts.length === 0 && (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mic className={`w-8 h-8 text-primary ${conversation.isSpeaking ? "" : "animate-pulse"}`} />
                    </div>
                    <p className="font-medium">Говорите — агент слушает</p>
                    <p className="text-xs mt-1">Задайте вопрос о коммерческой недвижимости</p>
                  </div>
                )}
                {voiceTranscripts.map((t, i) => (
                  <div
                    key={i}
                    className={`text-sm px-4 py-2.5 rounded-xl ${
                      t.startsWith("👤") ? "bg-primary/10 text-foreground ml-8" : "bg-muted text-foreground mr-8"
                    }`}
                  >
                    {t.slice(2)}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* End Call Button */}
              <div className="px-5 py-4 border-t border-border flex justify-center">
                <button
                  onClick={endVoiceCall}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity font-medium"
                >
                  <PhoneOff className="w-5 h-5" />
                  Завершить звонок
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md flex gap-1.5 items-center">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick chips */}
              {messages.length <= 1 && (
                <div className="px-5 pb-2 flex flex-wrap gap-2">
                  {quickChips.map((c) => (
                    <button
                      key={c}
                      onClick={() => sendMessage(c)}
                      className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}

              {/* Input + Call Button */}
              <div className="px-4 py-3 border-t border-border space-y-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage(input);
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Напишите сообщение..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 hover:opacity-90 transition-opacity"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                {/* Voice Call CTA */}
                <button
                  onClick={startVoiceCall}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/30 text-primary hover:bg-primary/5 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <Phone className="w-4 h-4" />
                  {isConnecting ? "Подключение..." : "Позвонить ИИ-консультанту"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
