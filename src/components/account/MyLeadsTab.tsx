import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Phone,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAgencyManagers, useMyAgency } from "@/hooks/useAgency";
import {
  type LeadPropertyInfo,
  type LeadsDateRange,
  useMyLeadsInbox,
} from "@/hooks/useMyLeads";
import { formatPropertyAddressShort } from "@/lib/propertyCard";
import {
  type CabinetLeadRow,
  updateLeadStatusApi,
} from "@/lib/userPropertyApi";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;
const GROUP_PAGE = 20;

type StatusFilter = "all" | "new" | "in_progress" | "done" | "spam";
type SortKey = "newest" | "oldest" | "object" | "manager";
type ViewMode = "list" | "object";

const DATE_OPTIONS: { key: LeadsDateRange; label: string }[] = [
  { key: "today", label: "Сегодня" },
  { key: "7d", label: "7 дней" },
  { key: "30d", label: "30 дней" },
  { key: "all", label: "Все" },
];

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "new", label: "Новые" },
  { key: "in_progress", label: "В работе" },
  { key: "done", label: "Закрыты" },
];

const STATUS_LABELS: Record<string, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Закрыта",
  spam: "Спам",
};

const DIRECT_SOURCE_LABELS: Record<string, string> = {
  realtor_contact: "Страница риелтора",
  agency_contact: "Страница агентства",
  developer_contact: "Страница застройщика",
};

function directLeadLabel(lead: CabinetLeadRow): string {
  return (
    lead.business_category?.trim() ||
    DIRECT_SOURCE_LABELS[lead.source] ||
    "Прямой контакт"
  );
}

function leadStatus(lead: CabinetLeadRow): string {
  return lead.status || "new";
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (sameDay) return time;
  return `${d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })} ${time}`;
}

