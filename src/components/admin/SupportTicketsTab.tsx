import {
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  ACCOUNT_TYPE_LABELS,
  type ProfileAccountType,
} from "@/hooks/useProfile";
import {
  countOpenSupportTickets,
  formatSupportTicketDate,
  useAdminReplySupportTicket,
  useAdminSupportTicketMessages,
  useAdminSupportTickets,
  useAdminUpdateSupportTicketStatus,
} from "@/hooks/useSupportTickets";
import { SUPPORT_TICKET_STATUS_LABELS } from "@/config/supportCategories";
import type { SupportTicketWithProfile } from "@/lib/supportApi";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "open", label: "Новый" },
  { value: "in_progress", label: "В работе" },
  { value: "answered", label: "Ответ дан" },
  { value: "closed", label: "Закрыт" },
];

function TicketDetail({
  ticket,
  onClose,
}: {
  ticket: SupportTicketWithProfile;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: messages = [], isLoading } = useAdminSupportTicketMessages(
    ticket.id,
  );
  const replyMutation = useAdminReplySupportTicket();
  const statusMutation = useAdminUpdateSupportTicketStatus();
  const [reply, setReply] = useState("");

  const userLabel =
    ticket.profiles?.full_name?.trim() ||
    ticket.profiles?.email ||
    ticket.user_id.slice(0, 8);

  const accountLabel =
    ticket.account_type &&
    ACCOUNT_TYPE_LABELS[ticket.account_type as ProfileAccountType]
      ? ACCOUNT_TYPE_LABELS[ticket.account_type as ProfileAccountType]
      : ticket.account_type || "—";

  const handleReply = async () => {
    try {
      await replyMutation.mutateAsync({
        ticketId: ticket.id,
        body: reply,
        staffId: user?.id,
      });
      setReply("");
      toast({ title: "Ответ отправлен" });
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось отправить",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-primary/30">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-sm">
                {ticket.ticket_number}
              </span>
              {ticket.status === "open" && (
                <Badge className="text-[10px]">Новый</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {userLabel} · {ticket.profiles?.email || "—"} · {accountLabel}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {ticket.category} ·{" "}
              {formatSupportTicketDate(ticket.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={ticket.status}
              onValueChange={(status) =>
                statusMutation.mutate(
                  { ticketId: ticket.id, status },
                  {
                    onSuccess: () => toast({ title: "Статус обновлён" }),
                    onError: () =>
                      toast({
                        title: "Ошибка статуса",
                        variant: "destructive",
                      }),
                  },
                )
              }
            >
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        </div>

        <div className="space-y-2 max-h-[280px] overflow-y-auto border border-border p-2 bg-muted/10">
          {isLoading ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Загрузка…
            </p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "text-xs px-2.5 py-2 border",
                  msg.author_type === "staff"
                    ? "bg-primary/5 border-primary/20 ml-4"
                    : "bg-card border-border mr-4",
                )}
              >
                <div className="flex justify-between gap-2 mb-1 text-[10px] text-muted-foreground">
                  <span className="font-medium uppercase">
                    {msg.author_type === "staff" ? "Поддержка" : "Пользователь"}
                  </span>
                  <span>{formatSupportTicketDate(msg.created_at)}</span>
                </div>
                <p className="whitespace-pre-wrap">{msg.body}</p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-2">
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Ответ пользователю (виден в личном кабинете)…"
            rows={3}
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={handleReply}
            disabled={replyMutation.isPending || reply.trim().length < 2}
          >
            {replyMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 mr-1.5" />
            )}
            Ответить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SupportTicketsTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<SupportTicketWithProfile | null>(
    null,
  );

  const {
    data: tickets = [],
    isLoading,
    refetch,
    isFetching,
  } = useAdminSupportTickets();

  const openCount = countOpenSupportTickets(tickets);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Тикеты поддержки
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Обращения из личного кабинета. Новых: {openCount}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Все
              </SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Обновить
          </Button>
        </div>
      </div>

      {selected && (
        <TicketDetail ticket={selected} onClose={() => setSelected(null)} />
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Загрузка…
        </p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Тикетов пока нет
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filtered.map((ticket) => {
            const meta = SUPPORT_TICKET_STATUS_LABELS[ticket.status];
            return (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelected(ticket)}
                className={cn(
                  "text-left border bg-card px-4 py-3 hover:bg-muted/30 transition-colors",
                  ticket.status === "open" && "border-primary/40",
                  selected?.id === ticket.id && "ring-1 ring-primary/40",
                )}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">
                      {ticket.ticket_number}
                    </span>
                    {meta && (
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 border",
                          meta.className,
                        )}
                      >
                        {meta.label}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {formatSupportTicketDate(ticket.created_at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {ticket.profiles?.email || "—"} · {ticket.category}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
