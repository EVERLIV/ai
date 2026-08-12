import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, X, PhoneCall, PhoneOff, Mic, Check, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useElevenLabsVoice } from "@/hooks/useElevenLabsVoice";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";
import { CONTACTS } from "@/config/company";

/** Edge-функция чата в облачном проекте Supabase. */
const CHAT_API_URL =
  import.meta.env.VITE_CHAT_API_URL ||
  "https://xbdwapunrlnxcuxjhaca.supabase.co/functions/v1/ai-chat";

type Status = "sent" | "read";
type Msg = { role: "user" | "assistant"; content: string; time: string; status?: Status };

const ts = () => new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

const STARTERS = ["Что есть в аренду?", "Офис до 50 000 ₽/мес", "Самое дешёвое помещение", "Условия аренды"];

/** Ответ, когда ИИ недоступен: не оставляем человека без реакции. */
const FALLBACK_REPLY =
  `Извините, не получается ответить прямо сейчас — сбой на нашей стороне.\n\n` +
  `Позвоните нам, поможем сразу: ${CONTACTS.phone}`;

interface Props { propertyId?: string; propertyAddress?: string; }

export default function PropertyAIChat({ propertyId, propertyAddress }: Props) {
  const { toast } = useToast();
  const {
    isVoiceMode,
    isConnecting,
    isSpeaking,
    transcripts,
    startVoiceCall,
    endVoiceCall,
  } = useElevenLabsVoice();
  const [open, setOpen] = useState(false);
  const [wiggle, setWiggle] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [thinking, setThinking] = useState(false); // три точки
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const initialized = useRef(false);
  /** Время открытия чата и последней отправки — простая защита от ботов. */
  const openedAt = useRef(0);
  const lastSentAt = useRef(0);

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
    if (!open) return;
    if (!openedAt.current) openedAt.current = Date.now();
    setTimeout(() => inputRef.current?.focus(), 350);
  }, [open]);

  // Scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking, transcripts, isVoiceMode]);

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
            ? `Здравствуйте! Я Анастасия, консультант АРЕНДА СИТИ.\nПомогу с вопросами по объекту «${propertyAddress}».\n\nЧто подсказать?`
            : "Здравствуйте! Я Анастасия, консультант АРЕНДА СИТИ.\nПомогу подобрать помещение в аренду — офис, склад или торговое.\n\nЧто ищете?",
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
    let result = "";

    try {
      const resp = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          propertyId,
          userName: name,
          // Honeypot: у людей поле остаётся пустым, боты его заполняют.
          website: honeypotRef.current?.value || "",
        }),
      });

      const data = (await resp.json().catch(() => ({}))) as { reply?: string; error?: string };
      if (!resp.ok) throw new Error(data.error || "bad response");
      result = data.reply || "";
    } catch (e) {
      const msg = e instanceof Error && e.message && e.message !== "bad response" ? e.message : "Ошибка сети";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setLoading(false);
      setThinking(false);
      setMsgs((p) => {
        const updated = p.map((m) => (m.role === "user" ? { ...m, status: "read" as Status } : m));
        // Пустой ответ — сбой сети или сервиса. Молчание выглядит так,
        // будто консультант проигнорировал вопрос: отвечаем и даём телефон.
        const content = result || FALLBACK_REPLY;
        return [...updated, { role: "assistant", content, time: ts() }];
      });
    }
  };

  const send = async (text: string) => {
    const t = text.trim().slice(0, 1000);
    if (!t || loading || thinking) return;

    // Бот отвечает мгновенно после открытия и шлёт сообщения очередью.
    const now = Date.now();
    if (openedAt.current && now - openedAt.current < 1500) return;
    if (now - lastSentAt.current < 700) return;
    lastSentAt.current = now;

    setInput("");

    const userMsg: Msg = { role: "user", content: t, time: ts(), status: "sent" };

    const next = [...msgs, userMsg];
    setMsgs(next);
    await sendAI(next, "");
  };

  const showStarters = !loading && !thinking && msgs.filter((m) => m.role === "user").length <= 1;

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
              {isVoiceMode ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isSpeaking ? "говорит…" : "слушает…"}
                </span>
              ) : thinking ? (
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

          {/* Call → ElevenLabs agent */}
          {isVoiceMode ? (
            <button
              type="button"
              onClick={() => void endVoiceCall()}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-medium px-3 h-8 transition-colors"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              Завершить
            </button>
          ) : (
            <button
              type="button"
              disabled={isConnecting}
              onClick={() => void startVoiceCall({ propertyId, propertyAddress })}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-medium px-3 h-8 transition-colors disabled:opacity-60"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              {isConnecting ? "Соединение…" : "Позвонить"}
            </button>
          )}
        </div>

        {/* VOICE MODE */}
        {isVoiceMode ? (
          <div className="flex-1 flex flex-col min-h-0">
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-2"
              style={{ background: "hsl(var(--muted)/0.15)" }}>
              {transcripts.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-10 px-4">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Mic className={`w-7 h-7 text-emerald-600 ${isSpeaking ? "" : "animate-pulse"}`} />
                  </div>
                  <p className="font-medium text-foreground">Говорите — консультант слушает</p>
                  <p className="text-xs mt-1">Агент видит актуальный каталог объектов АрендаСити</p>
                </div>
              )}
              {transcripts.map((t, i) => (
                <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed ${
                      t.role === "user"
                        ? "bg-primary/[0.13] text-foreground rounded-tr-sm"
                        : "bg-card text-foreground shadow-sm border border-border/30 rounded-tl-sm"
                    }`}
                  >
                    {t.content}
                  </div>
                </div>
              ))}
            </div>
            <div
              className="shrink-0 bg-card border-t border-border/60 flex flex-col items-center gap-2 px-3 py-3"
              style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
            >
              <button
                type="button"
                onClick={() => void endVoiceCall()}
                className="inline-flex items-center gap-2 rounded-full bg-destructive text-destructive-foreground px-5 py-2.5 text-sm font-medium"
              >
                <PhoneOff className="w-4 h-4" />
                Завершить звонок
              </button>
              <a href={`tel:${CONTACTS.phoneTel}`} className="text-[11px] text-muted-foreground hover:text-foreground">
                Или на номер {CONTACTS.phone}
              </a>
            </div>
          </div>
        ) : (
        <>
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
          <button
            type="button"
            onClick={() => void startVoiceCall({ propertyId, propertyAddress })}
            disabled={isConnecting}
            className="shrink-0 w-9 h-9 flex items-center justify-center text-muted-foreground/60 hover:text-emerald-600 transition-colors disabled:opacity-50"
            title="Позвонить ИИ-консультанту"
          >
            <Mic className="w-5 h-5" />
          </button>
          {/* Honeypot — скрыт от людей, виден ботам-автозаполнителям */}
          <input
            ref={honeypotRef}
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute w-px h-px opacity-0 -z-10 pointer-events-none"
          />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={1000}
            placeholder={
"Спросите про объекты…"
            }
            disabled={loading || thinking}
            className="flex-1 px-4 py-2.5 bg-muted rounded-full text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50 min-w-0"
          />
          <button type="submit" disabled={loading || thinking || !input.trim()}
            className="shrink-0 w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity disabled:opacity-30">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
        </>
        )}
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
