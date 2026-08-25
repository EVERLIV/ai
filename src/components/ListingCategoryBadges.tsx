import { cn } from "@/lib/utils";

type Props = {
  type?: string | null;
  dealType?: string | null;
  className?: string;
};

/** Бейджи категории / сделки на фото карточки */
export default function ListingCategoryBadges({
  type,
  dealType,
  className,
}: Props) {
  if (!type && !dealType) return null;

  return (
    <div
      className={cn(
        "absolute top-2 left-2 z-[1] flex flex-wrap gap-1 max-w-[70%]",
        className,
      )}
    >
      {type && (
        <span className="px-1.5 py-0.5 rounded-md bg-background/90 text-[10px] font-medium text-foreground">
          {type}
        </span>
      )}
      {dealType && (
        <span
          className={cn(
            "px-1.5 py-0.5 rounded-md text-[10px] font-medium",
            dealType === "Продажа"
              ? "bg-foreground text-background"
              : "bg-primary text-primary-foreground",
          )}
        >
          {dealType}
        </span>
      )}
    </div>
  );
}
