import { Link } from "react-router-dom";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { getCatalogMegaMenu, type MegaMenuConfig, type MegaSection } from "@/lib/catalogMegaMenu";
import type { PropertySegment } from "@/config/propertySegments";
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
    <div className={compact ? "space-y-1.5" : "space-y-2"}>
      <div className={cn(
        "font-semibold text-foreground",
        compact ? "text-xs px-2 pt-2" : "text-sm",
      )}>
        {section.title}
      </div>
      <ul className={compact ? "space-y-0.5" : "space-y-1"}>
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
                  compact ? "block px-2 py-1.5 text-xs" : "block py-0.5 text-sm",
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
                  compact ? "block px-2 py-1.5 text-xs" : "block py-0.5 text-sm",
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
  return (
    <div className={cn("bg-card shadow-[0_16px_48px_-12px_rgba(0,0,0,0.18)] border border-border/60 overflow-hidden", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
        {config.columns.map((column, idx) => (
          <div
            key={idx}
            className={cn(
              "px-5 py-5 space-y-6",
              idx > 0 && "lg:border-l border-border/50",
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
        <div className="px-5 py-5 bg-[#E1F1FF] dark:bg-primary/15 border-t lg:border-t-0 lg:border-l border-border/50">
          <MegaSectionBlock
            section={config.services}
            onNavigate={onNavigate}
            onOpenWizard={onOpenWizard}
          />
        </div>
      </div>
    </div>
  );
}

/** Desktop trigger + hover mega panel */
export function CatalogMegaMenuDesktop({
  segment,
  isActive,
  isLoggedIn,
  onOpenWizard,
}: {
  segment: PropertySegment;
  isActive: boolean;
  isLoggedIn?: boolean;
  onOpenWizard?: () => void;
}) {
  const config = getCatalogMegaMenu(segment, !!isLoggedIn);

  return (
    <div className="relative group/mega ml-2">
      <Link
        to={config.catalogHref}
        className={cn(
          "inline-flex items-center gap-1 h-8 px-3.5 rounded-md text-sm font-semibold transition-colors duration-200",
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground",
        )}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        {config.triggerLabel}
        <ChevronDown className="w-3 h-3 opacity-70 transition-transform duration-300 group-hover/mega:rotate-180" />
      </Link>

      <div className="absolute top-full right-0 pt-2 w-[min(920px,calc(100vw-2rem))] opacity-0 invisible -translate-y-2 pointer-events-none group-hover/mega:opacity-100 group-hover/mega:visible group-hover/mega:translate-y-0 group-hover/mega:pointer-events-auto transition-all duration-200 ease-out z-50">
        <CatalogMegaPanel config={config} onOpenWizard={onOpenWizard} />
      </div>
    </div>
  );
}

/** Mobile list of mega categories */
export function CatalogMegaMenuMobile({
  segment,
  isLoggedIn,
  onNavigate,
  onOpenWizard,
}: {
  segment: PropertySegment;
  isLoggedIn?: boolean;
  onNavigate: () => void;
  onOpenWizard?: () => void;
}) {
  const config = getCatalogMegaMenu(segment, !!isLoggedIn);

  return (
    <div className="mb-3 space-y-3">
      <Link
        to={config.catalogHref}
        onClick={onNavigate}
        className="flex items-center justify-center gap-2 h-10 rounded-md text-sm font-semibold bg-primary text-primary-foreground"
      >
        <LayoutGrid className="w-4 h-4" />
        {config.triggerLabel}
      </Link>

      <div className="rounded-lg border border-border/60 overflow-hidden divide-y divide-border/50 max-h-[50vh] overflow-y-auto">
        {config.columns.flatMap((column) => column.sections).map((section) => (
          <MegaSectionBlock
            key={section.title}
            section={section}
            onNavigate={onNavigate}
            onOpenWizard={onOpenWizard}
            compact
          />
        ))}
        <div className="bg-[#E1F1FF] dark:bg-primary/15">
          <MegaSectionBlock
            section={config.services}
            onNavigate={onNavigate}
            onOpenWizard={onOpenWizard}
            compact
          />
        </div>
      </div>
    </div>
  );
}
