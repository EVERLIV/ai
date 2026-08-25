import { Building2, Check, ChevronDown, Home, Map } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  type PropertySegment,
  SEGMENT_ROUTES,
} from "@/config/propertySegments";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  onNavigate?: () => void;
}

const SEGMENTS = [
  {
    id: "commercial" as const,
    label: "Коммерческая",
    hint: "Офисы, торговля, склады",
    href: SEGMENT_ROUTES.commercial.home,
    Icon: Building2,
  },
  {
    id: "residential" as const,
    label: "Жилая",
    hint: "Квартиры, дома, комнаты",
    href: SEGMENT_ROUTES.residential.home,
    Icon: Home,
  },
  {
    id: "land" as const,
    label: "Земля",
    hint: "Участки: ИЖС, жилая, коммерция",
    href: SEGMENT_ROUTES.land.home,
    Icon: Map,
  },
];

function segmentFromPath(pathname: string): PropertySegment {
  if (pathname.startsWith("/zhilaya")) return "residential";
  if (pathname.startsWith("/zemlya") || pathname.startsWith("/land"))
    return "land";
  return "commercial";
}

export default function SegmentSwitcher({ className, onNavigate }: Props) {
  const { pathname } = useLocation();
  const currentId = segmentFromPath(pathname);
  const current = SEGMENTS.find((s) => s.id === currentId) ?? SEGMENTS[0];
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div ref={rootRef} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Сменить раздел недвижимости"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 max-w-[9.5rem] sm:max-w-none h-8 pl-2.5 pr-1.5 rounded-full",
          "text-[12px] font-medium text-foreground/80 hover:text-foreground",
          "bg-muted/50 hover:bg-muted border border-transparent hover:border-border/60",
          "transition-colors",
          open && "bg-muted border-border/60 text-foreground",
        )}
      >
        <span className="truncate">{current.label}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        className={cn(
          "absolute left-0 top-full pt-2 z-50 w-[min(18.5rem,calc(100vw-2rem))]",
          "transition-all duration-200 origin-top",
          open
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible -translate-y-1 pointer-events-none",
        )}
      >
        <div
          role="listbox"
          aria-label="Раздел недвижимости"
          className="rounded-xl border border-border/80 bg-card shadow-[0_16px_40px_-16px_rgba(0,0,0,0.28)] overflow-hidden"
        >
          <div className="px-3.5 pt-3 pb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Раздел сайта
            </p>
          </div>
          <div className="px-1.5 pb-1.5 space-y-0.5">
            {SEGMENTS.map(({ id, label, hint, href, Icon }) => {
              const active = id === currentId;
              return (
                <Link
                  key={id}
                  role="option"
                  aria-selected={active}
                  to={href}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 transition-colors",
                    active ? "bg-primary/8" : "hover:bg-muted/70",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          active ? "text-foreground" : "text-foreground/90",
                        )}
                      >
                        {label}
                      </span>
                      {active && (
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      )}
                    </span>
                    <span className="block text-[11px] text-muted-foreground leading-snug mt-0.5">
                      {hint}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
          <div className="border-t border-border/60 px-3.5 py-2.5">
            <Link
              to="/"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Все разделы на главной →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
