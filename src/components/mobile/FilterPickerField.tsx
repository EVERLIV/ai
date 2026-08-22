import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  placeholder?: string;
  onClick: () => void;
  className?: string;
};

/** Поле-триггер для picker (вместо native select) */
export default function FilterPickerField({ label, value, placeholder, onClick, className }: Props) {
  const display = value || placeholder || label;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "w-full h-11 px-3 flex items-center justify-between gap-2 bg-card border border-border/60 text-sm text-left transition-colors hover:border-primary/30 active:bg-muted/30",
        !value && "text-muted-foreground",
        className,
      )}
    >
      <span className="truncate">{display}</span>
      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}
