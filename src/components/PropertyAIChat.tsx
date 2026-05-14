import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, X, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";

type Msg = { role: "user" | "assistant"; content: string; typing?: boolean };
type Stage = "greeting" | "ask_name" | "ask_phone" | "chat";

interface Props {
  propertyId?: string;
  propertyAddress?: string;
}

// Typewriter: streams content char-by-char with natural delay
function useTypewriter() {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(true);
  const queueRef = useRef("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const typeNext = useCallback(() => {
    if (queueRef.current.length === 0) { setDone(true); return; }
    const char = queueRef.current[0];
    queueRef.current = queueRef.current.slice(1);
    setDisplayed((p) => p + char);
    // Slightly longer pause at punctuation for natural feel
    const delay = /[.!?,\n]/.test(char) ? 40 + Math.random() * 40 : 18 + Math.random() * 14;
    timerRef.current = setTimeout(typeNext, delay);
  }, []);

  const start = useCallback((text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayed("");
    setDone(false);
    queueRef.current = text;
    timerRef.current = setTimeout(typeNext, 300); // initial pause before typing
  }, [typeNext]);

  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayed((p) => p + queueRef.current);
    queueRef.current = "";
    setDone(true);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return { displayed, done, start, flush };
}

export default function PropertyAIChat({ propertyId, propertyAddress }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [wiggle, setWiggle] = useState(false);
  const [stage, setStage] = useState<Stage>("greeting");
  const [userName, setUserName] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Typewriter for the latest assistant message
  const tw = useTypewriter();
  // Track which message index is being typed
  const typingIdxRef = useRef(-1);

  // Wiggle
  useEffect(() => {
    if (open) return;
    const first = setTimeout(() => setWiggle(true), 4000);
    const interval = setInterval(() => setWiggle(true), 12000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, [open]);
  useEffect(() => {
    if (!wiggle) return;
    const t = setTimeout(() => setWiggle(false), 800);
    return () => clearTimeout(t);
  }, [wiggle]);

  // Global open event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-consultant-chat", handler);
    return () => window.removeEventListener("open-consultant-chat", handler);
  }, []);

  // Show greeting and ask name on first open
  const addAssistant = useCallback((text: string) => {
    setMessages((prev) => {
      const idx = prev.length;
      typingIdxRef.current = idx;
      tw.start(text);
      return [...prev, { role: "assistant", content: text, typing: true }];
    });
  }, [tw]);

  useEffect(() => {
    if (!open || messages.length > 0) return;
    setStage("ask_name");
    const t = setTimeout(() => {
      addAssistant(
        propertyAddress
          ? `Здравствуйте! Я Анастасия, консультант АРЕНДА СИТИ. Помогу с вопросами по объекту «${propertyAddress}».\n\nКак вас зовут?`
          : "Здравствуйте! Я Анастасия, консультант АРЕНДА СИТИ. Помогу подобрать офис, склад или торговое помещение.\n\nКак вас зовут?"
      );
    }, 900);
    return () => clearTimeout(t);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mark typing done when typewriter finishes
  useEffect(() => {
    if (!tw.done) return;
    setMessages((prev) =>
      prev.map((m, i) => (i === typingIdxRef.current ? { ...m, typing: false } : m))
    );
  }, [tw.done]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, tw.displayed, loading, open]);

  const sendAI = async (history: Msg[], name: string) => {
    setLoading(true);
    const systemNote = name ? `Пользователя зовут ${name}. Обращайся к нему по имени.` : "";
    let assistantSoFar = "";

    const newIdx = history.length;
    typingIdxRef.current = newIdx;
    setMessages((prev) => [...prev, { role: "assistant", content: "", typing: true }]);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          propertyId,
          systemNote,
        }),
      });

      if (!resp.ok || !resp.body) {
        toast({ title: "Ошибка", description: "Не удалось получить ответ.", variant: "destructive" });
        setMessages((prev) => prev.filter((_, i) => i !== newIdx));
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let done = false;
      while (!done) {
        const r = await reader.read();
        if (r.done) break;
        buf += decoder.decode(r.value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (c) assistantSoFar += c;
          } catch { buf = line + "\n" + buf; break; }
        }
      }

      // Start typewriter with full streamed text
      tw.start(assistantSoFar);
      setMessages((prev) =>
        prev.map((m, i) => i === newIdx ? { ...m, content: assistantSoFar, typing: true } : m)
      );
    } catch (e) {
      console.error(e);
      toast({ title: "Ошибка сети", description: "Проверьте подключение.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");

    const userMsg: Msg = { role: "user", content: trimmed };

    if (stage === "ask_name") {
      const name = trimmed;
      setUserName(name);
      setMessages((prev) => [...prev, userMsg]);
      setStage("ask_phone");
      const t = setTimeout(() => {
        addAssistant(`Приятно познакомиться, ${name}! 😊\n\nОставите номер телефона? Так смогу перезвонить, если понадоблюсь — это необязательно.`);
      }, 400);
      return () => clearTimeout(t);
    }

    if (stage === "ask_phone") {
      setMessages((prev) => [...prev, userMsg]);
      setStage("chat");
      const greeting = userName || "вы";
      const isSkip = /^(нет|пропустить|skip|не|—|-|\.+)$/i.test(trimmed);
      const next: Msg[] = [
        ...messages,
        userMsg,
      ];
      const followUp: Msg = {
        role: "assistant",
        content: isSkip
          ? `Хорошо, ${greeting}! Спрашивайте — помогу с любым вопросом по недвижимости.`
          : `Отлично, записала! Чем могу помочь, ${userName || greeting}?`,
      };
      const t = setTimeout(() => {
        const nextWithFollow = [...next, followUp];
        typingIdxRef.current = nextWithFollow.length - 1;
        tw.start(followUp.content);
        setMessages([...next, { ...followUp, typing: true }]);
      }, 400);
      return () => clearTimeout(t);
    }

    // Normal chat
    const next = [...messages, userMsg];
    setMessages(next);
    await sendAI(next, userName);
  };

  const isTyping = messages.some((m) => m.typing);
  const showStarters = stage === "chat" && !loading && !isTyping && messages.filter((m) => m.role === "user").length <= 1;

  const STARTERS = ["Какие офисы до 100К в центре?", "Склад с пандусом от 500 м²", "Условия аренды", "Покажи аналоги"];

  // What to show for a typing message
  const renderContent = (m: Msg, idx: number) => {
    if (m.typing && idx === typingIdxRef.current) {
      return (
        <div className="prose prose-sm max-w-none prose-p:my-1 prose-strong:text-foreground whitespace-pre-wrap text-[12px] leading-relaxed">
          {tw.displayed}
          <span className="inline-block w-0.5 h-3.5 bg-foreground/60 animate-pulse ml-0.5 align-middle" />
        </div>
      );
    }
    return (
      <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-foreground">
        <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
      </div>
    );
  };

  return (
    <>
      {/* ── BUBBLE TAB ── */}
      <div
        className={`fixed right-5 top-1/2 -translate-y-1/2 z-40 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          open ? "opacity-0 pointer-events-none scale-90" : "opacity-100 scale-100"
        }`}
      >
        <button
          onClick={() => setOpen(true)}
          aria-label="Открыть чат"
          className={`flex flex-col items-center gap-1.5 group ${wiggle ? "animate-[tab-wiggle_0.8s_ease-in-out]" : ""}`}
        >
          <div className="relative w-12 h-12 bg-card border border-border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.18)] flex items-center justify-center group-hover:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.22)] transition-shadow duration-200">
            <img src={consultantAvatar} alt="Анастасия" className="w-10 h-10 object-cover" />
            <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-card" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow-sm animate-[badge-pop_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
              1
            </span>
          </div>
          <div className="flex items-center gap-0.5 bg-card border border-border px-2.5 py-1 shadow-sm">
            <span className="w-1 h-1 bg-muted-foreground/60 animate-[dot-pulse_1.4s_ease-in-out_0s_infinite]" />
            <span className="w-1 h-1 bg-muted-foreground/60 animate-[dot-pulse_1.4s_ease-in-out_0.2s_infinite]" />
            <span className="w-1 h-1 bg-muted-foreground/60 animate-[dot-pulse_1.4s_ease-in-out_0.4s_infinite]" />
          </div>
        </button>
      </div>

      {/* ── PANEL ── */}
      <div
        className={`
          fixed z-50 right-0 top-1/2 -translate-y-1/2
          w-[340px] h-[min(560px,85vh)]
          bg-card border-l border-y border-border
          shadow-[-12px_0_40px_-8px_rgba(0,0,0,0.15)]
          flex flex-col overflow-hidden
          transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${open ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0 pointer-events-none"}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          <div className="relative shrink-0">
            <img src={consultantAvatar} alt="Анастасия" className="w-8 h-8 object-cover" />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-card" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-foreground">Анастасия · АРЕНДА СИТИ</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {isTyping ? (
                <span className="inline-flex items-center gap-1">
                  печатает
                  <span className="inline-flex gap-0.5">
                    <span className="w-1 h-1 bg-muted-foreground animate-[dot-pulse_1.4s_0s_infinite]" />
                    <span className="w-1 h-1 bg-muted-foreground animate-[dot-pulse_1.4s_0.2s_infinite]" />
                    <span className="w-1 h-1 bg-muted-foreground animate-[dot-pulse_1.4s_0.4s_infinite]" />
                  </span>
                </span>
              ) : "Консультант по недвижимости"}
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="shrink-0 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0 bg-background/40">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <img src={consultantAvatar} alt="" className="w-5 h-5 object-cover shrink-0 mr-1.5 mt-1 self-start" />
              )}
              <div className={`max-w-[82%] px-3 py-2 text-[12px] leading-relaxed ${
                m.role === "user"
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground"
              }`}>
                {m.role === "assistant" ? renderContent(m, i) : <div className="whitespace-pre-wrap">{m.content}</div>}
              </div>
            </div>
          ))}
          {loading && !messages.some((m) => m.typing) && (
            <div className="flex justify-start items-end gap-1.5">
              <img src={consultantAvatar} alt="" className="w-5 h-5 object-cover shrink-0" />
              <div className="bg-muted px-3 py-2 inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground/60 animate-[dot-pulse_1.4s_0s_infinite]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/60 animate-[dot-pulse_1.4s_0.2s_infinite]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/60 animate-[dot-pulse_1.4s_0.4s_infinite]" />
              </div>
            </div>
          )}
        </div>

        {/* Starters */}
        {showStarters && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-[10px] px-2.5 py-1 border border-border text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="border-t border-border p-2.5 flex items-center gap-2 shrink-0 bg-card"
        >
          <a href="tel:+73952551234" title="Позвонить" className="p-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <Phone className="w-3.5 h-3.5" />
          </a>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              stage === "ask_name" ? "Введите ваше имя…" :
              stage === "ask_phone" ? "Номер телефона (или пропустить)…" :
              "Напишите сообщение…"
            }
            disabled={loading || isTyping}
            className="flex-1 px-3 py-2 bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || isTyping || !input.trim()}
            className="p-2 bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-30 shrink-0"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes tab-wiggle {
          0%,100% { transform: translateY(-50%) scale(1); }
          20%      { transform: translateY(-52%) scale(1.04) rotate(-1deg); }
          50%      { transform: translateY(-49%) scale(1.03) rotate(0.8deg); }
          80%      { transform: translateY(-51%) scale(1.01) rotate(-0.4deg); }
        }
        @keyframes dot-pulse {
          0%,80%,100% { opacity: 0.3; transform: scale(0.8); }
          40%          { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes badge-pop {
          0%   { transform: scale(0); opacity: 0; }
          70%  { transform: scale(1.25); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
