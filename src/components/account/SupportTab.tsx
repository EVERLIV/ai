import {
  CheckCircle2,
  ChevronRight,
  Copy,
  LifeBuoy,
  Loader2,
  Mail,
  Send,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import {
  formatSupportTicketDate,
  useCreateSupportTicket,
  useMySupportTickets,
  useSupportTicketMessages,
} from "@/hooks/useSupportTickets";
import {
  getSupportCategories,
  SUPPORT_TICKET_STATUS_LABELS,
} from "@/config/supportCategories";
import { CONTACTS } from "@/config/company";
import type { SupportTicket } from "@/lib/supportApi";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: string }) {
  const meta = SUPPORT_TICKET_STATUS_LABELS[status] || {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "inline-flex text-[10px] font-medium px-1.5 py-0.5 border",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

function TicketThread({ ticketId }: { ticketId: string }) {
  const { data: messages = [], isLoading } = useSupportTicketMessages(ticketId);

  if (isLoading) {
    return (
      <p className="text-xs text-muted-foreground py-3 flex items-center gap-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Загрузка…
      </p>
    );
  }

  return (
    <div className="space-y-2 pt-2 border-t border-border mt-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "text-xs leading-relaxed px-2.5 py-2 border",
            msg.author_type === "staff"
              ? "bg-primary/5 border-primary/20"
              : "bg-muted/30 border-border",
          )}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-medium text-[10px] uppercase tracking-wide text-muted-foreground">
              {msg.author_type === "staff" ? "Поддержка" : "Вы"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatSupportTicketDate(msg.created_at)}
            </span>
          </div>
          <p className="text-foreground whitespace-pre-wrap">{msg.body}</p>
        </div>
      ))}
    </div>
  );
}

function TicketRow({
  ticket,
  active,
  onSelect,
}: {
  ticket: SupportTicket;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left px-3 py-2.5 border transition-colors",
        active
          ? "border-foreground/30 bg-muted/40"
          : "border-border bg-card hover:bg-muted/20",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-mono font-semibold text-foreground">
          {ticket.ticket_number}
        </span>
        <StatusBadge status={ticket.status} />
      </div>
      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
        {ticket.category}
      </p>
      <p className="text-[10px] text-muted-foreground/80 mt-0.5">
        {formatSupportTicketDate(ticket.created_at)}
      </p>
    </button>
  );
}

export default function SupportTab() {
  const { toast } = useToast();
  const { data: profile } = useProfile();
  const categories = useMemo(
    () => getSupportCategories(profile?.account_type),
    [profile?.account_type],
  );

  const { data: tickets = [], isLoading, isError, error } = useMySupportTickets();
  const createMutation = useCreateSupportTicket();

  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [createdTicket, setCreatedTicket] = useState<SupportTicket | null>(
    null,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedTicket =
    tickets.find((t) => t.id === selectedId) ||
    (createdTicket?.id === selectedId ? createdTicket : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      toast({ title: "Выберите тип обращения", variant: "destructive" });
      return;
    }
    try {
      const ticket = await createMutation.mutateAsync({ category, message });
      setCreatedTicket(ticket);
      setSelectedId(ticket.id);
      setCategory("");
      setMessage("");
      toast({
        title: "Обращение создано",
        description: `Номер: ${ticket.ticket_number}`,
      });
    } catch (err) {
      toast({
        title: "Не удалось создать обращение",
        description: err instanceof Error ? err.message : "Ошибка",
        variant: "destructive",
      });
    }
  };

  const copyNumber = async (num: string) => {
    try {
      await navigator.clipboard.writeText(num);
      toast({ title: "Номер скопирован" });
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-primary" strokeWidth={1.75} />
            Поддержка
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Создайте обращение — ответ появится здесь. Срочно:{" "}
            <a
              href={`mailto:${CONTACTS.email}`}
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              <Mail className="w-3 h-3" />
              {CONTACTS.email}
            </a>
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-4 items-start">
        <div className="space-y-4">
          {createdTicket && (
            <div className="border border-emerald-200 bg-emerald-50/50 px-4 py-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Обращение зарегистрировано
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="font-mono text-sm font-bold">
                      {createdTicket.ticket_number}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        copyNumber(createdTicket.ticket_number)
                      }
                      className="text-[10px] text-primary hover:underline inline-flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Копировать
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Сохраните номер. Ответ поддержки появится в переписке ниже.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="border border-border bg-card p-4 space-y-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Новое обращение
            </p>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Тип проблемы
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Выберите из списка…" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c} className="text-sm">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Описание
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Опишите проблему или идею…"
                rows={4}
                className="text-sm resize-y min-h-[96px]"
                required
                minLength={5}
              />
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
              className="h-9"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5 mr-1.5" />
              )}
              Создать обращение
            </Button>
          </form>

          {selectedTicket && (
            <div className="border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-mono text-sm font-bold">
                    {selectedTicket.ticket_number}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedTicket.category}
                  </p>
                </div>
                <StatusBadge status={selectedTicket.status} />
              </div>
              <TicketThread ticketId={selectedTicket.id} />
            </div>
          )}
        </div>

        <aside className="border border-border bg-card">
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Мои обращения
            </p>
          </div>
          <div className="p-2 space-y-1.5 max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Загрузка…
              </p>
            ) : isError ? (
              <p className="text-xs text-destructive py-4 text-center px-2 leading-relaxed">
                Не удалось загрузить обращения.{" "}
                {error instanceof Error &&
                (error.message.includes("404") ||
                  error.message.includes("does not exist"))
                  ? "Раздел поддержки ещё настраивается на сервере."
                  : (
                    <>
                      Попробуйте позже или напишите на{" "}
                      <a
                        href={`mailto:${CONTACTS.email}`}
                        className="underline"
                      >
                        {CONTACTS.email}
                      </a>
                    </>
                  )}
              </p>
            ) : tickets.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center px-2">
                Обращений пока нет
              </p>
            ) : (
              tickets.map((t) => (
                <TicketRow
                  key={t.id}
                  ticket={t}
                  active={selectedId === t.id}
                  onSelect={() => setSelectedId(t.id)}
                />
              ))
            )}
          </div>
          <div className="px-3 py-2 border-t border-border text-[10px] text-muted-foreground">
            <ChevronRight className="w-3 h-3 inline opacity-50" /> выберите
            обращение для просмотра ответа
          </div>
        </aside>
      </div>
    </div>
  );
}
