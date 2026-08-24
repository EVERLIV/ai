import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Maximize2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PropertySubmissionWizard from "@/components/account/PropertySubmissionWizard";
import PropertyImage from "@/components/PropertyImage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { PropertySegment } from "@/config/propertySegments";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { type MyProperty, useMyProperties } from "@/hooks/useMyProperties";
import { formatPropertyAddressShort } from "@/lib/propertyCard";
import {
  canCancelProperty,
  canEditProperty,
  MODERATION_STATUS_LABELS,
  type ModerationStatus,
  REQUEST_TYPE_LABELS,
  type RequestType,
} from "@/lib/propertyModeration";
import {
  deleteMyPropertyApi,
  updateMyPropertyApi,
} from "@/lib/userPropertyApi";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

type StatusFilter =
  | "all"
  | "published"
  | "on_moderation"
  | "draft"
  | "archived";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "published", label: "В каталоге" },
  { key: "on_moderation", label: "На проверке" },
  { key: "draft", label: "Черновики" },
  { key: "archived", label: "Архив" },
];

const STATUS_STYLES: Record<ModerationStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  on_moderation:
    "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  published:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground",
  archived:
    "bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400",
};

function matchesStatus(p: MyProperty, filter: StatusFilter): boolean {
  const status = (p.moderation_status || "draft") as ModerationStatus;
  if (filter === "all") return true;
  if (filter === "published") return status === "published" && p.is_active;
  if (filter === "on_moderation") return status === "on_moderation";
  if (filter === "draft") return status === "draft" || status === "rejected";
  return status === "archived" || status === "cancelled";
}

