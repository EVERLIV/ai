import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SpecItem = {
  label: string;
  value: ReactNode;
  hide?: boolean;
};

/** Заголовок секции в карточке характеристик. */
export function SpecSectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Строка «метка ····· значение» как у агрегаторов (Циан). */
export function SpecRow({
  label,
  value,
  className,
  emphasis = false,
}: {
  label: string;
  value: ReactNode;
  className?: string;
  /** Выделить значение сильнее (цена, срок, ключевые условия). */
  emphasis?: boolean;
}) {
  if (value == null || value === "" || value === "—") return null;

  return (
    <div
      className={cn(
        "flex items-end gap-0 py-2 first:pt-0 last:pb-0 min-h-[1.75rem]",
        className,
      )}
    >
      <span className="text-xs text-muted-foreground shrink-0 pb-0.5 leading-tight max-w-[42%]">
        {label}
      </span>
      <span
        className="flex-1 mx-2 mb-[3px] min-w-[0.75rem] h-px bg-[repeating-linear-gradient(90deg,hsl(var(--muted-foreground)/0.32)_0_1.5px,transparent_1.5px_5px)]"
        aria-hidden
      />
      <span
        className={cn(
          "text-sm text-foreground text-right shrink-0 max-w-[58%] leading-snug pb-0.5",
          emphasis ? "font-semibold" : "font-medium",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Двухколоночный список характеристик без карточек. */
export function SpecGrid({
  items,
  className,
}: {
  items: SpecItem[];
  className?: string;
}) {
  const visible = items.filter((i) => !i.hide && i.value != null && i.value !== "—");
  if (!visible.length) return null;

  const mid = Math.ceil(visible.length / 2);
  const left = visible.slice(0, mid);
  const right = visible.slice(mid);

  return (
    <div
      className={cn("grid sm:grid-cols-2 gap-x-12 gap-y-0", className)}
    >
      <div>
        {left.map((item) => (
          <SpecRow key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
      <div>
        {right.map((item) => (
          <SpecRow key={item.label} label={item.label} value={item.value} />
        ))}
      </div>
    </div>
  );
}

/** Горизонтальная полоса ключевых метрик с иконками. */
export function SpecQuickStats({
  items,
  className,
}: {
  items: {
    label: string;
    value: ReactNode;
    icon: React.ElementType;
  }[];
  className?: string;
}) {
  const visible = items.filter(
    (i) => i.value != null && i.value !== "" && i.value !== "—",
  );
  if (!visible.length) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap gap-x-10 gap-y-5 border-y border-border/60 py-5",
        className,
      )}
    >
      {visible.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="flex items-start gap-2.5 min-w-[6.5rem]">
            <Icon
              className="w-[18px] h-[18px] text-muted-foreground/80 shrink-0 mt-0.5"
              strokeWidth={1.5}
            />
            <div className="min-w-0">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground leading-tight">
                {item.label}
              </div>
              <div className="text-[15px] font-semibold text-foreground mt-1 leading-tight">
                {item.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
