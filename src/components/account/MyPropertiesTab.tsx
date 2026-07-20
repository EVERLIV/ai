import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, MapPin, Maximize2, ChevronRight, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMyProperties } from "@/hooks/useMyProperties";
import PropertySubmissionWizard from "@/components/account/PropertySubmissionWizard";
import {
  MODERATION_STATUS_LABELS,
  REQUEST_TYPE_LABELS,
  getModerationBadgeVariant,
  type ModerationStatus,
  type RequestType,
} from "@/lib/propertyModeration";

export default function MyPropertiesTab() {
  const { data: properties = [], isLoading } = useMyProperties();
  const [wizardOpen, setWizardOpen] = useState(false);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="font-display text-xl font-bold text-foreground">Мои объекты</h2>
        <Button onClick={() => setWizardOpen(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Добавить объект за 0 ₽
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-card border border-border p-12 text-center text-sm text-muted-foreground">
          Загрузка…
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-card border border-border p-12 text-center">
          <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Объектов пока нет</p>
          <p className="text-xs text-muted-foreground mb-4">
            Добавьте объект бесплатно — мы проверим и опубликуем его в каталоге
          </p>
          <Button onClick={() => setWizardOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Добавить объект за 0 ₽
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => {
            const status = (p.moderation_status || "on_moderation") as ModerationStatus;
            const requestType = p.request_type as RequestType | null;
            const isPublished = status === "published" && p.is_active;

            return (
              <div key={p.id} className="flex gap-4 bg-card border border-border p-4">
                <div className="w-24 h-20 bg-muted shrink-0 overflow-hidden">
                  {p.cover_photo ? (
                    <img src={p.cover_photo} alt={p.address} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant={getModerationBadgeVariant(status)}>
                      {MODERATION_STATUS_LABELS[status]}
                    </Badge>
                    {requestType && (
                      <Badge variant="outline" className="text-[10px]">
                        {REQUEST_TYPE_LABELS[requestType]}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">{p.type} · {p.deal_type}</span>
                  </div>
                  <div className="text-sm font-semibold text-foreground truncate">{p.address}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.district}</span>
                    <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{p.area} м²</span>
                  </div>
                  {status === "rejected" && p.rejection_reason && (
                    <p className="text-xs text-destructive mt-1.5">Причина: {p.rejection_reason}</p>
                  )}
                  {Number(p.price) > 0 && (
                    <div className="mt-1.5 text-sm font-bold text-foreground">
                      {Number(p.price).toLocaleString("ru-RU")} ₽
                      {p.deal_type === "Аренда" && <span className="text-xs font-normal text-muted-foreground">/мес</span>}
                    </div>
                  )}
                </div>
                {isPublished && (
                  <Link to={`/property/${p.id}`} className="self-center shrink-0 text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                    Открыть <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      <PropertySubmissionWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
