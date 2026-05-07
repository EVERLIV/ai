import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Loader2, X, MessageCircle, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";

type Msg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Какие офисы есть в центре до 100К?",
  "Помещение под кафе 80–150 м²",
  "Склад с пандусом от 500 м²",
  "Условия аренды и оплата",
];

interface Props {
  propertyId?: string;
  propertyAddress?: string;
}

export default function PropertyAIChat({ propertyId, propertyAddress }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Listen for global open event (from "Написать" CTA)
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-consultant-chat", handler);
    return () => window.removeEventListener("open-consultant-chat", handler);
  }, []);

  // When user opens chat: show "consultant connecting" then greeting
  useEffect(() => {
    if (!open) return;
    if (messages.length > 0) return;
    setConnecting(true);
    const t1 = setTimeout(() => {
      setConnecting(false);
      setMessages([
        {
          role: "assistant",
          content: propertyAddress
            ? `Здравствуйте! Меня зовут **Анастасия**, я ваш консультант **АРЕНДА СИТИ**. Помогу с вопросами по объекту _${propertyAddress}_ и подберу другие подходящие варианты. Что вас интересует?`
            : "Здравствуйте! Меня зовут **Анастасия**, я ваш консультант **АРЕНДА СИТИ**. Помогу подобрать офис, склад, торговое помещение или землю. Что вас интересует?",
        },
      ]);
    }, 1500);
    return () => clearTimeout(t1);
  }, [open, messages.length, propertyAddress]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, connecting, open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > next.length) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...next, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
          propertyId,
        }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          toast({ title: "Слишком много запросов", description: "Попробуйте через минуту.", variant: "destructive" });
        } else if (resp.status === 402) {
          toast({ title: "Сервис временно недоступен", description: "Попробуйте позже.", variant: "destructive" });
        } else {
          toast({ title: "Ошибка", description: "Не удалось получить ответ.", variant: "destructive" });
        }
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
            if (c) upsert(c);
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Ошибка сети", description: "Проверьте подключение.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating launcher: square tab, right-middle */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Консультация"
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-primary text-primary-foreground shadow-elegant hover:opacity-95 transition-all flex flex-col items-center justify-center gap-2 w-14 py-5 rounded-l-xl"
        >
          <MessageCircle className="w-5 h-5" />
          <span
            className="text-[11px] font-semibold tracking-wide uppercase"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            Консультация
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed z-50 bg-card border-border shadow-elegant flex flex-col overflow-hidden animate-in duration-200 inset-0 sm:inset-auto sm:right-5 sm:top-1/2 sm:-translate-y-1/2 sm:w-[380px] sm:h-[min(600px,90vh)] sm:border sm:rounded-2xl slide-in-from-right-4">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30 shrink-0">
            <div className="relative">
              <img
                src={consultantAvatar}
                alt="Анастасия"
                width={40}
                height={40}
                loading="lazy"
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground">Анастасия</div>
              <div className="text-[11px] text-muted-foreground">Ваш консультант · АРЕНДА СИТИ</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              title="Свернуть"
              className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0 bg-background/40">
            {connecting && (
              <div className="flex justify-start">
                <div className="bg-muted px-3 py-2 rounded-lg text-[13px] text-muted-foreground inline-flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Консультант подключается…
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg text-[13px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-strong:text-foreground">
                      <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-muted px-3 py-2 rounded-lg text-[13px] text-muted-foreground inline-flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> печатает…
                </div>
              </div>
            )}
          </div>

          {/* Starters */}
          {!connecting && messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
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
            <a
              href="tel:+73952000000"
              title="Позвонить"
              className="p-2 rounded-lg text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="w-4 h-4" />
            </a>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напишите сообщение…"
              disabled={loading || connecting}
              className="flex-1 px-3 py-2 rounded-lg bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || connecting || !input.trim()}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
