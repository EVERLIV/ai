import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const GRID_ROOMS = ["1", "2", "3", "4", "5", "6+"] as const;
const EXTRA_ROOMS = ["Студия", "Свободная планировка"] as const;

export type RoomChoice = (typeof GRID_ROOMS)[number] | (typeof EXTRA_ROOMS)[number] | "";

export function roomsDisplayLabel(value: string): string {
  if (!value) return "Кол-во комнат";
  if (value === "Студия") return "Студия";
  if (value === "Свободная планировка") return "Св. планировка";
  if (value === "6+") return "6+ комн.";
  return `${value} комн.`;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (value: string) => void;
};

export default function RoomsSheet({ open, onOpenChange, value, onChange }: Props) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="px-0 pb-0 pt-0 rounded-t-2xl [&>button]:hidden" aria-describedby={undefined}>
        <SheetTitle className="sr-only">Количество комнат</SheetTitle>

        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <span className="text-base font-semibold text-foreground">Количество комнат</span>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => onOpenChange(false)}
            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-3">
          <div className="grid grid-cols-6 gap-2">
            {GRID_ROOMS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setDraft(n)}
                className={cn(
                  "h-11 text-sm font-medium border transition-colors",
                  draft === n
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border/80 bg-card text-foreground hover:border-primary/40",
                )}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {EXTRA_ROOMS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setDraft(opt)}
                className={cn(
                  "h-11 text-sm font-medium border transition-colors",
                  opt === "Свободная планировка" && "col-span-2",
                  draft === opt
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border/80 bg-card text-foreground hover:border-primary/40",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => {
              onChange(draft);
              onOpenChange(false);
            }}
            className="w-full h-12 text-sm font-semibold bg-primary text-primary-foreground"
          >
            Применить
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
