import { useEffect, useRef, useState } from "react";
import PropertyShareButton from "@/components/PropertyShareButton";
import type { PropertyShareInput } from "@/lib/propertyShare";
import { cn } from "@/lib/utils";

export type PropertyNavSection = {
  id: string;
  label: string;
};

type Props = {
  sections: PropertyNavSection[];
  title: string;
  property: PropertyShareInput;
  /** Когда меню объекта активно (скролл вниз) — вызывается, чтобы скрыть SiteHeader */
  onPinnedChange?: (pinned: boolean) => void;
  className?: string;
};

const NAV_H = 48;

export default function PropertyStickyNav({
  sections,
  title,
  property,
  onPinnedChange,
  className,
}: Props) {
  const [pinned, setPinned] = useState(false);
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const clickingRef = useRef(false);
  const onPinnedChangeRef = useRef(onPinnedChange);
  onPinnedChangeRef.current = onPinnedChange;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        // Закрепляем, когда sentinel ушёл выше экрана (пользователь проскроллил вниз)
        const next = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        setPinned(next);
        onPinnedChangeRef.current?.(next);
      },
      { threshold: 0, rootMargin: "0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      onPinnedChangeRef.current?.(false);
    };
  }, []);

  useEffect(() => {
    if (!sections.length) return;

    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[];

    if (!elements.length) return;

    const onScroll = () => {
      if (clickingRef.current) return;
      const offset = NAV_H + 24;
      let current = sections[0].id;

      for (const el of elements) {
        const top = el.getBoundingClientRect().top;
        if (top <= offset) current = el.id;
      }
      setActiveId(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    clickingRef.current = true;
    setActiveId(id);
    const y = el.getBoundingClientRect().top + window.scrollY - NAV_H - 8;
    window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    window.setTimeout(() => {
      clickingRef.current = false;
    }, 700);
  };

  return (
    <>
      {/* Точка срабатывания: после заголовка / в начале галереи */}
      <div ref={sentinelRef} className="h-0 w-full pointer-events-none" aria-hidden />

      {pinned && (
        <div
          className={cn(
            "fixed top-0 left-0 right-0 z-[55] bg-background/95 backdrop-blur-md border-b border-border/70 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.12)]",
            className,
          )}
          style={{ height: NAV_H }}
        >
          <div className="container mx-auto px-4 lg:px-8 h-full flex items-center gap-4">
            <nav
              className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto scrollbar-none"
              aria-label="Разделы объявления"
            >
              {sections.map((s) => {
                const active = activeId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => scrollTo(s.id)}
                    className={cn(
                      "relative shrink-0 h-12 px-3 text-sm font-medium transition-colors",
                      active
                        ? "text-primary"
                        : "text-foreground/70 hover:text-foreground",
                    )}
                  >
                    {s.label}
                    <span
                      className={cn(
                        "absolute bottom-0 left-3 right-3 h-[2.5px] bg-primary rounded-full transition-opacity",
                        active ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </button>
                );
              })}
            </nav>

            <div className="hidden sm:flex items-center gap-2.5 shrink-0 max-w-[42%]">
              <span className="text-xs text-muted-foreground truncate">
                {title}
              </span>
              <PropertyShareButton property={property} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
