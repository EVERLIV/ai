import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  variant?: "icon" | "bar";
  className?: string;
}

/** Кнопка печати объявления — рядом с «Поделиться». */
export default function PropertyPrintButton({
  variant = "icon",
  className,
}: Props) {
  const handlePrint = () => {
    window.print();
  };

  const triggerClass =
    variant === "bar"
      ? "flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-foreground hover:bg-muted active:scale-95 transition-all"
      : "flex items-center justify-center w-8 h-8 border border-foreground/25 text-foreground hover:bg-muted transition-colors";

  return (
    <button
      type="button"
      aria-label="Напечатать объявление"
      title="Напечатать объявление"
      onClick={handlePrint}
      className={cn(triggerClass, className)}
    >
      <Printer
        className={variant === "bar" ? "w-6 h-6" : "w-4 h-4"}
        strokeWidth={2.2}
      />
      {variant === "bar" && (
        <span className="text-[10px] font-medium">Печать</span>
      )}
    </button>
  );
}
