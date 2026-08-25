import logoMark from "@/assets/logo-ac-mark.svg";
import { cn } from "@/lib/utils";

/** Марка: геометрический знак AC — крупнее слова «АРЕНДАСИТИ» */
export default function BrandMark({
  className,
  variant = "default",
}: {
  className?: string;
  /** inverse — на тёмном футере (тот же знак) */
  variant?: "default" | "inverse";
}) {
  return (
    <img
      src={logoMark}
      alt=""
      width={100}
      height={100}
      aria-hidden
      draggable={false}
      decoding="async"
      className={cn(
        "shrink-0 select-none object-contain object-left",
        /* было h-3.5 (~14px) — теперь заметно крупнее слова */
        "h-7 w-7 max-w-none",
        className,
      )}
      data-variant={variant}
    />
  );
}
