import { Heart } from "lucide-react";
import { useSavedProperties } from "@/hooks/useSavedProperties";
import { cn } from "@/lib/utils";

interface Props {
  propertyId: string;
  className?: string;
  iconClassName?: string;
  /** When true, heart is filled if saved (default). */
  showLabel?: boolean;
}

export default function PropertySaveButton({
  propertyId,
  className,
  iconClassName,
  showLabel = false,
}: Props) {
  const { saved, toggleSaved } = useSavedProperties(propertyId);

  return (
    <button
      type="button"
      aria-label={saved ? "Убрать из избранного" : "В избранное"}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSaved(propertyId);
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-colors",
        saved
          ? "text-primary bg-primary/10"
          : "text-muted-foreground bg-background/90 hover:text-primary backdrop-blur-sm",
        className,
      )}
    >
      <Heart
        className={cn("w-4 h-4", iconClassName)}
        strokeWidth={1.75}
        fill={saved ? "currentColor" : "none"}
      />
      {showLabel && (
        <span className="sr-only">{saved ? "В избранном" : "В избранное"}</span>
      )}
    </button>
  );
}
