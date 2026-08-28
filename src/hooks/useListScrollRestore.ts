import { useCallback, useRef } from "react";

export function useListScrollRestore() {
  const scrollYRef = useRef(0);
  const highlightIdRef = useRef<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const capture = useCallback((rowId?: string | null) => {
    scrollYRef.current = window.scrollY;
    if (rowId) highlightIdRef.current = rowId;
  }, []);

  const restore = useCallback(() => {
    const y = scrollYRef.current;
    const rowId = highlightIdRef.current;
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
        if (rowId) {
          const el = document.querySelector(`[data-row-id="${rowId}"]`);
          el?.classList.add("ring-2", "ring-primary/40", "ring-inset");
          if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
          highlightTimerRef.current = setTimeout(() => {
            el?.classList.remove("ring-2", "ring-primary/40", "ring-inset");
            highlightIdRef.current = null;
          }, 2000);
        }
      });
    });
  }, []);

  return { capture, restore };
}
