import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  HOUSE_PACKAGE_FEATURE_CATEGORIES,
  type HouseFinishPackage,
} from "@/lib/housePackages";

function formatRub(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "по запросу";
  return `от ${new Intl.NumberFormat("ru-RU").format(Math.round(n))} ₽`;
}

type Props = {
  packages: HouseFinishPackage[];
  className?: string;
};

/**
 * Сравнение комплектаций серии (тёплый контур / стандарт / под ключ) — как у производителей модульных домов.
 */
export function HousePackagesCompare({ packages, className }: Props) {
  const list = useMemo(
    () => packages.filter((p) => p.name.trim()),
    [packages],
  );
  const [activeId, setActiveId] = useState(() => list[0]?.id ?? "");

  if (list.length === 0) return null;

  const active = list.find((p) => p.id === activeId) ?? list[0];
  const includeSet = new Set(active.includes);

  return (
    <section className={cn("space-y-4", className)}>
      <h2 className="text-lg font-semibold tracking-tight">
        Посмотрите комплектации
      </h2>

      <div className="grid gap-2 sm:grid-cols-3">
        {list.map((pkg) => {
          const selected = pkg.id === active.id;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setActiveId(pkg.id)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left transition-colors",
                selected
                  ? "border-amber-600 bg-amber-50 text-amber-950 shadow-sm"
                  : "border-border bg-card hover:bg-muted/40",
              )}
            >
              <div className="text-sm font-semibold">{pkg.name}</div>
              <div
                className={cn(
                  "mt-1 text-xs",
                  selected ? "text-amber-800" : "text-muted-foreground",
                )}
              >
                {formatRub(pkg.price_from)}
              </div>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        {HOUSE_PACKAGE_FEATURE_CATEGORIES.map((cat) => (
          <div key={cat.id}>
            <div className="bg-muted/70 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {cat.title}
            </div>
            <ul>
              {cat.items.map((item, idx) => {
                const has = includeSet.has(item.id);
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "grid grid-cols-[1fr_4.5rem] items-center gap-2 px-3 py-2 text-sm",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/30",
                    )}
                  >
                    <span className="text-foreground/90">{item.label}</span>
                    <span
                      className={cn(
                        "text-center text-xs font-medium",
                        has ? "text-emerald-700" : "text-muted-foreground",
                      )}
                    >
                      {has ? "есть" : "—"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Все дома строятся под заказ. Состав и цены комплектаций уточняйте у
        застройщика — зависят от участка и выбранной серии.
      </p>
    </section>
  );
}
