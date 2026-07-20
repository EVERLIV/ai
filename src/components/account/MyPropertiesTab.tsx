import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Building2, Pencil, XCircle, ExternalLink, MapPin, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMyProperties, type MyProperty } from "@/hooks/useMyProperties";
import PropertySubmissionWizard from "@/components/account/PropertySubmissionWizard";
import PropertyImage from "@/components/PropertyImage";
import {
  MODERATION_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  canEditProperty,
  canCancelProperty,
  type ModerationStatus,
  type RequestType,
} from "@/lib/propertyModeration";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<ModerationStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  on_moderation: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

function StatusBadge({ status }: { status: ModerationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
        STATUS_STYLES[status],
      )}
    >
      {MODERATION_STATUS_LABELS[status]}
    </span>
  );
}

function formatPrice(p: MyProperty): string {
  const price = Number(p.price);
  if (!price) return "Цена по запросу";
  return `${price.toLocaleString("ru-RU")} ₽${p.deal_type === "Аренда" ? "/мес" : ""}`;
}

function PropertyCard({
  property: p,
  onEdit,
  onCancel,
}: {
  property: MyProperty;
  onEdit: (p: MyProperty) => void;
  onCancel: (p: MyProperty) => void;
}) {
  const status = (p.moderation_status || "draft") as ModerationStatus;
  const requestType = p.request_type as RequestType | null;
  const isPublished = status === "published" && p.is_active;
  const displayId = p.public_id || p.id.slice(0, 8).toUpperCase();

  return (
    <article className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row">
        {/* Фото */}
        <div className="relative w-full sm:w-[140px] h-[140px] sm:h-auto sm:min-h-[120px] shrink-0 bg-muted">
          <PropertyImage
            src={p.cover_photo || (p.photos?.[0] ?? null)}
            alt={p.address}
            className="absolute inset-0"
            imgClassName="object-cover"
            placeholderLabel="Нет фото"
          />
          <span className="absolute top-2 left-2 font-mono text-[9px] font-bold tracking-wide bg-black/65 text-white px-1.5 py-0.5 rounded">
            {displayId}
          </span>
          {p.deal_type && (
            <span className="absolute bottom-2 left-2 text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
              {p.deal_type}
            </span>
          )}
        </div>

        {/* Контент */}
        <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                {p.address || "Адрес не указан"}
              </h3>
              {p.district && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{p.district}</span>
                </p>
              )}
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{p.type}</span>
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3 h-3" />
              {p.area} м²
            </span>
            <span className="font-semibold text-foreground">{formatPrice(p)}</span>
          </div>

          {requestType && (
            <p className="text-[10px] text-muted-foreground">{REQUEST_TYPE_LABELS[requestType]}</p>
          )}

          {status === "rejected" && p.rejection_reason && (
            <p className="text-[10px] text-destructive line-clamp-2 bg-destructive/5 rounded px-2 py-1">
              {p.rejection_reason}
            </p>
          )}

          {/* Действия */}
          <div className="flex items-center justify-end gap-1 mt-auto pt-2 border-t border-border/50">
            {isPublished && (
              <Button asChild variant="outline" size="sm" className="h-8 text-xs gap-1">
                <Link to={`/property/${p.id}`}>
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Открыть</span>
                </Link>
              </Button>
            )}
            {canEditProperty(status) && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => onEdit(p)}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Изменить</span>
              </Button>
            )}
            {canCancelProperty(status) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onCancel(p)}
              >
                <XCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Отменить</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MyPropertiesTab() {
  const { data: properties = [], isLoading } = useMyProperties();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editProperty, setEditProperty] = useState<MyProperty | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MyProperty | null>(null);

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("properties")
        .update({ moderation_status: "cancelled", is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-properties"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
      setCancelTarget(null);
      toast({ title: "Заявка отменена" });
    },
    onError: (err: Error) => {
      toast({ title: "Не удалось отменить", description: err.message, variant: "destructive" });
    },
  });

  const openNew = () => {
    setEditProperty(null);
    setWizardOpen(true);
  };

  const openEdit = (property: MyProperty) => {
    setEditProperty(property);
    setWizardOpen(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="font-display text-xl font-bold text-foreground">Мои объекты</h2>
        <Button onClick={openNew} size="sm" className="shrink-0">
          <Plus className="w-4 h-4 mr-1" /> Добавить объект за 0 ₽
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg h-[140px] animate-pulse" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 sm:p-12 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Объектов пока нет</p>
          <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
            Добавьте объект бесплатно — мы проверим и опубликуем его в каталоге
          </p>
          <Button onClick={openNew} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Добавить объект за 0 ₽
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              onEdit={openEdit}
              onCancel={setCancelTarget}
            />
          ))}
        </div>
      )}

      <PropertySubmissionWizard
        open={wizardOpen}
        onOpenChange={(o) => { setWizardOpen(o); if (!o) setEditProperty(null); }}
        editProperty={editProperty}
      />

      <AlertDialog open={!!cancelTarget} onOpenChange={(o) => { if (!o) setCancelTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отменить заявку?</AlertDialogTitle>
            <AlertDialogDescription>
              Объект {cancelTarget?.public_id || ""} ({cancelTarget?.address}) будет снят с модерации. Вы сможете создать новую заявку позже.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Назад</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => cancelTarget && cancelMutation.mutate(cancelTarget.id)}
            >
              Отменить заявку
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
