import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, X, Phone, Check, CheckCheck, Mic, PhoneCall } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";

type MsgStatus = "sending" | "sent" | "read";
type Msg = {
  role: "user" | "assistant";
  content: string;
  typing?: boolean;
  time: string;
  status?: MsgStatus;
};
type Stage = "greeting" | "ask_name" | "ask_phone" | "chat";

interface Props {
  propertyId?: string;
  propertyAddress?: string;
}

const now = () => new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

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
    const delay = /[.!?,\n]/.test(char) ? 40 + Math.random() * 40 : 18 + Math.random() * 14;
    timerRef.current = setTimeout(typeNext, delay);
  }, []);

  const start = useCallback((text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayed(""); setDone(false);
    queueRef.current = text;
    timerRef.current = setTimeout(typeNext, 300);
  }, [typeNext]);

  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDisplayed((p) => p + queueRef.current);
    queueRef.current = ""; setDone(true);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  return { displayed, done, start, flush };
}

// Иконка статуса (WhatsApp-style)
function MsgStatusIcon({ status }: { status?: MsgStatus }) {
  if (!status) return null;
  if (status === "sending") return <Check className="w-3 h-3 opacity-40" />;
  if (status === "sent") return <CheckCheck className="w-3 h-3 opacity-60" />;
  return <CheckCheck className="w-3 h-3 text-sky-400" />;
}

