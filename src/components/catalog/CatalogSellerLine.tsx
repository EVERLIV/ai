import { Building2, User } from "lucide-react";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import VerifiedBadge from "@/components/VerifiedBadge";
import { formatAgentObjectsLabel } from "@/lib/propertyCard";
import { getListingAgentDisplay } from "@/lib/propertySidebar";
import { publicStorageUrl } from "@/lib/storageUrl";
import { cn } from "@/lib/utils";

interface Props {
  extras?: Record<string, unknown> | null;
  className?: string;
}

/** Навигация без <a> — безопасно внутри карточки-Link. */
function InlineNav({
  to,
  className,
  children,
}: {
  to: string;
  className?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();

  const go = (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(to);
  };

  return (
    <span
      role="link"
      tabIndex={0}
      className={cn("cursor-pointer", className)}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") go(e);
      }}
    >
      {children}
    </span>
  );
}

/**
 * Компактная строка продавца для каталога-агрегатора.
 * Без fallback на DEFAULT_AGENT (Анастасия) — только данные из extras.
 */
export default function CatalogSellerLine({ extras, className }: Props) {
  const agent = getListingAgentDisplay(extras);

  if (!agent) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0",
          className,
        )}
      >
        <User className="w-3 h-3 shrink-0 opacity-60" />
        <span className="truncate">Собственник</span>
      </div>
    );
  }

  const objectsLabel = formatAgentObjectsLabel(agent.objectsCount, {
    isAgency: (agent.isAgency || agent.isRealtor) && !agent.isDeveloper,
  });
  const agencyHref = agent.agencyId ? `/agentstvo/${agent.agencyId}` : null;
  const managerHref = agent.managerId ? `/rieltor/${agent.managerId}` : null;
  const developerHref = agent.developerId
    ? `/zastroyshchik/${agent.developerId}`
    : null;
  const primaryHref = developerHref || agencyHref;

  return (
    <div
      className={cn(
        "group/seller flex items-center gap-1.5 text-[11px] min-w-0",
        className,
      )}
    >
      {agent.avatarUrl && !agent.isDeveloper ? (
        <img
          src={publicStorageUrl(agent.avatarUrl) || agent.avatarUrl}
          alt=""
          className="w-6 h-6 rounded object-cover shrink-0 bg-muted"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span className="w-6 h-6 rounded bg-muted flex items-center justify-center shrink-0">
          {(agent.isAgency || agent.isRealtor || agent.isDeveloper) && (
            <Building2 className="w-3 h-3 text-muted-foreground" />
          )}
          {!agent.isAgency && !agent.isRealtor && !agent.isDeveloper && (
            <User className="w-3 h-3 text-muted-foreground" />
          )}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">
        {primaryHref ? (
          <InlineNav
            to={primaryHref}
            className={cn(
              "font-medium text-foreground hover:underline",
              "group-hover/seller:underline",
            )}
          >
            {agent.primaryLabel}
          </InlineNav>
        ) : (
          <span className="font-medium text-foreground">
            {agent.primaryLabel}
          </span>
        )}
        {agent.secondaryLabel &&
          agent.secondaryLabel !== agent.primaryLabel && (
            <>
              <span className="mx-1 opacity-40">·</span>
              {managerHref ? (
                <InlineNav
                  to={managerHref}
                  className="text-muted-foreground hover:underline"
                >
                  {agent.secondaryLabel}
                </InlineNav>
              ) : (
                <span className="text-muted-foreground">
                  {agent.secondaryLabel}
                </span>
              )}
            </>
          )}
        {objectsLabel && !agent.isDeveloper && (
          <>
            <span className="mx-1 opacity-40">·</span>
            <span className="text-muted-foreground">{objectsLabel}</span>
          </>
        )}
      </span>
      {agent.isVerified && (
        <VerifiedBadge size="sm" showLabel={false} className="shrink-0" />
      )}
    </div>
  );
}
