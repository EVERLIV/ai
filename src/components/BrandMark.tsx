import { cn } from "@/lib/utils";

/** Простая марка: буква «А» на фоне primary */
export default function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg bg-primary flex items-center justify-center shrink-0",
        className,
      )}
      aria-hidden
    >
      <span className="text-primary-foreground font-bold text-base tracking-tight leading-none">
        А
      </span>
    </div>
  );
}
