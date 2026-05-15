import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import AIPropertyWizard from "@/components/AIPropertyWizard";
import { useProperties } from "@/hooks/useProperties";

interface AIWizardModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AIWizardModal({ open, onClose }: AIWizardModalProps) {
  const { data: properties = [] } = useProperties();

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ animation: "ai-backdrop-in 200ms ease forwards" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-card shadow-[0_24px_64px_-12px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh]"
        style={{ animation: "ai-modal-in 250ms cubic-bezier(0.34,1.56,0.64,1) forwards" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <span className="text-sm font-bold text-foreground">ИИ-подбор объекта</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AIPropertyWizard properties={properties} onClose={onClose} />
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
    document.body
  );
}
