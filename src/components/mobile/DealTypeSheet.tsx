import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type DealChoice = "Аренда" | "Продажа" | "Посуточно";

const OPTIONS: {
  label: string;
  value: DealChoice;
  residentialOnly?: boolean;
}[] = [
  { label: "Купить", value: "Продажа" },
  { label: "Снять", value: "Аренда" },
  { label: "Посуточно", value: "Посуточно", residentialOnly: true },
];

export function dealChoiceLabel(value: DealChoice): string {
  return OPTIONS.find((o) => o.value === value)?.label ?? "Снять";
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: DealChoice;
  onChange: (value: DealChoice) => void;
  residential?: boolean;
};

export default function DealTypeSheet({
  open,
  onOpenChange,
  value,
  onChange,
  residential = true,
}: Props) {
  const items = OPTIONS.filter((o) => !o.residentialOnly || residential);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="px-0 pb-0 pt-0 rounded-t-2xl [&>button]:hidden"
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">Тип сделки</SheetTitle>

        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <span className="text-base font-semibold text-foreground">
            Тип сделки
          </span>
          <button
            type="button"
            aria-label="Закрыть"
            onClick={() => onOpenChange(false)}
            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ul className="divide-y divide-border/60">
          {items.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3.5 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors"
                onClick={() => setDraft(opt.value)}
              >
                {opt.label}
                <Check
                  className={cn(
                    "w-5 h-5 text-primary",
                    draft === opt.value ? "opacity-100" : "opacity-0",
                  )}
                />
              </button>
            </li>
          ))}
        </ul>

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