const STARTERS = [
  "Офисы до 100К/мес",
  "Склад с пандусом",
  "Условия аренды",
  "Показать аналоги",
];

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
  const inputRef = useRef<HTMLInputElement>(null);
  const tw = useTypewriter();
  const typingIdxRef = useRef(-1);

  // Wiggle bubble
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

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-consultant-chat", handler);
    return () => window.removeEventListener("open-consultant-chat", handler);
  }, []);

  const addAssistant = useCallback((text: string) => {
    setMessages((prev) => {
      const idx = prev.length;
      typingIdxRef.current = idx;
      tw.start(text);
      return [...prev, { role: "assistant", content: text, typing: true, time: now() }];
    });
  }, [tw]);

  useEffect(() => {
    if (!open || messages.length > 0) return;
    setStage("ask_name");
    const t = setTimeout(() => {
      addAssistant(
        propertyAddress
          ? `Здравствуйте! Помогу с вопросами по объекту «${propertyAddress}».\n\nКак вас зовут?`
          : "Здравствуйте! Помогу подобрать офис, склад или торговое помещение.\n\nКак вас зовут?"
      );
    }, 900);
    return () => clearTimeout(t);
  }, [open]); // eslint-disable-line

  useEffect(() => {
    if (!tw.done) return;
    setMessages((prev) =>
      prev.map((m, i) => i === typingIdxRef.current ? { ...m, typing: false } : m)
    );
    // Mark user messages as read after assistant replies
    setMessages((prev) =>
      prev.map((m) => m.role === "user" && m.status === "sent" ? { ...m, status: "read" } : m)
    );
  }, [tw.done]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, tw.displayed, loading, open]);

  // Focus input when open on mobile
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 400);
  }, [open]);

  const sendAI = async (history: Msg[], name: string) => {
    setLoading(true);
    const systemNote = name ? `Пользователя зовут ${name}. Обращайся к нему по имени.` : "";
    let assistantSoFar = "";
    const newIdx = history.length;
    typingIdxRef.current = newIdx;
    setMessages((prev) => [...prev, { role: "assistant", content: "", typing: true, time: now() }]);

    try {
      const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || "https://api.arendacity.com";
      const supabaseKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4ODQyOTQwLCJleHAiOjE5MzY1MjI5NDB9.uK1BksB1rl0vNAlUc2nVpkqECeiWD9CKx0rIfHUlyWA";
      const resp = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseKey}` },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })), propertyId, systemNote }),
      });

      if (!resp.ok || !resp.body) {
        toast({ title: "Ошибка", description: "Не удалось получить ответ.", variant: "destructive" });
        setMessages((prev) => prev.filter((_, i) => i !== newIdx));
        setLoading(false); return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "", done = false;
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
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content as string | undefined;
            if (c) assistantSoFar += c;
          } catch { buf = line + "\n" + buf; break; }
        }
      }
      tw.start(assistantSoFar);
      setMessages((prev) => prev.map((m, i) => i === newIdx ? { ...m, content: assistantSoFar, typing: true } : m));
    } catch (e) {
      console.error(e);
      toast({ title: "Ошибка сети", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");

    const userMsg: Msg = { role: "user", content: trimmed, time: now(), status: "sending" };

    if (stage === "ask_name") {
      setUserName(trimmed);
      setMessages((prev) => [...prev, { ...userMsg, status: "sent" }]);
      setStage("ask_phone");
      setTimeout(() => addAssistant(`Приятно познакомиться, ${trimmed}! 😊\n\nОставите номер телефона? Так смогу перезвонить — это необязательно.`), 400);
      return;
    }

    if (stage === "ask_phone") {
      setMessages((prev) => [...prev, { ...userMsg, status: "sent" }]);
      setStage("chat");
      const isSkip = /^(нет|пропустить|skip|не|—|-|\.+)$/i.test(trimmed);
      const reply: Msg = {
        role: "assistant", time: now(),
        content: isSkip
          ? `Хорошо! Спрашивайте — отвечу на любой вопрос по недвижимости.`
          : `Записала! Чем могу помочь, ${userName}?`,
      };
      setTimeout(() => {
        typingIdxRef.current = messages.length + 1;
        tw.start(reply.content);
        setMessages((prev) => [...prev, { ...reply, typing: true }]);
      }, 400);
      return;
    }

    const next = [...messages, { ...userMsg, status: "sent" as MsgStatus }];
    setMessages(next);
    await sendAI(next, userName);
  };

  const isTyping = messages.some((m) => m.typing);
  const showStarters = stage === "chat" && !loading && !isTyping && messages.filter((m) => m.role === "user").length <= 1;

  const renderContent = (m: Msg, idx: number) => {
    if (m.typing && idx === typingIdxRef.current) {
      return (
        <div className="text-[13px] leading-relaxed whitespace-pre-wrap">
          {tw.displayed}
          <span className="inline-block w-0.5 h-3.5 bg-foreground/50 animate-pulse ml-0.5 align-middle" />
        </div>
      );
    }
    return (
      <div className="prose prose-sm max-w-none prose-p:my-0.5 prose-ul:my-1 prose-li:my-0 text-[13px] leading-relaxed">
        <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
      </div>
    );
  };

  return (
    <>
      {/* ── BUBBLE ── */}
      <div className={`fixed right-5 top-1/2 -translate-y-1/2 z-40 transition-all duration-300 ${open ? "opacity-0 pointer-events-none scale-90" : "opacity-100 scale-100"}`}>
        <button onClick={() => setOpen(true)} aria-label="Открыть чат"
          className={`flex flex-col items-center gap-1.5 group ${wiggle ? "animate-[tab-wiggle_0.8s_ease-in-out]" : ""}`}>
          <div className="relative w-12 h-12 bg-card border border-border shadow-lg flex items-center justify-center">
            <img src={consultantAvatar} alt="Анастасия" className="w-10 h-10 object-cover object-top" />
            <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-card rounded-full" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow-sm">1</span>
          </div>
          <div className="flex items-center gap-0.5 bg-card border border-border px-2.5 py-1 shadow-sm">
            <span className="w-1 h-1 bg-muted-foreground/60 animate-[dot-pulse_1.4s_ease-in-out_0s_infinite]" />
            <span className="w-1 h-1 bg-muted-foreground/60 animate-[dot-pulse_1.4s_ease-in-out_0.2s_infinite]" />
            <span className="w-1 h-1 bg-muted-foreground/60 animate-[dot-pulse_1.4s_ease-in-out_0.4s_infinite]" />
          </div>
        </button>
      </div>

      {/* ── BACKDROP мобайл ── */}
      {open && <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setOpen(false)} />}

      {/* ── PANEL ── */}
      <div className={`
        fixed z-50 flex flex-col overflow-hidden bg-card
        inset-x-0 bottom-0 h-[100dvh]
        md:inset-x-auto md:right-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto
        md:w-[370px] md:h-[min(600px,88vh)]
        md:border-l md:border-y md:border-border
        md:shadow-[-16px_0_48px_-8px_rgba(0,0,0,0.12)]
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none md:translate-y-[-46%] md:opacity-0"}
      `}>

        {/* ── HEADER ── */}
        <div className="shrink-0 flex items-center gap-3 px-4 bg-card border-b border-border/60"
          style={{ paddingTop: "max(10px, env(safe-area-inset-top))", paddingBottom: "10px" }}>

          <button onClick={() => setOpen(false)}
            className="shrink-0 -ml-1 w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>

          {/* Аватар */}
          <div className="relative shrink-0">
            <img src={consultantAvatar} alt="Анастасия"
              className="w-10 h-10 rounded-full object-cover object-top" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-card rounded-full" />
          </div>

          {/* Инфо */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-foreground leading-none">Анастасия</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary font-semibold uppercase tracking-wide leading-none">АРЕНДА СИТИ</span>
            </div>
            <div className="mt-1 h-3.5 flex items-center">
              {isTyping ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                  <span className="inline-flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-[dot-pulse_1.4s_0s_infinite]" />
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-[dot-pulse_1.4s_0.2s_infinite]" />
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-[dot-pulse_1.4s_0.4s_infinite]" />
                  </span>
                  печатает…
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground">Консультант по недвижимости</span>
              )}
            </div>
          </div>

          {/* Звонок */}
          <a href="tel:+73952551234"
            className="shrink-0 flex items-center gap-1.5 px-3 h-8 bg-emerald-500 text-white text-[11px] font-semibold hover:bg-emerald-600 transition-colors">
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Позвонить</span>
          </a>
        </div>

        {/* ── MESSAGES ── */}
        <div ref={scrollRef}
          className="flex-1 overflow-y-auto min-h-0 px-3 py-3"
          style={{ background: "hsl(var(--muted)/0.2)" }}>
          <div className="space-y-0.5">
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              const prev = messages[i - 1];
              const next = messages[i + 1];
              const isFirstInGroup = !prev || prev.role !== m.role;
              const isLastInGroup = !next || next.role !== m.role;
              const mt = isFirstInGroup && i > 0 ? "mt-3" : "mt-0.5";

              return (
                <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"} ${mt}`}>
                  <div className={`relative max-w-[78%] px-3.5 pt-2 pb-1.5 text-[13px] leading-relaxed ${
                    isUser
                      ? "bg-primary/12 text-foreground"
                      : "bg-card text-foreground shadow-sm"
                  } ${isUser ? (
                      isFirstInGroup && isLastInGroup ? "rounded-2xl rounded-tr-sm"
                      : isFirstInGroup ? "rounded-2xl rounded-tr-sm rounded-br-sm"
                      : isLastInGroup ? "rounded-2xl rounded-tr-sm"
                      : "rounded-lg rounded-r-sm"
                    ) : (
                      isFirstInGroup && isLastInGroup ? "rounded-2xl rounded-tl-sm"
                      : isFirstInGroup ? "rounded-2xl rounded-tl-sm rounded-bl-sm"
                      : isLastInGroup ? "rounded-2xl rounded-tl-sm"
                      : "rounded-lg rounded-l-sm"
                    )
                  }`}>
                    {isUser
                      ? <div className="whitespace-pre-wrap">{m.content}</div>
                      : renderContent(m, i)
                    }
                    {/* Время + статус */}
                    <div className={`flex items-center gap-1 mt-0.5 ${isUser ? "justify-end" : "justify-end"}`}>
                      <span className="text-[10px] text-muted-foreground/60 leading-none">{m.time}</span>
                      {isUser && <MsgStatusIcon status={m.status} />}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing dots */}
            {loading && !messages.some((m) => m.typing) && (
              <div className="flex justify-start mt-3">
                <div className="bg-card px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-[dot-pulse_1.4s_0s_infinite]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-[dot-pulse_1.4s_0.2s_infinite]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-[dot-pulse_1.4s_0.4s_infinite]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── QUICK STARTERS ── */}
        {showStarters && (
          <div className="shrink-0 px-3 py-2 bg-card border-t border-border/40 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {STARTERS.map((s) => (
              <button key={s} onClick={() => send(s)}
                className="shrink-0 text-[11px] px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors whitespace-nowrap">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── INPUT ── */}
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="shrink-0 bg-card border-t border-border/60 flex items-center gap-2 px-3"
          style={{ paddingTop: "8px", paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
        >
          {/* Микрофон (заглушка — FAL AI позже) */}
          <button
            type="button"
            title="Голосовой ввод — скоро"
            className="shrink-0 w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors opacity-60"
            onClick={() => toast({ title: "Голосовой ввод", description: "Скоро появится через FAL AI" })}
          >
            <Mic className="w-4.5 h-4.5" />
          </button>

          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              stage === "ask_name" ? "Введите ваше имя…"
              : stage === "ask_phone" ? "Номер телефона (или пропустить)…"
              : "Сообщение…"
            }
            disabled={loading || isTyping}
            className="flex-1 px-4 py-2.5 bg-muted rounded-full text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50 min-w-0"
          />

          <button
            type="submit"
            disabled={loading || isTyping || !input.trim()}
            className="shrink-0 w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity disabled:opacity-30"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
        .bg-primary\/12 { background-color: hsl(var(--primary) / 0.12); }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
