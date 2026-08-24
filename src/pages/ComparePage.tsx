import { useQuery } from "@tanstack/react-query";
import { Columns2, Plus, Trash2, X } from "lucide-react";
import { Fragment } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import PropertyImage from "@/components/PropertyImage";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useAuth } from "@/hooks/useAuth";
import { useCompareProperties } from "@/hooks/useCompareProperties";
import type { DbProperty } from "@/hooks/useProperties";
import { supabasePublic } from "@/integrations/supabase/client";
import {
  buildPropertyDisplayTitle,
  formatPropertyPrice,
} from "@/lib/propertyCard";
import {
  bestValueIndexes,
  buildCompareRows,
  COMPARE_MAX,
  type CompareRow,
} from "@/lib/propertyCompare";
import { cn } from "@/lib/utils";

const KEY_ROW_KEYS = new Set(["price", "price_m2", "area"]);

/** Фиксированная высота шапки объекта — все колонки одной высоты */
const HEAD_H = "h-[128px] sm:h-[136px]";

function titleOf(p: DbProperty) {
  const extras =
    p.extras && typeof p.extras === "object" && !Array.isArray(p.extras)
      ? (p.extras as Record<string, unknown>)
      : {};
  return buildPropertyDisplayTitle({ ...p, extras });
}

function shortTitle(p: DbProperty) {
  const full = titleOf(p);
  const parts = full.split(" · ");
  if (parts.length <= 2) return full;
  return parts.slice(0, 2).join(" · ");
}

function CompareEmpty({ onCatalog }: { onCatalog: () => void }) {
  return (
    <div className="mx-4 sm:mx-0 rounded-lg border border-dashed border-border bg-muted/20 px-5 py-14 text-center">
      <Columns2
        className="w-8 h-8 text-muted-foreground mx-auto mb-3"
        strokeWidth={1.5}
      />
      <p className="text-sm font-semibold text-foreground mb-1">
        Список сравнения пуст
      </p>
      <p className="text-xs text-muted-foreground mb-5 max-w-sm mx-auto leading-relaxed">
        Нажмите «Сравнить» на объекте. Можно сравнить до {COMPARE_MAX} объявлений
        одной категории.
      </p>
      <button
        type="button"
        onClick={onCatalog}
        className="inline-flex h-7 px-[11px] items-center justify-center rounded bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
      >
        В каталог
      </button>
    </div>
  );
}

function PropertyHeadCell({
  property,
  onRemove,
}: {
  property: DbProperty;
  onRemove: () => void;
}) {
  return (
    <th
      className={cn(
        "p-0 align-top font-normal border-l border-border/60",
        "min-w-[140px] w-[140px] sm:min-w-[156px] sm:w-[156px] lg:min-w-[172px] lg:w-[172px]",
      )}
    >
      <div className={cn("flex flex-col px-2 pt-2 pb-2", HEAD_H)}>
        <div className="relative w-full h-[64px] sm:h-[72px] rounded-md overflow-hidden bg-muted shrink-0">
          <Link to={`/property/${property.id}`} className="block w-full h-full">
            <PropertyImage
              src={property.cover_photo}
              alt={titleOf(property)}
              className="w-full h-full"
              imgClassName="object-cover w-full h-full"
            />
          </Link>
          <button
            type="button"
            aria-label="Убрать из сравнения"
            onClick={onRemove}
            className="absolute top-1 right-1 w-5 h-5 rounded bg-black/55 text-white flex items-center justify-center hover:bg-black/75"
          >
            <X className="w-3 h-3" strokeWidth={2.5} />
          </button>
        </div>
        <Link
          to={`/property/${property.id}`}
          className="mt-1.5 flex-1 min-h-0 flex flex-col justify-start group"
        >
          <span className="price-display text-[12px] sm:text-[13px] text-foreground leading-tight tabular-nums">
            {formatPropertyPrice(property) ?? "По запросу"}
          </span>
          <span className="mt-0.5 text-[10px] sm:text-[11px] text-muted-foreground group-hover:text-primary line-clamp-2 leading-snug">
            {shortTitle(property)}
          </span>
        </Link>
      </div>
    </th>
  );
}

function AddSlotCell({ count }: { count: number }) {
  return (
    <th
      className={cn(
        "p-0 align-top font-normal border-l border-border/60",
        "min-w-[100px] w-[100px] sm:min-w-[120px] sm:w-[120px]",
      )}
    >
      <div className={cn("p-2", HEAD_H)}>
        <Link
          to="/catalog"
          className="flex flex-col items-center justify-center gap-1 h-full rounded-md border border-dashed border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors px-1"
        >
          <Plus className="w-4 h-4" strokeWidth={1.75} />
          <span className="text-[10px] text-center leading-tight font-medium">
            Ещё {count}/{COMPARE_MAX}
          </span>
        </Link>
      </div>
    </th>
  );
}

