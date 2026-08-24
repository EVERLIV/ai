import { ChevronDown } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { MegaMenuConfig, MegaSection } from "@/lib/catalogMegaMenu";
import { cn } from "@/lib/utils";

function MegaSectionBlock({
  section,
  onNavigate,
  onOpenWizard,
  compact,
}: {
  section: MegaSection;
  onNavigate?: () => void;
  onOpenWizard?: () => void;
  compact?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          "font-semibold text-foreground",
          compact ? "text-xs px-3 pt-1" : "text-sm leading-tight",
        )}
      >
        {section.title}
      </div>
      <ul className="space-y-0.5">
        {section.links.map((link) => (
          <li key={`${section.title}-${link.label}-${link.href}`}>
            {link.href === "#ai-wizard" ? (
              <button
                type="button"
                onClick={() => {
                  onNavigate?.();
                  onOpenWizard?.();
                }}
                className={cn(
                  "text-left w-full text-muted-foreground hover:text-primary transition-colors",
                  compact
                    ? "block px-3 py-2 text-sm"
                    : "block py-1 text-sm leading-snug",
                )}
              >
                {link.label}
              </button>
            ) : (
              <Link
                to={link.href}
                onClick={onNavigate}
                className={cn(
                  "text-muted-foreground hover:text-primary transition-colors",
                  compact
                    ? "block px-3 py-2 text-sm"
                    : "block py-1 text-sm leading-snug",
                )}
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Панель мегаменю (колонки + promo). */
export function CatalogMegaPanel({
  config,
  onNavigate,
  onOpenWizard,
  className,
}: {
  config: MegaMenuConfig;
  onNavigate?: () => void;
  onOpenWizard?: () => void;
  className?: string;
}) {
  const hasPromo = !!config.promo;

  return (
    <div
      className={cn(
        "bg-card shadow-[0_16px_48px_-12px_rgba(0,0,0,0.18)] border border-border/60 overflow-hidden rounded-lg",
        className,
      )}
    >
      <div
        className={cn(
          "grid gap-0",
          hasPromo
            ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_minmax(200px,240px)]"
            : "grid-cols-1 sm:grid-cols-2",
        )}
      >
        {config.columns.map((column, idx) => (
          <div
            key={idx}
            className={cn(
              "px-4 py-4 sm:px-5 sm:py-5 space-y-4 min-w-0",
              idx > 0 && "sm:border-l border-border/50",
            )}
          >
            {column.sections.map((section) => (
              <MegaSectionBlock
                key={section.title}
                section={section}
                onNavigate={onNavigate}
                onOpenWizard={onOpenWizard}
              />
            ))}
          </div>
        ))}

        {config.aside && (
          <div className="px-4 py-4 sm:px-5 sm:py-5 bg-muted/40 border-t sm:border-t-0 sm:border-l border-border/50 min-w-0">
            <MegaSectionBlock
              section={config.aside}
              onNavigate={onNavigate}
              onOpenWizard={onOpenWizard}
            />
          </div>
        )}

        {config.promo && (
          <div className="px-4 py-4 sm:px-5 sm:py-5 bg-[#E8F3FF] dark:bg-primary/10 border-t xl:border-t-0 xl:border-l border-border/50 flex flex-col justify-between gap-3 min-w-0 sm:col-span-2 xl:col-span-1">
            <div>
              <p className="text-sm font-semibold text-foreground leading-snug">
                {config.promo.title}
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {config.promo.text}
              </p>
            </div>
            <Link
              to={config.promo.href}
              onClick={onNavigate}
              className="ui-btn-primary self-start"
            >
              {config.promo.cta}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/** Пункт верхнего меню с hover-мегапанелью (не выходит за край экрана). */
export function NavMegaItem({
  config,
  active,
  onOpenWizard,
}: {
  config: MegaMenuConfig;
  active?: boolean;
  onOpenWizard?: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [shiftX, setShiftX] = useState(0);

  const clampToViewport = () => {
    const panel = panelRef.current;
    const wrap = wrapRef.current;
    if (!panel || !wrap) return;
    const pad = 16;
    const wrapLeft = wrap.getBoundingClientRect().left;
    const width = panel.offsetWidth;
    if (!width) return;
    let left = wrapLeft;
    if (left + width > window.innerWidth - pad) {
      left = window.innerWidth - pad - width;
    }
    if (left < pad) left = pad;
    setShiftX(left - wrapLeft);
  };

  const openMenu = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  };

  const closeMenu = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setShiftX(0);
      closeTimer.current = null;
    }, 100);
  };

  useLayoutEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(clampToViewport);
    });
    window.addEventListener("resize", clampToViewport);
    return () => window.removeEventListener("resize", clampToViewport);
  }, [open]);

  useLayoutEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
    >
      <Link
        to={config.catalogHref}
        onClick={() => {
          setOpen(false);
          setShiftX(0);
        }}
        className={cn(
          "relative flex items-center px-2.5 xl:px-3 py-2 text-sm font-medium transition-colors duration-150 whitespace-nowrap",
          active
            ? "text-primary"
            : "text-foreground/75 hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "pointer-events-none absolute bottom-0 left-2.5 right-2.5 xl:left-3 xl:right-3 h-0.5 bg-primary",
            active ? "opacity-100" : open ? "opacity-60" : "opacity-0",
          )}
        />
        {config.triggerLabel}
      </Link>

      {/* Панель монтируется только при open — иначе невидимый блок перехватывает фильтры */}
      {open && (
        <div
          ref={panelRef}
          style={{ transform: `translateX(${shiftX}px)` }}
          className="absolute top-full left-0 z-50 w-[min(640px,calc(100vw-2rem))] pt-1 animate-in fade-in-0 slide-in-from-top-1 duration-150"
        >
          <CatalogMegaPanel config={config} onOpenWizard={onOpenWizard} />
        </div>
      )}
    </div>
  );
}

/** Аккордеон-секция для мобильного меню. */
export function MobileMegaAccordion({
  config,
  onNavigate,
  onOpenWizard,
}: {
  config: MegaMenuConfig;
  onNavigate?: () => void;
  onOpenWizard?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground">
          {config.triggerLabel}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="pb-3 space-y-3 bg-muted/30">
          <Link
            to={config.catalogHref}
            onClick={onNavigate}
            className="block px-4 py-1.5 text-sm text-primary font-medium"
          >
            Смотреть все →
          </Link>
          {config.columns.flatMap((col) =>
            col.sections.map((section) => (
              <MegaSectionBlock
                key={section.title}
                section={section}
                onNavigate={onNavigate}
                onOpenWizard={onOpenWizard}
                compact
              />
            )),
          )}
          {config.promo && (
            <div className="mx-3 mt-1 mb-1 rounded-lg bg-primary/10 px-3 py-2.5">
              <p className="text-xs font-semibold text-foreground">
                {config.promo.title}
              </p>
              <Link
                to={config.promo.href}
                onClick={onNavigate}
                className="inline-flex mt-2 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold items-center"
              >
                {config.promo.cta}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
