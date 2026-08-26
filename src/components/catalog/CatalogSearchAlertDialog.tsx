import { Bell, Loader2, LogIn } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  COMMERCIAL_PROPERTY_TYPES,
  LAND_PROPERTY_TYPES,
  type PropertySegment,
  RESIDENTIAL_PROPERTY_TYPES,
} from "@/config/propertySegments";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  type SearchSubscriptionFilters,
  useMySearchSubscription,
  useUpsertSearchSubscription,
} from "@/lib/searchSubscriptions";

function typesForSegment(segment: PropertySegment): readonly string[] {
  if (segment === "residential") return RESIDENTIAL_PROPERTY_TYPES;
  if (segment === "land") return LAND_PROPERTY_TYPES;
  return COMMERCIAL_PROPERTY_TYPES;
}

export type CatalogSearchAlertFilters = SearchSubscriptionFilters & {
  propertyTypes?: string[];
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterSummary: string;
  resultsCount: number;
  segment?: PropertySegment;
  filters?: CatalogSearchAlertFilters;
}

export default function CatalogSearchAlertDialog({
  open,
  onOpenChange,
  filterSummary,
  resultsCount,
  segment = "commercial",
  filters,
}: Props) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: existing } = useMySearchSubscription();
  const upsert = useUpsertSearchSubscription();
  const { toast } = useToast();

  const availableTypes = useMemo(() => typesForSegment(segment), [segment]);
  const email =
    profile?.email?.trim() ||
    user?.email?.trim() ||
    existing?.email?.trim() ||
    "";

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [agree, setAgree] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fromFilters = filters?.propertyTypes?.filter(Boolean) || [];
    if (fromFilters.length) {
      setSelectedTypes(fromFilters);
      return;
    }
    if (existing?.property_types?.length) {
      setSelectedTypes(existing.property_types);
      return;
    }
    setSelectedTypes([]);
  }, [open, filters?.propertyTypes, existing?.property_types]);

  useEffect(() => {
    if (!open) setAgree(false);
  }, [open]);

  const authRedirect = useMemo(() => {
    if (typeof window === "undefined") return "/catalog";
    return window.location.pathname + window.location.search;
  }, [open]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!email.includes("@")) {
      toast({
        title: "Нет email в профиле",
        description: "Укажите email в личном кабинете.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedTypes.length) {
      toast({
        title: "Выберите типы объектов",
        description: "Отметьте хотя бы один тип для уведомлений.",
      });
      return;
    }
    if (!agree) {
      toast({ title: "Нужно согласие с правилами" });
      return;
    }

    const subFilters: SearchSubscriptionFilters = {
      segment: filters?.segment || segment,
      deal_type: filters?.deal_type || null,
      district: filters?.district || null,
      market: filters?.market?.length ? filters.market : undefined,
      price_min: filters?.price_min ?? null,
      price_max: filters?.price_max ?? null,
      area_min: filters?.area_min ?? null,
      area_max: filters?.area_max ?? null,
    };

    try {
      await upsert.mutateAsync({
        email,
        propertyTypes: selectedTypes,
        filters: subFilters,
        resultsSnapshot: resultsCount,
        rulesAcceptedAt: new Date().toISOString(),
      });
      toast({
        title: "Подписка сохранена",
        description: `Будем писать на ${email}, когда появятся подходящие объекты.`,
      });
      onOpenChange(false);
    } catch {
      toast({
        title: "Не удалось сохранить подписку",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Уведомить о новых объектах
          </DialogTitle>
          <DialogDescription>
            Сохраним типы и параметры поиска — пришлём письмо, когда появятся
            новые объявления.
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="space-y-4 pt-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Подписка доступна только авторизованным пользователям. Войдите,
              чтобы получать уведомления на email из профиля.
            </p>
            <Button asChild className="w-full gap-2">
              <Link
                to={`/auth?redirect=${encodeURIComponent(authRedirect)}`}
              >
                <LogIn className="w-4 h-4" />
                Войти
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="alert-email">Email для уведомлений</Label>
              <Input
                id="alert-email"
                type="email"
                value={email}
                readOnly
                className="bg-muted/40"
              />
              {!email.includes("@") && (
                <p className="text-[11px] text-destructive">
                  Добавьте email в{" "}
                  <Link to="/account" className="underline">
                    личном кабинете
                  </Link>
                  .
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Типы объектов</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-md border border-border p-2">
                {availableTypes.map((type) => (
                  <label
                    key={type}
                    className="flex items-center gap-2 text-xs cursor-pointer select-none"
                  >
                    <Checkbox
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Текущая выдача: {resultsCount} объектов. {filterSummary}
            </p>

            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <Checkbox
                checked={agree}
                onCheckedChange={(v) => setAgree(v === true)}
                className="mt-0.5"
              />
              <span className="text-[11px] leading-relaxed text-muted-foreground">
                Я согласен на обработку персональных данных в соответствии с{" "}
                <a
                  href="/privacy"
                  target="_blank"
                  className="text-primary hover:underline"
                  rel="noopener"
                >
                  политикой конфиденциальности
                </a>
                .
              </span>
            </label>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={upsert.isPending || !agree}
            >
              {upsert.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {existing?.is_active
                ? "Обновить подписку"
                : "Подписаться на обновления"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CatalogSearchAlertButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden xl:inline-flex items-center gap-1.5 h-7 px-[11px] rounded border border-border bg-card text-sm font-medium text-foreground hover:bg-muted/60 transition-colors shrink-0"
    >
      <Bell className="w-3.5 h-3.5 text-primary" />
      Уведомить о новых
    </button>
  );
}