function LeadRow({
  lead,
  property,
  expanded,
  onToggle,
  onStatus,
}: {
  lead: CabinetLeadRow;
  property?: LeadPropertyInfo;
  expanded: boolean;
  onToggle: () => void;
  onStatus: (status: string) => void;
}) {
  const status = leadStatus(lead);
  const isNew = status === "new";
  const address = property
    ? formatPropertyAddressShort(property.address) || property.address || "Объект"
    : directLeadLabel(lead);
  const managerLabel = property?.managerName
    || (lead.manager_id ? "Риелтор" : lead.agency_id ? "Агентство" : "—");

  return (
    <div
      className={cn(
        "border-b border-border/60 last:border-b-0",
        isNew && "bg-primary/[0.04]",
      )}
    >
      <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 min-h-9">
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            isNew ? "bg-primary" : "bg-transparent",
          )}
          aria-hidden
        />
        <span className="w-[72px] sm:w-[88px] shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {formatWhen(lead.created_at)}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 min-w-0 text-left flex items-center gap-2"
        >
          <span className="w-[28%] min-w-0 truncate text-xs font-medium text-foreground">
            {lead.name || "Без имени"}
          </span>
          <span className="hidden md:block w-[22%] min-w-0 truncate text-xs text-muted-foreground">
            {managerLabel}
          </span>
          <span className="flex-1 min-w-0 truncate text-xs text-muted-foreground">
            {address}
          </span>
        </button>
        {lead.phone ? (
          <a
            href={`tel:${lead.phone}`}
            className="hidden sm:inline-flex shrink-0 text-xs text-primary hover:underline tabular-nums max-w-[120px] truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {lead.phone}
          </a>
        ) : (
          <span className="hidden sm:block w-[80px] shrink-0" />
        )}
        <Select value={status} onValueChange={onStatus}>
          <SelectTrigger
            className={cn(
              "h-6 w-[92px] px-2 text-[11px] shrink-0",
              isNew && "border-primary/40 text-primary",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={onToggle}
          className="w-6 h-6 flex items-center justify-center text-muted-foreground shrink-0"
          aria-label={expanded ? "Свернуть" : "Подробнее"}
        >
          <ChevronDown
            className={cn("w-3.5 h-3.5 transition-transform", expanded && "rotate-180")}
          />
        </button>
      </div>
      {expanded && (
        <div className="px-3 sm:px-4 pb-2.5 pl-8 sm:pl-12 text-xs flex flex-col gap-1.5">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
            {lead.phone && (
              <a href={`tel:${lead.phone}`} className="text-primary hover:underline inline-flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {lead.phone}
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="hover:underline">
                {lead.email}
              </a>
            )}
            {property && (
              <Link to={`/property/${property.id}`} className="text-primary hover:underline">
                Карточка объекта
              </Link>
            )}
          </div>
          {lead.message && (
            <p className="text-foreground leading-relaxed whitespace-pre-wrap bg-muted/40 rounded px-2 py-1.5">
              {lead.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyLeadsTab() {
  const queryClient = useQueryClient();
  const { data: myAgency } = useMyAgency();
  const { data: managers = [] } = useAgencyManagers(myAgency?.agency.id, true);
  const [dateRange, setDateRange] = useState<LeadsDateRange>("today");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("new");
  const [managerId, setManagerId] = useState("all");
  const [objectQuery, setObjectQuery] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<ViewMode>("list");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const listTopRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useMyLeadsInbox(dateRange);
  const leads = data?.leads || [];
  const properties = data?.properties || {};

  const managerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of managers) map.set(m.id, m.full_name);
    return map;
  }, [managers]);

  const propertyWithManager = useMemo(() => {
    const next: Record<string, LeadPropertyInfo> = {};
    for (const [id, p] of Object.entries(properties)) {
      next[id] = {
        ...p,
        managerName:
          p.managerName ||
          (p.listing_manager_id
            ? managerNameById.get(p.listing_manager_id) || null
            : null),
      };
    }
    return next;
  }, [properties, managerNameById]);

  const managersInLeads = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of Object.values(propertyWithManager)) {
      if (p.listing_manager_id && p.managerName) {
        seen.set(p.listing_manager_id, p.managerName);
      }
    }
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1], "ru"));
  }, [propertyWithManager]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const oq = objectQuery.trim().toLowerCase();
    const rows = leads.filter((lead) => {
      const status = leadStatus(lead);
      if (statusFilter !== "all" && status !== statusFilter) return false;
      const prop = lead.object_id ? propertyWithManager[lead.object_id] : undefined;
      if (managerId !== "all") {
        if (lead.object_id) {
          if (prop?.listing_manager_id !== managerId) return false;
        } else if (lead.manager_id !== managerId) {
          return false;
        }
      }
      if (oq) {
        const addr = lead.object_id
          ? (prop?.address || "").toLowerCase()
          : directLeadLabel(lead).toLowerCase();
        if (!addr.includes(oq)) return false;
      }
      if (q) {
        const hay = [
          lead.name,
          lead.phone,
          lead.email,
          lead.message,
          prop?.address,
          !lead.object_id ? directLeadLabel(lead) : null,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    rows.sort((a, b) => {
      if (sort === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sort === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      const pa = a.object_id ? propertyWithManager[a.object_id] : undefined;
      const pb = b.object_id ? propertyWithManager[b.object_id] : undefined;
      if (sort === "object") {
        const aa = pa?.address || directLeadLabel(a);
        const bb = pb?.address || directLeadLabel(b);
        return aa.localeCompare(bb, "ru");
      }
      const ma = pa?.managerName || (a.manager_id ? "Риелтор" : "");
      const mb = pb?.managerName || (b.manager_id ? "Риелтор" : "");
      return ma.localeCompare(mb, "ru");
    });
    return rows;
  }, [
    leads,
    propertyWithManager,
    statusFilter,
    managerId,
    objectQuery,
    search,
    sort,
  ]);

  const newCount = useMemo(
    () => leads.filter((l) => leadStatus(l) === "new").length,
    [leads],
  );

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { property?: LeadPropertyInfo; items: CabinetLeadRow[] }
    >();
    for (const lead of filtered) {
      const key = lead.object_id || `direct:${lead.id}`;
      const cur = map.get(key) || {
        property: lead.object_id ? propertyWithManager[lead.object_id] : undefined,
        items: [],
      };
      cur.items.push(lead);
      map.set(key, cur);
    }
    return [...map.entries()];
  }, [filtered, propertyWithManager]);

  const pageSize = view === "object" ? GROUP_PAGE : PAGE_SIZE;
  const totalPages = Math.max(
    1,
    Math.ceil(
      (view === "object" ? grouped.length : filtered.length) / pageSize,
    ),
  );
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageLeads = filtered.slice(start, start + pageSize);
  const pageGroups = grouped.slice(start, start + pageSize);

  useEffect(() => {
    setPage(1);
  }, [dateRange, statusFilter, managerId, objectQuery, search, sort, view]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await updateLeadStatusApi(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-leads"] });
      queryClient.invalidateQueries({ queryKey: ["my-leads-new-count"] });
    },
  });

  const goToPage = (next: number) => {
    setPage(next);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const onStatus = (id: string, status: string) => {
    statusMutation.mutate({ id, status });
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Мои заявки
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isLoading
              ? "Загрузка…"
              : `${filtered.length} из ${leads.length}${newCount ? ` · новых ${newCount}` : ""}`}
          </p>
        </div>
        <div className="flex rounded border border-border overflow-hidden shrink-0">
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "h-7 px-2.5 text-xs",
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            Список
          </button>
          <button
            type="button"
            onClick={() => setView("object")}
            className={cn(
              "h-7 px-2.5 text-xs border-l border-border",
              view === "object"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground",
            )}
          >
            По объектам
          </button>
        </div>
      </div>

      <div ref={listTopRef} className="flex flex-col gap-2 mb-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Имя, телефон, адрес…"
            className="pl-8 pr-8"
            aria-label="Поиск заявок"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
              aria-label="Очистить"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1">
          {STATUS_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={cn(
                "shrink-0 h-7 px-2.5 rounded text-xs",
                statusFilter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {DATE_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setDateRange(key)}
              className={cn(
                "h-7 px-2.5 rounded text-xs border",
                dateRange === key
                  ? "border-primary text-primary bg-primary/5"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
          <Input
            value={objectQuery}
            onChange={(e) => setObjectQuery(e.target.value)}
            placeholder="Объект"
            className="w-[140px] sm:w-[180px]"
            aria-label="Фильтр по объекту"
          />
          <Select value={managerId} onValueChange={setManagerId}>
            <SelectTrigger className="w-[150px] sm:w-[180px] text-xs">
              <SelectValue placeholder="Менеджер" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Все менеджеры
              </SelectItem>
              {managersInLeads.map(([id, name]) => (
                <SelectItem key={id} value={id} className="text-xs">
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest" className="text-xs">
                Сначала новые
              </SelectItem>
              <SelectItem value="oldest" className="text-xs">
                Сначала старые
              </SelectItem>
              <SelectItem value="object" className="text-xs">
                По объекту
              </SelectItem>
              <SelectItem value="manager" className="text-xs">
                По менеджеру
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card rounded-lg h-40 animate-pulse" />
      ) : leads.length === 0 ? (
        <div className="bg-card rounded-lg px-4 py-12 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            Заявок пока нет
          </p>
          <p className="text-xs text-muted-foreground">
            Новые заявки по объектам появятся здесь списком
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-lg px-4 py-10 text-center">
          <p className="text-sm font-medium mb-1">Ничего не найдено</p>
          <p className="text-xs text-muted-foreground mb-3">
            Смените период, статус или поиск
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setObjectQuery("");
              setManagerId("all");
              setStatusFilter("all");
              setDateRange("7d");
            }}
          >
            Сбросить
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-lg overflow-hidden border border-border/60">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border/60">
              <span className="w-1.5" />
              <span className="w-[88px]">Время</span>
              <span className="w-[28%]">Клиент</span>
              <span className="w-[22%]">Менеджер</span>
              <span className="flex-1">Объект</span>
              <span className="w-[120px]">Телефон</span>
              <span className="w-[92px]">Статус</span>
              <span className="w-6" />
            </div>

            {view === "list"
              ? pageLeads.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    property={
                      lead.object_id
                        ? propertyWithManager[lead.object_id]
                        : undefined
                    }
                    expanded={expandedId === lead.id}
                    onToggle={() =>
                      setExpandedId((id) => (id === lead.id ? null : lead.id))
                    }
                    onStatus={(status) => onStatus(lead.id, status)}
                  />
                ))
              : pageGroups.map(([key, group]) => {
                  const addr =
                    formatPropertyAddressShort(group.property?.address) ||
                    group.property?.address ||
                    "Без объекта";
                  const open = openGroups[key] ?? false;
                  const groupNew = group.items.filter(
                    (l) => leadStatus(l) === "new",
                  ).length;
                  return (
                    <div key={key} className="border-b border-border last:border-b-0">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenGroups((s) => ({ ...s, [key]: !open }))
                        }
                        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-muted/40 hover:bg-muted/60 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate">{addr}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {group.property?.managerName || "Без менеджера"}
                          </div>
                        </div>
                        <span className="flex items-center gap-1.5 shrink-0">
                          {groupNew > 0 && (
                            <span className="min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-4 text-center">
                              {groupNew}
                            </span>
                          )}
                          <span className="text-[11px] tabular-nums text-muted-foreground">
                            {group.items.length}
                          </span>
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 text-muted-foreground transition-transform",
                              open && "rotate-180",
                            )}
                          />
                        </span>
                      </button>
                      {open &&
                        group.items.map((lead) => (
                          <LeadRow
                            key={lead.id}
                            lead={lead}
                            property={group.property}
                            expanded={expandedId === lead.id}
                            onToggle={() =>
                              setExpandedId((id) =>
                                id === lead.id ? null : lead.id,
                              )
                            }
                            onStatus={(status) => onStatus(lead.id, status)}
                          />
                        ))}
                    </div>
                  );
                })}
          </div>

          {(view === "object" ? grouped.length : filtered.length) > pageSize && (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {start + 1}–
                {Math.min(
                  start + pageSize,
                  view === "object" ? grouped.length : filtered.length,
                )}{" "}
                из {view === "object" ? grouped.length : filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={safePage <= 1}
                  onClick={() => goToPage(safePage - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs tabular-nums px-2">
                  {safePage} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0"
                  disabled={safePage >= totalPages}
                  onClick={() => goToPage(safePage + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
