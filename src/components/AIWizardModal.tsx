import { Sparkles, X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import AIPropertyWizard from "@/components/AIPropertyWizard";
import type { PropertySegment } from "@/config/propertySegments";
import { useAllActiveProperties } from "@/hooks/useProperties";

interface AIWizardModalProps {
  open: boolean;
  onClose: () => void;
  segment?: PropertySegment;
}

export default function AIWizardModal({
  open,
  onClose,
  segment = "commercial",
}: AIWizardModalProps) {
  const { data: properties = [], isLoading } = useAllActiveProperties();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ animation: "ai-backdrop-in 200ms ease forwards" }}
    >
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className="relative flex h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-card shadow-[0_24px_64px_-12px_rgba(0,0,0,0.3)] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl"
        style={{
          animation:
            "ai-modal-in 250ms cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-foreground">
                Умный подбор
              </span>
              <p className="text-[12px] text-muted-foreground">
                {isLoading
                  ? "Загружаем каталог…"
                  : `${properties.length} объектов · агентства и риелторы`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Закрыть"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <AIPropertyWizard
            properties={properties}
            onClose={onClose}
            segment={segment}
          />
        </div>
      </div>

      <style>{`
        @keyframes ai-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ai-modal-in {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body,
  );
}
