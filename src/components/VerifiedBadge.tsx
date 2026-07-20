import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

/** Золотая галочка — «Верифицирован» (только иконка, без фона) */
export default function VerifiedBadge({ className, size = "sm", showLabel = false }: Props) {
  const iconSize = size === "md" ? "w-5 h-5" : "w-3.5 h-3.5";
  const textSize = size === "md" ? "text-xs" : "text-[10px]";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 shrink-0",
        showLabel && cn("font-medium text-amber-600 dark:text-amber-400", textSize),
        className,
      )}
      title="Верифицирован"
    >
      <BadgeCheck className={cn(iconSize, "text-amber-500 fill-amber-400/35")} />
      {showLabel && "Верифицирован"}
    </span>
  );
}
