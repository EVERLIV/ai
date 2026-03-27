import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const quickChips = ["Офис до 100 м²", "Склад в Подмосковье", "Земля под строительство"];

const SYSTEM_PROMPT =
  "Ты — профессиональный консультант по коммерческой недвижимости в России. Помогаешь клиентам подобрать объекты. Задавай уточняющие вопросы о бюджете, площади, локации, типе объекта, сроках. Отвечай кратко, по делу, по-русски.";

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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Mock response since Lovable Cloud is not enabled
    // When enabled, replace with real edge function call
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Для подключения реального ИИ-ассистента необходимо активировать Lovable Cloud. Пока что я работаю в демо-режиме. Расскажите подробнее о вашем запросе, и я постараюсь помочь!",
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
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] bg-card shadow-float flex flex-col border-l border-border">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-gold" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Коммерц ИИ</div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 status-pulse" />
                  онлайн
                </div>
              </div>
            </div>
            <button onClick={onToggle} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

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

          {/* Input */}
          <div className="px-4 py-3 border-t border-border">
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
          </div>
        </div>
      )}
    </>
  );
}
