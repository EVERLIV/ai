import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, Sparkles, Loader2, RotateCcw, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: propertyAddress
        ? `Здравствуйте! Я ИИ-консультант **АРЕНДА СИТИ**. Помогу с вопросами по объекту _${propertyAddress}_ и подбором других вариантов. Что вас интересует?`
        : "Здравствуйте! Я ИИ-консультант **АРЕНДА СИТИ**. Помогу подобрать офис, склад, торговое помещение или землю. Что вас интересует?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const reset = () => {
    setMessages([
      {
        role: "assistant",
        content: "Начнём заново. Чем помочь?",
      },
    ]);
  };

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
        if (last?.role === "assistant" && last.content !== "" && prev.length > next.length) {
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
          toast({ title: "Сервис временно недоступен", description: "Закончились кредиты ИИ.", variant: "destructive" });
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
    <div className="bg-card border border-border flex flex-col h-[520px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30 shrink-0">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">ИИ-консультант</div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> онлайн · АРЕНДА СИТИ
          </div>
        </div>
        <button
          onClick={reset}
          title="Начать заново"
          className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3 py-2 text-[13px] leading-relaxed ${
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
            <div className="bg-muted px-3 py-2 text-[13px] text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" /> печатает…
            </div>
          </div>
        )}
      </div>

      {/* Starters */}
      {messages.length <= 1 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0">
          {STARTERS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-[11px] px-2.5 py-1 border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
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
          className="p-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <Phone className="w-4 h-4" />
        </a>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напишите сообщение…"
          disabled={loading}
          className="flex-1 px-3 py-2 bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2 bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
