import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type CheckItem = { id: string; label: string };
type RadioItem = { id: string; label: string };

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  checkItems?: CheckItem[];
  checkedIds: string[];
  onToggleCheck: (id: string) => void;
  radioItems: RadioItem[];
  selectedRadio: string;
  onSelectRadio: (id: string) => void;
  onApply: () => void;
};

export default function CategoryBottomSheet({
  open,
  onClose,
  title,
  checkItems,
  checkedIds,
  onToggleCheck,
  radioItems,
  selectedRadio,
  onSelectRadio,
  onApply,
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [animIn, setAnimIn] = useState(false);

  // Монтируем → два кадра → запускаем slide-in (один rAF не успевает)
  useEffect(() => {
    if (open) {
      setVisible(true);
      let t1: number;
      const t0 = requestAnimationFrame(() => {
        t1 = requestAnimationFrame(() => setAnimIn(true));
      });
      return () => { cancelAnimationFrame(t0); cancelAnimationFrame(t1); };
    } else {
      setAnimIn(false);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onClose]);

  if (!visible) return null;

  return createPortal(
    <div className="lg:hidden fixed inset-0 z-[60] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        style={{ opacity: animIn ? 1 : 0 }}
        aria-hidden
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative bg-background rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden transition-transform duration-300 ease-out"
        style={{ transform: animIn ? "translateY(0)" : "translateY(100%)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="w-8 h-8 flex items-center justify-center text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <div className="w-8" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Checkboxes section */}
          {checkItems && checkItems.length > 0 && (
            <>
              <ul className="px-4">
                {checkItems.map((item) => {
                  const checked = checkedIds.includes(item.id);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onToggleCheck(item.id)}
                        className="w-full flex items-center gap-3 py-3.5 text-sm text-foreground"
                      >
                        <span
                          className={cn(
                            "w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors",
                            checked
                              ? "bg-primary border-primary"
                              : "border-foreground/30 bg-background",
                          )}
                        >
                          {checked && (
                            <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
                          )}
                        </span>
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="mx-4 my-1 border-t border-border" />
            </>
          )}

          {/* Radio list */}
          <ul className="px-4">
            {radioItems.map((item) => {
              const selected = selectedRadio === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelectRadio(item.id)}
                    className="w-full flex items-center gap-3 py-3.5 text-sm text-foreground"
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        border: `2px solid ${selected ? "hsl(var(--primary))" : "#888"}`,
                      }}
                    >
                      {selected && (
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </span>
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Apply button */}
        <div className="shrink-0 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-border/60 bg-background">
          <button
            type="button"
            onClick={() => { onApply(); onClose(); }}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
          >
            Применить
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
