import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, X, PhoneCall, Mic, Check, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";

const SUPABASE_URL = "https://api.arendacity.com";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4ODQyOTQwLCJleHAiOjE5MzY1MjI5NDB9.uK1BksB1rl0vNAlUc2nVpkqECeiWD9CKx0rIfHUlyWA";

type Status = "sent" | "read";
type Msg = { role: "user" | "assistant"; content: string; time: string; status?: Status };
type Stage = "ask_name" | "ask_phone" | "chat";

const ts = () => new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const STARTERS = ["Офисы до 100К/мес", "Склад с пандусом", "Условия аренды", "Аналоги объектов"];

interface Props { propertyId?: string; propertyAddress?: string; }

export default function PropertyAIChat({ propertyId, propertyAddress }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [wiggle, setWiggle] = useState(false);
  const [stage, setStage] = useState<Stage>("ask_name");
  const [userName, setUserName] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [thinking, setThinking] = useState(false); // три точки
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);

  // Wiggle
  useEffect(() => {
    if (open) return;
    const t1 = setTimeout(() => setWiggle(true), 4000);
    const iv = setInterval(() => setWiggle(true), 12000);
    return () => { clearTimeout(t1); clearInterval(iv); };
  }, [open]);
  useEffect(() => {
    if (!wiggle) return;
    const t = setTimeout(() => setWiggle(false), 800);
    return () => clearTimeout(t);
  }, [wiggle]);

  // Global open
  useEffect(() => {
    const h = () => setOpen(true);
    window.addEventListener("open-consultant-chat", h);
    return () => window.removeEventListener("open-consultant-chat", h);
  }, []);

  // Focus on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 350);
  }, [open]);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking]);

  // Greeting on first open
  useEffect(() => {
    if (!open || initialized.current) return;
    initialized.current = true;
    // Пауза → показываем точки → пауза → показываем сообщение
    const delay = 900;
    setTimeout(() => {
      setThinking(true);
      setTimeout(() => {
        setThinking(false);
        setMsgs([{
          role: "assistant",
          time: ts(),
          content: propertyAddress
            ? `Здравствуйте! Я Анастасия, консультант АРЕНДА СИТИ.\nПомогу с вопросами по объекту «${propertyAddress}».\n\nКак вас зовут?`
            : "Здравствуйте! Я Анастасия, консультант АРЕНДА СИТИ.\nПомогу подобрать офис, склад или торговое помещение.\n\nКак вас зовут?",
        }]);
      }, 1400);
    }, delay);
  }, [open]); // eslint-disable-line

  // Показать ответ ассистента с паузой (имитация набора)
  const replyAfterPause = useCallback((text: string, pauseMs = 1200) => {
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setMsgs((p) => {
        // Mark all user msgs as read
        const updated = p.map((m) => m.role === "user" ? { ...m, status: "read" as Status } : m);
        return [...updated, { role: "assistant", content: text, time: ts() }];
      });
    }, pauseMs);
  }, []);

  const sendAI = async (history: Msg[], name: string) => {
    setLoading(true);
    setThinking(true);
    const systemNote = name ? `Пользователя зовут ${name}. Обращайся к нему по имени.` : "";
    let result = "";

    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          propertyId, systemNote,
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("bad response");

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
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (c) result += c;
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch {
      toast({ title: "Ошибка сети", variant: "destructive" });
    } finally {
      setLoading(false);
      setThinking(false);
      if (result) {
        setMsgs((p) => {
          const updated = p.map((m) => m.role === "user" ? { ...m, status: "read" as Status } : m);
          return [...updated, { role: "assistant", content: result, time: ts() }];
        });
      }
    }
  };

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || loading || thinking) return;
    setInput("");

    const userMsg: Msg = { role: "user", content: t, time: ts(), status: "sent" };

    if (stage === "ask_name") {
      setUserName(t);
      setMsgs((p) => [...p, userMsg]);
      setStage("ask_phone");
      replyAfterPause(`Приятно познакомиться, ${t}! 😊\n\nОставите номер телефона? Так смогу перезвонить — это необязательно.`);
      return;
    }

    if (stage === "ask_phone") {
      setMsgs((p) => [...p, userMsg]);
      setStage("chat");
      const isSkip = /^(нет|пропустить|skip|не хочу|—|-|\.+)$/i.test(t);
      replyAfterPause(isSkip
        ? `Хорошо! Спрашивайте — отвечу на любой вопрос по недвижимости.`
        : `Записала! Чем могу помочь, ${userName}?`
      );
      return;
    }

    const next = [...msgs, userMsg];
    setMsgs(next);
    await sendAI(next, userName);
  };

  const showStarters = stage === "chat" && !loading && !thinking && msgs.filter((m) => m.role === "user").length <= 1;

  return (
    <>
      {/* ── BUBBLE ── */}
      <div className={`fixed right-4 bottom-24 z-40 transition-all duration-300 ${open ? "opacity-0 pointer-events-none scale-90" : "opacity-100 scale-100"}`}>
        <button onClick={() => setOpen(true)} aria-label="Открыть чат"
          className={`flex flex-col items-center gap-1.5 group ${wiggle ? "animate-[tab-wiggle_0.8s_ease-in-out]" : ""}`}>
          <div className="relative w-12 h-12 bg-card border border-border shadow-lg flex items-center justify-center">
            <img src={consultantAvatar} alt="Анастасия" className="w-10 h-10 object-cover object-top" />
            <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-card rounded-full" />
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">1</span>
          </div>
          <div className="flex items-center gap-0.5 bg-card border border-border px-2.5 py-1 shadow-sm">
            <span className="w-1 h-1 bg-muted-foreground/60 animate-[dot-pulse_1.4s_0s_infinite]" />
            <span className="w-1 h-1 bg-muted-foreground/60 animate-[dot-pulse_1.4s_0.2s_infinite]" />
            <span className="w-1 h-1 bg-muted-foreground/60 animate-[dot-pulse_1.4s_0.4s_infinite]" />
          </div>
        </button>
      </div>

      {/* Backdrop мобайл */}
      {open && <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setOpen(false)} />}

      {/* ── PANEL ── */}
      <div className={`
        fixed z-50 flex flex-col overflow-hidden
        inset-x-0 bottom-0 h-[100dvh]
        md:inset-x-auto md:right-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto
        md:w-[370px] md:h-[min(600px,88vh)]
        md:border-l md:border-y md:border-border
        md:shadow-[-16px_0_48px_-8px_rgba(0,0,0,0.12)]
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none md:opacity-0 md:translate-y-[-46%]"}
      `} style={{ background: "hsl(var(--background))" }}>

        {/* HEADER */}
        <div
          className="shrink-0 flex items-center gap-3 px-4 bg-card border-b border-border"
          style={{ paddingTop: "max(14px, env(safe-area-inset-top))", paddingBottom: "14px" }}
        >
          {/* Close */}
          <button onClick={() => setOpen(false)}
            className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>

          {/* Avatar with online dot */}
          <div className="relative shrink-0">
            <img src={consultantAvatar} alt="" className="w-10 h-10 rounded-full object-cover object-top shadow-sm" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-card rounded-full" />
          </div>

          {/* Name + subtitle */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight truncate">Анастасия</p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5">
              {thinking ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600">
                  <span className="inline-flex gap-[3px]">
                    {[0, 0.2, 0.4].map((d) => (
                      <span key={d} className="w-1 h-1 rounded-full bg-emerald-500"
                        style={{ animation: `dot-pulse 1.4s ${d}s infinite` }} />
                    ))}
                  </span>
                  печатает…
                </span>
              ) : (
                "Консультант"
              )}
            </p>
          </div>

          {/* Call */}
          <a href="tel:+73952551234"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-medium px-3 h-8 transition-colors">
            <PhoneCall className="w-3.5 h-3.5" />
            Позвонить
          </a>
        </div>

        {/* MESSAGES */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 px-3 py-4"
          style={{ background: "hsl(var(--muted)/0.15)" }}>
          <div className="flex flex-col gap-1">

            {msgs.map((m, i) => {
              const isUser = m.role === "user";
              const prev = msgs[i - 1];
              const next = msgs[i + 1];
              const firstInGroup = !prev || prev.role !== m.role;
              const lastInGroup = !next || next.role !== m.role;
              const mt = firstInGroup && i > 0 ? "mt-3" : "mt-0.5";

              // Bubble shape: скругление как в Telegram — угол у «хвоста»
              const radius = isUser
                ? `rounded-2xl ${firstInGroup ? "rounded-tr-sm" : ""}`
                : `rounded-2xl ${firstInGroup ? "rounded-tl-sm" : ""}`;

              const bg = isUser
                ? "bg-primary/[0.13] text-foreground"
                : "bg-card text-foreground shadow-sm border border-border/30";

              return (
                <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"} ${mt}`}>
                  <div className={`max-w-[78%] px-3.5 pt-2 pb-1.5 ${radius} ${bg}`}>
                    {/* Контент */}
                    <div className="text-[13px] leading-relaxed">
                      {isUser ? (
                        <span className="whitespace-pre-wrap">{m.content}</span>
                      ) : (
                        <div className="prose prose-sm max-w-none prose-p:my-0.5 prose-p:leading-relaxed prose-ul:my-1 prose-li:my-0 prose-strong:font-semibold">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                    {/* Время + статус — прижаты к правому нижнему краю */}
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px] leading-none text-muted-foreground/50 select-none">{m.time}</span>
                      {isUser && (
                        m.status === "read"
                          ? <CheckCheck className="w-3 h-3 text-sky-500 shrink-0" />
                          : <Check className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing dots */}
            {thinking && (
              <div className="flex justify-start mt-3">
                <div className="bg-card border border-border/30 shadow-sm px-4 py-3 rounded-2xl rounded-tl-sm inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-[dot-pulse_1.4s_0s_infinite]" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-[dot-pulse_1.4s_0.2s_infinite]" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-[dot-pulse_1.4s_0.4s_infinite]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* QUICK STARTERS */}
        {showStarters && (
          <div className="shrink-0 px-3 py-2 bg-card border-t border-border/40 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {STARTERS.map((s) => (
              <button key={s} onClick={() => send(s)}
                className="shrink-0 text-[11px] px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors whitespace-nowrap">
                {s}
              </button>
            ))}
          </div>
        )}

        {/* INPUT */}
        <form onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="shrink-0 bg-card border-t border-border/60 flex items-center gap-2 px-3"
          style={{ paddingTop: "8px", paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
          <button type="button"
            onClick={() => toast({ title: "Голосовой ввод", description: "Скоро появится через FAL AI" })}
            className="shrink-0 w-9 h-9 flex items-center justify-center text-muted-foreground/60 hover:text-primary transition-colors">
            <Mic className="w-5 h-5" />
          </button>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              stage === "ask_name" ? "Введите ваше имя…"
              : stage === "ask_phone" ? "Номер (или пропустить)…"
              : "Сообщение…"
            }
            disabled={loading || thinking}
            className="flex-1 px-4 py-2.5 bg-muted rounded-full text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50 min-w-0"
          />
          <button type="submit" disabled={loading || thinking || !input.trim()}
            className="shrink-0 w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity disabled:opacity-30">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes tab-wiggle {
          0%,100% { transform: scale(1); }
          20% { transform: scale(1.06) rotate(-2deg); }
          50% { transform: scale(1.04) rotate(1.5deg); }
          80% { transform: scale(1.02) rotate(-1deg); }
        }
        @keyframes dot-pulse {
          0%,80%,100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </>
  );
}
