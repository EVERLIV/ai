import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, MessageSquare, Phone, RefreshCw } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { supabaseAdmin } from "@/integrations/supabase/adminClient";

type CrmLead = {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  source: string;
  status: string;
  business_category: string | null;
  object_id: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  contacts_page: "Контакты",
  price_offer: "Предложение цены",
  owner_message: "Вопрос по объекту",
  property_contact: "Форма на объекте",
  consultation_widget: "Виджет консультации",
  category_contact: "Заявка по категории",
  management_request: "Передача в управление",
  docs_bug_report: "Баг из документации",
  website: "Сайт",
  "ai-chat": "ИИ-чат",
};

const STATUS_OPTIONS = [
  { value: "new", label: "Новая" },
  { value: "in_progress", label: "В работе" },
  { value: "done", label: "Закрыта" },
  { value: "spam", label: "Спам" },
];

export default function CrmLeadsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const {
    data: leads = [],
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-crm-leads"],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.db.select(
        "crm_leads",
        "select=*&order=created_at.desc&limit=200",
      );
      if (error) {
        throw new Error(
          typeof error === "object" && error && "message" in error
            ? String((error as { message: string }).message)
            : "Ошибка загрузки заявок",
        );
      }
      return (data || []) as CrmLead[];
    },
    refetchInterval: 30_000,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabaseAdmin.db.update(
        "crm_leads",
        `id=eq.${id}`,
        { status },
      );
      if (error) {
        throw new Error(
          typeof error === "object" && error && "message" in error
            ? String((error as { message: string }).message)
            : "Ошибка обновления",
        );
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-crm-leads"] });
      toast({ title: "Статус обновлён" });
    },
    onError: () =>
      toast({ title: "Не удалось обновить статус", variant: "destructive" }),
  });

  const newCount = leads.filter((l) => l.status === "new").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Заявки с сайта</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Все формы → сюда и в Telegram. Новых: {newCount}
          </p>
        </div>
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

      {isLoading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          Загрузка…
        </p>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Заявок пока нет
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {leads.map((lead) => (
            <Card
              key={lead.id}
              className={
                lead.status === "new" ? "border-primary/40" : undefined
              }
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">
                        {lead.name || "Без имени"}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {SOURCE_LABELS[lead.source] || lead.source}
                      </Badge>
                      {lead.status === "new" && (
                        <Badge className="text-[10px]">Новая</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(lead.created_at).toLocaleString("ru-RU")}
                      {lead.business_category
                        ? ` · ${lead.business_category}`
                        : ""}
                    </p>
                  </div>
                  <Select
                    value={lead.status || "new"}
                    onValueChange={(status) =>
                      statusMutation.mutate({ id: lead.id, status })
                    }
                  >
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem
                          key={s.value}
                          value={s.value}
                          className="text-xs"
                        >
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap gap-3 text-xs">
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      {lead.phone}
                    </a>
                  )}
                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {lead.email}
                    </a>
                  )}
                </div>

                {lead.message && (
                  <div className="flex gap-2 text-xs text-foreground/90 bg-muted/40 p-2.5 rounded-md">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {lead.message}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
