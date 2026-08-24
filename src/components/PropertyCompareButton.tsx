import { Columns2 } from "lucide-react";
import type { ComparePropertyInput } from "@/lib/propertyCompare";
import { useCompareProperties } from "@/hooks/useCompareProperties";
import { cn } from "@/lib/utils";

interface Props {
  property: ComparePropertyInput;
  className?: string;
  iconClassName?: string;
  /** Compact icon-only (cards). Default true. */
  iconOnly?: boolean;
}

export default function PropertyCompareButton({
  property,
  className,
  iconClassName,
  iconOnly = true,
}: Props) {
  const { inCompare, toggleCompare } = useCompareProperties(property.id);

  return (
    <button
      type="button"
      aria-label={inCompare ? "Убрать из сравнения" : "Сравнить"}
      aria-pressed={inCompare}
      title={inCompare ? "Убрать из сравнения" : "Сравнить"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleCompare(property);
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-colors",
        inCompare
          ? "text-primary bg-primary/10"
          : "text-muted-foreground bg-background/90 hover:text-primary backdrop-blur-sm",
        className,
      )}
    >
      <Columns2
        className={cn("w-4 h-4", iconClassName)}
        strokeWidth={1.75}
      />
      {!iconOnly && (
        <span className="ml-1.5 text-xs font-medium">
          {inCompare ? "В сравнении" : "Сравнить"}
        </span>
      )}
    </button>
  );
}
