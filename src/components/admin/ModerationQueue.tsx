import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Check,
  Mail,
  MapPin,
  Maximize2,
  Phone,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useModerationQueue } from "@/hooks/useMyProperties";
import { supabase } from "@/integrations/supabase/client";
import {
  adminInsertCrmLead,
  adminUpdateProperty,
  countPublishedBySubmitter,
} from "@/lib/adminModeration";
import {
  fetchAgencyByIdApi,
  fetchAgencyManagersApi,
  fetchMembershipApi,
} from "@/lib/agencyApi";
import { fetchMyDeveloperApi } from "@/lib/developerApi";
import { buildDeveloperListingExtras } from "@/lib/developerListing";
import { notifyPropertyEmail } from "@/lib/notifyPropertyEmail";
import {
  REQUEST_TYPE_LABELS,
  REQUEST_TYPE_SHORT,
  type RequestType,
} from "@/lib/propertyModeration";
import {
  formatPropertyTypesLabel,
  getPropertyTypes,
} from "@/lib/propertyTypes";

type QueueItem = {
  id: string;
  public_id?: string | null;
  type: string;
  deal_type: string;
  area: number;
  price: number;
  address: string;
  district: string;
  floor?: string | number | null;
  deposit?: string | null;
  contract_term?: string | null;
  extras?: Record<string, unknown> | null;
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
    account_type?: "owner" | "realtor" | "agency" | "developer";
    agency_name?: string | null;
    agency_about?: string | null;
    agency_staff_count?: number | null;
    verification_status?: "unverified" | "pending" | "verified" | "rejected";
  } | null;
};