function CompareTable({
  properties,
  rows,
  onRemove,
}: {
  properties: DbProperty[];
  rows: CompareRow[];
  onRemove: (id: string) => void;
}) {
  const keyRows = rows.filter((r) => KEY_ROW_KEYS.has(r.key));
  const otherRows = rows.filter((r) => !KEY_ROW_KEYS.has(r.key));
  const sections: { title?: string; items: CompareRow[] }[] = [
    { title: "Главное", items: keyRows },
    { title: "Характеристики", items: otherRows },
  ].filter((s) => s.items.length > 0);

  const colPad = properties.length < COMPARE_MAX;

  return (
    <div className="-mx-4 sm:mx-0 border-y sm:border sm:rounded-lg border-border bg-card overflow-hidden">
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th
                className={cn(
                  "sticky left-0 z-20 bg-muted/20 p-0 align-top border-r border-border/60",
                  "w-[92px] min-w-[92px] sm:w-[112px] sm:min-w-[112px]",
                  "shadow-[2px_0_6px_-4px_rgba(0,0,0,0.12)]",
                )}
              >
                <div
                  className={cn(
                    "px-2.5 sm:px-3 flex flex-col justify-end",
                    HEAD_H,
                  )}
                >
                  <span className="pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Объект
                  </span>
                </div>
              </th>
              {properties.map((p) => (
                <PropertyHeadCell
                  key={p.id}
                  property={p}
                  onRemove={() => onRemove(p.id)}
                />
              ))}
              {colPad && <AddSlotCell count={properties.length} />}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <Fragment key={section.title || "all"}>
                {section.title && (
                  <tr className="bg-muted/50">
                    <th className="sticky left-0 z-10 bg-muted/50 px-2.5 sm:px-3 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60 border-r border-border/60 shadow-[2px_0_6px_-4px_rgba(0,0,0,0.08)]">
                      {section.title}
                    </th>
                    {properties.map((p) => (
                      <td
                        key={`sec-${section.title}-${p.id}`}
                        className="border-b border-border/60 border-l border-border/40 bg-muted/50"
                      />
                    ))}
                    {colPad && (
                      <td className="border-b border-border/60 border-l border-border/40 bg-muted/50" />
                    )}
                  </tr>
                )}
                {section.items.map((row) => {
                  const best = bestValueIndexes(row.numeric, row.prefer);
                  const isKey = KEY_ROW_KEYS.has(row.key);
                  return (
                    <tr
                      key={row.key}
                      className="border-b border-border/50 last:border-0"
                    >
                      <th
                        className={cn(
                          "sticky left-0 z-10 p-0 align-middle border-r border-border/60 text-left shadow-[2px_0_6px_-4px_rgba(0,0,0,0.08)]",
                          isKey ? "bg-primary/[0.04]" : "bg-card",
                        )}
                      >
                        <div className="px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-medium text-muted-foreground leading-snug">
                          {row.label}
                        </div>
                      </th>
                      {row.values.map((value, i) => (
                        <td
                          key={`${row.key}-${properties[i]?.id ?? i}`}
                          className={cn(
                            "px-2.5 sm:px-3 py-2 align-middle border-l border-border/40 text-[12px] sm:text-[13px] leading-snug break-words",
                            isKey && "bg-primary/[0.04]",
                            best.has(i)
                              ? "font-semibold text-foreground"
                              : "text-foreground/85",
                          )}
                        >
                          {value}
                        </td>
                      ))}
                      {colPad && (
                        <td
                          className={cn(
                            "border-l border-border/40",
                            isKey && "bg-primary/[0.04]",
                          )}
                        />
                      )}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="sm:hidden px-3 py-2 text-[10px] text-muted-foreground border-t border-border/60 bg-muted/20">
        Листайте вправо, чтобы увидеть все объекты
      </p>
    </div>
  );
}

export default function ComparePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const {
    compareIds,
    categoryLabel,
    count,
    removeFromCompare,
    clearCompare,
  } = useCompareProperties();

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["compare-properties", compareIds],
    enabled: !!user && compareIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabasePublic
        .from("properties")
        .select("*")
        .in("id", compareIds)
        .eq("is_active", true);
      if (error) throw error;
      const byId = new Map(
        ((data || []) as DbProperty[]).map((p) => [p.id, p]),
      );
      return compareIds
        .map((id) => byId.get(id))
        .filter((p): p is DbProperty => !!p);
    },
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
        Загрузка…
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/auth?redirect=${encodeURIComponent("/compare")}`}
        replace
      />
    );
  }

  const rows = buildCompareRows(properties);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title="Сравнение объектов"
        description="Сравните объекты одной категории: площадь, цена, цена за м² и характеристики."
      />
      <SiteHeader />

      <main className="w-full max-w-6xl mx-auto px-4 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-20 flex-1 mt-[56px] lg:mt-[104px]">
        <div className="flex items-center justify-between gap-3 mb-3 sm:mb-4">
          <div className="min-w-0">
            <h1 className="font-display text-lg sm:text-xl font-bold text-foreground truncate">
              Сравнение
              {categoryLabel ? (
                <span className="font-semibold text-muted-foreground">
                  {" "}
                  · {categoryLabel}
                </span>
              ) : null}
            </h1>
            {count > 0 && (
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {count} из {COMPARE_MAX} объектов
              </p>
            )}
          </div>
          {count > 0 && (
            <button
              type="button"
              onClick={clearCompare}
              className="shrink-0 inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Очистить</span>
            </button>
          )}
        </div>

        {count === 0 && <CompareEmpty onCatalog={() => navigate("/catalog")} />}

        {count > 0 && isLoading && (
          <p className="text-sm text-muted-foreground px-1">
            Загружаем объекты…
          </p>
        )}

        {count > 0 && !isLoading && properties.length === 0 && (
          <div className="rounded-lg border border-border bg-card px-5 py-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Объекты недоступны
            </p>
            <button
              type="button"
              onClick={clearCompare}
              className="text-sm text-primary font-medium"
            >
              Очистить список
            </button>
          </div>
        )}

        {properties.length > 0 && (
          <CompareTable
            properties={properties}
            rows={rows}
            onRemove={removeFromCompare}
          />
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
