import { cn } from "@/lib/utils";

/** Марка: буква «А» на фирменном красном */
export default function BrandMark({
  className,
  variant = "default",
}: {
  className?: string;
  /** inverse — на тёмном футере (красный остаётся акцентом) */
  variant?: "default" | "inverse";
}) {
  return (
    <div
      className={cn(
        "rounded-md flex items-center justify-center shrink-0 bg-primary text-primary-foreground",
        variant === "inverse" && "ring-1 ring-background/20",
        className,
      )}
      aria-hidden
    >
      <span className="font-display font-bold text-base tracking-tight leading-none">
        А
      </span>
    </div>
  );
}
