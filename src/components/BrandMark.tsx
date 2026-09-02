import logoDadatut from "@/assets/logo-dadatut.png";
import { cn } from "@/lib/utils";

/** Логотип DADATYT — горизонтальный lockup (без отдельного wordmark). */
export default function BrandMark({
  className,
  variant = "default",
}: {
  className?: string;
  /** inverse — на тёмном фоне (тот же PNG) */
  variant?: "default" | "inverse";
}) {
  return (
    <img
      src={logoDadatut}
      alt="ДАДАТУТ"
      width={180}
      height={40}
      draggable={false}
      decoding="async"
      className={cn(
        "shrink-0 select-none object-contain object-left",
        "h-8 w-auto max-w-[min(180px,42vw)]",
        className,
      )}
      data-variant={variant}
    />
  );
}
