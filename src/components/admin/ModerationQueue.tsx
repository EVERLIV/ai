import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useModerationQueue } from "@/hooks/useMyProperties";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Check, X, MapPin, Maximize2, User, Phone, Mail, Building2 } from "lucide-react";
import {
  REQUEST_TYPE_LABELS,
  REQUEST_TYPE_SHORT,
  type RequestType,
} from "@/lib/propertyModeration";

type QueueItem = {
  id: string;
  type: string;
  deal_type: string;
  area: number;
  price: number;
  address: string;
  district: string;
  cover_photo: string | null;
  description: string | null;
  request_type: RequestType | null;
  photos: string[] | null;
  submitter: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
};

export default function ModerationQueue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: queue = [], isLoading } = useModerationQueue();

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const approveMutation = useMutation({
    mutationFn: async (item: QueueItem) => {
      if (!user) throw new Error("Не авторизован");

      const submitter = item.submitter;
      const isFreeListing = item.request_type === "free_listing";

      const extras = {
        agent_name: submitter?.full_name || "Собственник",
        agent_company: "Собственник",
        agent_verified: true,
        agent_avatar_url: submitter?.avatar_url || "",
        owner_user_id: submitter?.id || "",
      };

      const { error } = await supabase.from("properties").update({
        moderation_status: "published",
        is_active: isFreeListing,
        moderated_at: new Date().toISOString(),
        moderated_by: user.id,
        published_date: new Date().toISOString(),
        rejection_reason: null,
        extras,
        client_id: submitter?.id || null,
      }).eq("id", item.id);

      if (error) throw error;

      if (item.request_type === "management") {
        await supabase.from("crm_leads").insert({
          object_id: item.id,
          name: submitter?.full_name || "Клиент",
          phone: submitter?.phone || "",
          email: submitter?.email || null,
          message: `Заявка на управление объектом: ${item.address}\n${item.description || ""}`,
          source: "management_request",
          business_category: item.address,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      toast({ title: "Объект одобрен" });
    },
    onError: (err: Error) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!user) throw new Error("Не авторизован");
      const { error } = await supabase.from("properties").update({
        moderation_status: "rejected",
        is_active: false,
        rejection_reason: reason,
        moderated_at: new Date().toISOString(),
        moderated_by: user.id,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
      queryClient.invalidateQueries({ queryKey: ["my-properties"] });
      setRejectId(null);
      setRejectReason("");
      toast({ title: "Объект отклонён" });
    },
    onError: (err: Error) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Загрузка очереди…</div>;
  }

  if (queue.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Очередь модерации пуста</p>
        <p className="text-xs text-muted-foreground mt-1">Новые заявки от пользователей появятся здесь</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {(queue as QueueItem[]).map((item) => (
          <div key={item.id} className="border border-border rounded-lg overflow-hidden bg-card">
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-48 h-36 lg:h-auto bg-muted shrink-0">
                {item.cover_photo ? (
                  <img src={item.cover_photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="flex-1 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {item.request_type && (
                    <Badge variant={item.request_type === "free_listing" ? "default" : "secondary"}>
                      {REQUEST_TYPE_SHORT[item.request_type]}
                    </Badge>
                  )}
                  <Badge variant="outline">{REQUEST_TYPE_LABELS[item.request_type || "free_listing"]}</Badge>
                  <span className="text-xs text-muted-foreground">{item.type} · {item.deal_type}</span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">{item.address}</div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.district}</span>
                    <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{item.area} м²</span>
                    {Number(item.price) > 0 && (
                      <span>{Number(item.price).toLocaleString("ru-RU")} ₽</span>
                    )}
                  </div>
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                )}

                {item.submitter && (
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                      {item.submitter.full_name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0 text-xs space-y-0.5">
                      <div className="flex items-center gap-1 font-semibold text-foreground">
                        <User className="w-3 h-3" /> {item.submitter.full_name}
                      </div>
                      {item.submitter.phone && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" /> {item.submitter.phone}
                        </div>
                      )}
                      {item.submitter.email && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3 h-3" /> {item.submitter.email}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={() => approveMutation.mutate(item)} disabled={approveMutation.isPending}>
                    <Check className="w-4 h-4 mr-1" /> Подтвердить
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setRejectId(item.id)}>
                    <X className="w-4 h-4 mr-1" /> Отклонить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!rejectId} onOpenChange={(o) => { if (!o) { setRejectId(null); setRejectReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонить объект</DialogTitle>
            <DialogDescription>Укажите причину — пользователь увидит её в личном кабинете.</DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-xs mb-1 block">Причина отклонения</Label>
            <Textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Например: недостаточно фотографий, неточный адрес…"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Отмена</Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={() => rejectId && rejectMutation.mutate({ id: rejectId, reason: rejectReason.trim() })}
            >
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
