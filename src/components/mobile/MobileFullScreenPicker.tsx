import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  onApply: () => void;
  applyLabel?: string;
  children: React.ReactNode;
  applyDisabled?: boolean;
};

/** Полноэкранный picker (референс Циан — «Тип недвижимости») */
export default function MobileFullScreenPicker({
  open,
  onClose,
  title,
  onApply,
  applyLabel = "Применить",
  children,
  applyDisabled,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="lg:hidden fixed inset-0 z-[60] flex flex-col bg-background">
      <header className="shrink-0 flex items-center gap-2 px-2 h-14 border-b border-border/60">
        <button
          type="button"
          aria-label="Назад"
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center text-foreground"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="flex-1 text-center text-base font-semibold text-foreground pr-10">
          {title}
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>

      <footer className="shrink-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border/60 bg-background">
        <button
          type="button"
          disabled={applyDisabled}
          onClick={() => {
            onApply();
            onClose();
          }}
          className={cn(
            "w-full h-12 text-sm font-semibold text-primary-foreground bg-primary transition-opacity",
            applyDisabled && "opacity-50 pointer-events-none",
          )}
        >
          {applyLabel}
        </button>
      </footer>
    </div>,
    document.body,
  );
}
