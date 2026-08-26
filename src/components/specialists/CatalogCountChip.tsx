import { cn } from "@/lib/utils";

type Props = {
  count: number;
  /** Уже склонённая подпись: «проект» / «объектов» */
  label: string;
  className?: string;
};

/**
 * Компактный счётчик справа на карточках агентства / риелтора / застройщика.
 * Рассчитан на 0…9999 без лишнего воздуха, число и подпись по центру.
 */
export default function CatalogCountChip({ count, label, className }: Props) {
  const n = Math.max(0, Math.min(9999, Math.floor(Number(count) || 0)));
  const display = n.toLocaleString("ru-RU");

  return (
    <div
      className={cn(
        "inline-flex flex-col items-center justify-center gap-0.5",
        "rounded-md bg-muted/55 px-2 py-1.5",
        "min-w-[3.25rem] w-max max-w-[5rem]",
        className,
      )}
    >
      <span
        className={cn(
          "font-semibold text-foreground tabular-nums leading-none tracking-tight text-center",
          n >= 1000 ? "text-[13px]" : "text-[15px]",
        )}
      >
        {display}
      </span>
      <span className="text-[10px] text-muted-foreground leading-none text-center whitespace-nowrap">
        {label}
      </span>
    </div>
  );
}