export default function ModerationQueue() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    data: queue = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useModerationQueue();

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const approveMutation = useMutation({
    mutationFn: async (item: QueueItem) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const moderatorId = session?.user?.id ?? user?.id ?? null;

      const submitter = item.submitter;
      const isFreeListing = item.request_type === "free_listing";
      const membership = submitter?.id
        ? await fetchMembershipApi(submitter.id)
        : null;
      const agencyId =
        membership?.agency_id ||
        (item as { agency_id?: string | null }).agency_id ||
        null;

      let agency: Awaited<ReturnType<typeof fetchAgencyByIdApi>> | null = null;
      if (agencyId) {
        try {
          agency = await fetchAgencyByIdApi(agencyId);
        } catch {
          agency = null;
        }
      }

      const isAgency =
        !!agency ||
        submitter?.account_type === "agency" ||
        submitter?.account_type === "realtor";

      let developer: Awaited<ReturnType<typeof fetchMyDeveloperApi>> = null;
      if (submitter?.account_type === "developer" && submitter.id) {
        try {
          developer = await fetchMyDeveloperApi(submitter.id);
        } catch {
          developer = null;
        }
      }
      const isDeveloper = !!developer;

      const isVerified = isDeveloper
        ? developer?.verification_status === "verified"
        : agency
          ? agency.verification_status === "verified"
          : submitter?.verification_status === "verified";

      const listingManagerId = (item as { listing_manager_id?: string | null })
        .listing_manager_id;
      let manager: {
        full_name: string;
        phone: string;
        photo_url: string | null;
      } | null = null;
      if (agencyId && listingManagerId) {
        const managers = await fetchAgencyManagersApi(agencyId);
        const found = managers.find((m) => m.id === listingManagerId);
        if (found) manager = found;
      }

      let objectsCount = 0;
      if (submitter?.id) {
        objectsCount = await countPublishedBySubmitter(submitter.id);
        if (isFreeListing) objectsCount += 1;
      }

      const prevExtras =
        item.extras && typeof item.extras === "object" && !Array.isArray(item.extras)
          ? (item.extras as Record<string, unknown>)
          : {};

      const agentExtras = isDeveloper && developer
        ? buildDeveloperListingExtras(developer, {
            ownerUserId: submitter?.id,
            objectsCount,
          })
        : {
            agent_name:
              manager?.full_name || submitter?.full_name || "Собственник",
            agent_company: isAgency
              ? agency?.name || submitter?.agency_name || "Агентство"
              : "Собственник",
            agent_verified: isVerified,
            agent_avatar_url:
              manager?.photo_url ||
              agency?.logo_url ||
              submitter?.avatar_url ||
              "",
            agent_account_type: isAgency ? "agency" : "owner",
            agent_objects_count: objectsCount,
            agent_agency_about: agency?.about || submitter?.agency_about || "",
            agent_phone: manager?.phone || submitter?.phone || "",
            agency_id: agencyId || "",
            listing_manager_id: listingManagerId || "",
            owner_user_id: submitter?.id || "",
          };

      const extras = {
        ...prevExtras,
        ...agentExtras,
      };

      await adminUpdateProperty(item.id, {
        moderation_status: "published",
        is_active: isFreeListing,
        moderated_at: new Date().toISOString(),
        moderated_by: moderatorId,
        published_date: new Date().toISOString(),
        rejection_reason: null,
        extras,
        client_id: submitter?.id || null,
        ...(agencyId ? { agency_id: agencyId } : {}),
        ...(isDeveloper && developer
          ? { developer_id: developer.id }
          : {}),
      });

      if (item.request_type === "management") {
        await adminInsertCrmLead({
          object_id: item.id,
          name: submitter?.full_name || "Клиент",
          phone: submitter?.phone || "",
          email: submitter?.email || null,
          message: `Заявка на управление объектом: ${item.address}\n${item.description || ""}`,
          source: "management_request",
          business_category: item.address,
        });
      }

      if (submitter?.email) {
        await notifyPropertyEmail({
          event: "approved",
          to: submitter.email,
          name: submitter.full_name,
          property: {
            id: item.id,
            public_id: item.public_id,
            address: item.address,
            district: item.district,
            type: formatPropertyTypesLabel(getPropertyTypes(item)),
            deal_type: item.deal_type,
            area: item.area,
            price: item.price,
            floor: item.floor,
            deposit: item.deposit,
            contract_term: item.contract_term,
            request_type: item.request_type,
            description: item.description,
          },
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
      toast({
        title: "Ошибка",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({
      id,
      reason,
      agencyId,
      address,
    }: {
      id: string;
      reason: string;
      agencyId?: string | null;
      address?: string;
    }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const moderatorId = session?.user?.id ?? user?.id ?? null;

      await adminUpdateProperty(id, {
        moderation_status: "rejected",
        is_active: false,
        rejection_reason: reason,
        moderated_at: new Date().toISOString(),
        moderated_by: moderatorId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
      queryClient.invalidateQueries({ queryKey: ["my-properties"] });
      setRejectId(null);
      setRejectReason("");
      toast({ title: "Объект отклонён" });
    },
    onError: (err: Error) => {
      toast({
        title: "Ошибка",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Загрузка очереди…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 border border-dashed border-destructive/40 rounded-lg bg-destructive/5">
        <p className="text-sm font-medium text-destructive">
          Не удалось загрузить очередь
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
          {(error as Error)?.message ||
            "Проверьте миграции moderation_status и RLS"}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => refetch()}
        >
          Повторить
        </Button>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">
          Очередь модерации пуста
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Новые заявки от пользователей появятся здесь
        </p>
        <p className="text-[10px] text-muted-foreground/70 mt-2">
          Убедитесь, что выполнен SQL: self_hosted_client_properties.sql
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {(queue as QueueItem[]).map((item) => (
          <div
            key={item.id}
            className="border border-border rounded-lg overflow-hidden bg-card"
          >
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-48 h-36 lg:h-auto bg-muted shrink-0">
                {item.cover_photo ? (
                  <img
                    src={item.cover_photo}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="flex-1 p-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {item.request_type && (
                    <Badge
                      variant={
                        item.request_type === "free_listing"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {REQUEST_TYPE_SHORT[item.request_type]}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {REQUEST_TYPE_LABELS[item.request_type || "free_listing"]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatPropertyTypesLabel(getPropertyTypes(item))} ·{" "}
                    {item.deal_type}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    {item.address}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    {item.public_id && (
                      <span className="font-mono font-bold text-primary">
                        {item.public_id}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {item.district}
                    </span>
                    <span className="flex items-center gap-1">
                      <Maximize2 className="w-3 h-3" />
                      {item.area} м²
                    </span>
                    {Number(item.price) > 0 && (
                      <span>
                        {Number(item.price).toLocaleString("ru-RU")} ₽
                      </span>
                    )}
                  </div>
                </div>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">
                    {item.description}
                  </p>
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
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(item)}
                    disabled={authLoading || approveMutation.isPending}
                  >
                    <Check className="w-4 h-4 mr-1" /> Подтвердить
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectId(item.id)}
                    disabled={authLoading || rejectMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-1" /> Отклонить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={!!rejectId}
        onOpenChange={(o) => {
          if (!o) {
            setRejectId(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонить объект</DialogTitle>
            <DialogDescription>
              Укажите причину — пользователь увидит её в личном кабинете.
            </DialogDescription>
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
            <Button variant="outline" onClick={() => setRejectId(null)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={() => {
                if (!rejectId) return;
                const item = queue.find((q) => q.id === rejectId);
                const extras = (item?.extras || {}) as Record<string, unknown>;
                const agencyId = (extras.agency_id as string) || null;
                rejectMutation.mutate({
                  id: rejectId,
                  reason: rejectReason.trim(),
                  agencyId,
                  address: item?.address,
                });
              }}
            >
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
