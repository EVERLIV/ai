import logoAc from "@/assets/logo-ac.png";
import { cn } from "@/lib/utils";

/** Марка: логотип AC — сохраняем пропорции (не квадрат), без обводки */
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
      src={logoAc}
      alt=""
      width={422}
      height={288}
      aria-hidden
      draggable={false}
      decoding="async"
      className={cn(
        "shrink-0 select-none object-contain object-left",
        /* чуть ниже высоты слова «АРЕНДАСИТИ» (~14–16px) */
        "h-3.5 w-auto max-w-none",
        className,
      )}
      data-variant={variant}
    />
  );
}