function matchesSearch(p: MyProperty, query: string): boolean {
  if (!query) return true;
  const hay = [
    p.address,
    p.district,
    p.type,
    p.deal_type,
    p.public_id,
    p.id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(query);
}

function getPageNumbers(
  current: number,
  total: number,
): Array<number | "ellipsis"> {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("ellipsis");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

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
  onArchive,
  onDelete,
}: {
  property: MyProperty;
  onEdit: (p: MyProperty) => void;
  onCancel: (p: MyProperty) => void;
  onArchive: (p: MyProperty) => void;
  onDelete: (p: MyProperty) => void;
}) {
  const status = (p.moderation_status || "draft") as ModerationStatus;
  const requestType = p.request_type as RequestType | null;
  const isPublished = status === "published" && p.is_active;
  const displayId = p.public_id || p.id.slice(0, 8).toUpperCase();
  const title = formatPropertyAddressShort(p.address) || p.address || "Адрес не указан";
  const canEdit = canEditProperty(status);
  const canCancel = canCancelProperty(status);
  const canDelete =
    status === "cancelled" || status === "archived" || status === "draft";
  const hasMenu = isPublished || canCancel || canDelete;

  return (
    <article className="bg-card rounded-lg overflow-hidden">
      <div className="flex gap-0">
        <div className="relative w-[92px] sm:w-[140px] h-[92px] sm:h-auto sm:min-h-[124px] shrink-0 bg-muted">
          <PropertyImage
            src={p.cover_photo || (p.photos?.[0] ?? null)}
            alt={p.address}
            className="absolute inset-0"
            imgClassName="object-cover"
            placeholderLabel="Нет фото"
          />
          <span className="absolute top-1.5 left-1.5 font-mono text-[9px] font-bold tracking-wide bg-black/65 text-white px-1.5 py-0.5 rounded">
            {displayId}
          </span>
        </div>

        <div className="flex-1 min-w-0 p-2.5 sm:p-3.5 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                {title}
              </h3>
              {p.district && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{p.district}</span>
                </p>
              )}
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] sm:text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{p.type}</span>
            <span className="flex items-center gap-0.5">
              <Maximize2 className="w-3 h-3" />
              {p.area} м²
            </span>
            <span className="font-semibold text-foreground">
              {formatPrice(p)}
            </span>
            {p.deal_type && (
              <span className="text-muted-foreground">{p.deal_type}</span>
            )}
          </div>

          {requestType && (
            <p className="text-[10px] text-muted-foreground">
              {REQUEST_TYPE_LABELS[requestType]}
            </p>
          )}

          {status === "rejected" && p.rejection_reason && (
            <p className="text-[10px] text-destructive line-clamp-2 bg-destructive/5 rounded px-2 py-1">
              {p.rejection_reason}
            </p>
          )}

          <div className="flex items-center gap-1.5 mt-auto pt-1">
            {canEdit && (
              <Button
                size="sm"
                className="h-8 text-xs gap-1 px-2.5"
                onClick={() => onEdit(p)}
              >
                <Pencil className="w-3.5 h-3.5" />
                Изменить
              </Button>
            )}
            {isPublished && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 sm:w-auto sm:px-2.5 text-xs gap-1"
              >
                <Link to={`/property/${p.id}`} aria-label="Открыть на сайте">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">На сайте</span>
                </Link>
              </Button>
            )}
            {hasMenu && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 ml-auto"
                    aria-label="Ещё действия"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {canCancel && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onCancel(p)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-2" />
                      Отменить заявку
                    </DropdownMenuItem>
                  )}
                  {isPublished && (
                    <DropdownMenuItem onClick={() => onArchive(p)}>
                      <Archive className="w-3.5 h-3.5 mr-2" />
                      В архив
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(p)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MyPropertiesTab({
  defaultSegment = "commercial",
  initialRequestType,
}: {
  defaultSegment?: PropertySegment;
  initialRequestType?: RequestType;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: properties = [], isLoading } = useMyProperties();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editProperty, setEditProperty] = useState<MyProperty | null>(null);
  const [wizardRequestType, setWizardRequestType] = useState<
    RequestType | undefined
  >(undefined);
  const [cancelTarget, setCancelTarget] = useState<MyProperty | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<MyProperty | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MyProperty | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const autoOpenedRef = useRef(false);
  const listTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialRequestType || autoOpenedRef.current) return;
    autoOpenedRef.current = true;
    setEditProperty(null);
    setWizardRequestType(initialRequestType);
    setWizardOpen(true);

    const params = new URLSearchParams(location.search);
    params.delete("request_type");
    const qs = params.toString();
    navigate(`/account${qs ? `?${qs}` : ""}#properties`, { replace: true });
  }, [initialRequestType, location.search, navigate]);

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: properties.length,
      published: 0,
      on_moderation: 0,
      draft: 0,
      archived: 0,
    };
    for (const p of properties) {
      if (matchesStatus(p, "published")) counts.published += 1;
      if (matchesStatus(p, "on_moderation")) counts.on_moderation += 1;
      if (matchesStatus(p, "draft")) counts.draft += 1;
      if (matchesStatus(p, "archived")) counts.archived += 1;
    }
    return counts;
  }, [properties]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter(
      (p) => matchesStatus(p, statusFilter) && matchesSearch(p, q),
    );
  }, [properties, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const rangeFrom = filtered.length === 0 ? 0 : pageStart + 1;
  const rangeTo = Math.min(pageStart + PAGE_SIZE, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const goToPage = (next: number) => {
    setPage(next);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Не авторизован");
      await updateMyPropertyApi(user.id, id, {
        moderation_status: "cancelled",
        is_active: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setArchiveTarget(null);
      toast({ title: "Объект перемещён в архив" });
    },
    onError: (err: Error) => {
      toast({
        title: "Не удалось архивировать",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Не авторизован");
      await deleteMyPropertyApi(user.id, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-properties"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      setDeleteTarget(null);
      toast({ title: "Объект удалён" });
    },
    onError: (err: Error) => {
      toast({
        title: "Не удалось удалить",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Не авторизован");
      await updateMyPropertyApi(user.id, id, {
        moderation_status: "cancelled",
        is_active: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-properties"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-queue"] });
      setCancelTarget(null);
      toast({ title: "Заявка отменена" });
    },
    onError: (err: Error) => {
      toast({
        title: "Не удалось отменить",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const openNew = () => {
    setEditProperty(null);
    setWizardRequestType(undefined);
    setWizardOpen(true);
  };

  const openEdit = (property: MyProperty) => {
    setEditProperty(property);
    setWizardRequestType(undefined);
    setWizardOpen(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold text-foreground">
            Мои объекты
          </h2>
          {!isLoading && properties.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length === properties.length
                ? `${properties.length} объектов`
                : `${filtered.length} из ${properties.length}`}
            </p>
          )}
        </div>
        <Button onClick={openNew} size="sm" className="shrink-0">
          <Plus className="w-4 h-4 mr-1" />
          <span className="sm:hidden">Добавить</span>
          <span className="hidden sm:inline">Добавить объект за 0 ₽</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card rounded-lg h-[92px] sm:h-[124px] animate-pulse"
            />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-card rounded-lg p-12 sm:p-16 text-center">
          <Building2
            className="w-14 h-14 text-muted-foreground/40 mx-auto mb-6"
            strokeWidth={1.25}
          />
          <p className="font-display text-base font-semibold text-foreground mb-2 tracking-[0.01em]">
            Объектов пока нет
          </p>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
            Добавьте объект бесплатно — мы проверим и опубликуем его в каталоге
          </p>
          <Button
            onClick={openNew}
            variant="outline"
            className="rounded-md border-foreground/20 hover:bg-foreground hover:text-background"
          >
            <Plus className="w-4 h-4 mr-1.5" strokeWidth={1.75} /> Добавить
            объект за 0 ₽
          </Button>
        </div>
      ) : (
        <>
          <div ref={listTopRef} className="flex flex-col gap-3 mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Адрес, район, тип или ID…"
                className="h-7 pl-8 pr-9 text-sm"
                aria-label="Поиск объектов"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Очистить поиск"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
              {STATUS_FILTERS.map(({ key, label }) => {
                const active = statusFilter === key;
                const count = statusCounts[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatusFilter(key)}
                    className={cn(
                      "shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    {label}
                    <span
                      className={cn(
                        "tabular-nums text-[10px]",
                        active
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-card rounded-lg px-4 py-12 text-center">
              <p className="text-sm font-medium text-foreground mb-1">
                Ничего не найдено
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Измените поиск или сбросьте фильтр статуса
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
              >
                Сбросить
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pageItems.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  onEdit={openEdit}
                  onCancel={setCancelTarget}
                  onArchive={setArchiveTarget}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}

          {filtered.length > PAGE_SIZE && (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-muted-foreground text-center sm:text-left">
                {rangeFrom}–{rangeTo} из {filtered.length}
              </p>
              <div className="flex items-center justify-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={safePage <= 1}
                  onClick={() => goToPage(safePage - 1)}
                  aria-label="Предыдущая страница"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="hidden sm:flex items-center gap-1">
                  {getPageNumbers(safePage, totalPages).map((item, idx) =>
                    item === "ellipsis" ? (
                      <span
                        key={`e-${idx}`}
                        className="w-8 text-center text-xs text-muted-foreground"
                      >
                        …
                      </span>
                    ) : (
                      <Button
                        key={item}
                        type="button"
                        variant={item === safePage ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0 text-xs"
                        onClick={() => goToPage(item)}
                        aria-current={item === safePage ? "page" : undefined}
                      >
                        {item}
                      </Button>
                    ),
                  )}
                </div>
                <span className="sm:hidden text-xs text-muted-foreground px-2 tabular-nums">
                  {safePage} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={safePage >= totalPages}
                  onClick={() => goToPage(safePage + 1)}
                  aria-label="Следующая страница"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <PropertySubmissionWizard
        open={wizardOpen}
        onOpenChange={(o) => {
          setWizardOpen(o);
          if (!o) {
            setEditProperty(null);
            setWizardRequestType(undefined);
          }
        }}
        editProperty={editProperty}
        segment={
          editProperty?.segment === "residential"
            ? "residential"
            : defaultSegment
        }
        initialRequestType={wizardRequestType}
      />

      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(o) => {
          if (!o) setCancelTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отменить заявку?</AlertDialogTitle>
            <AlertDialogDescription>
              Объект {cancelTarget?.public_id || ""} ({cancelTarget?.address})
              будет снят с модерации. Вы сможете создать новую заявку позже.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Назад</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                cancelTarget && cancelMutation.mutate(cancelTarget.id)
              }
            >
              Отменить заявку
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!archiveTarget}
        onOpenChange={(o) => {
          if (!o) setArchiveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Архивировать объект?</AlertDialogTitle>
            <AlertDialogDescription>
              Объект {archiveTarget?.public_id || ""} ({archiveTarget?.address})
              будет скрыт из каталога. Вы сможете восстановить его позже.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Назад</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                archiveTarget && archiveMutation.mutate(archiveTarget.id)
              }
            >
              В архив
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить объект?</AlertDialogTitle>
            <AlertDialogDescription>
              Объект {deleteTarget?.public_id || ""} ({deleteTarget?.address})
              будет удалён безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Назад</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
