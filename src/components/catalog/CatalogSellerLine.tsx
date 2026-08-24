import { Building2, User } from "lucide-react";
import { Link } from "react-router-dom";
import VerifiedBadge from "@/components/VerifiedBadge";
import { formatAgentObjectsLabel } from "@/lib/propertyCard";
import { getListingAgentDisplay } from "@/lib/propertySidebar";
import { cn } from "@/lib/utils";

interface Props {
  extras?: Record<string, unknown> | null;
  className?: string;
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
    isAgency: agent.isAgency || agent.isRealtor,
  });
  const agencyHref = agent.agencyId ? `/agentstvo/${agent.agencyId}` : null;

  const body = (
    <>
      {agent.avatarUrl ? (
        <img
          src={agent.avatarUrl}
          alt=""
          className="w-6 h-6 rounded object-cover shrink-0 bg-muted"
        />
      ) : (
        <span className="w-6 h-6 rounded bg-muted flex items-center justify-center shrink-0">
          {(agent.isAgency || agent.isRealtor) && (
            <Building2 className="w-3 h-3 text-muted-foreground" />
          )}
          {!agent.isAgency && !agent.isRealtor && (
            <User className="w-3 h-3 text-muted-foreground" />
          )}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate">
        <span
          className={cn(
            "font-medium",
            agencyHref ? "text-foreground group-hover/seller:underline" : "text-foreground",
          )}
        >
          {agent.primaryLabel}
        </span>
        {agent.secondaryLabel &&
          agent.secondaryLabel !== agent.primaryLabel && (
            <>
              <span className="mx-1 opacity-40">·</span>
              <span className="text-muted-foreground">
                {agent.secondaryLabel}
              </span>
            </>
          )}
        {objectsLabel && (
          <>
            <span className="mx-1 opacity-40">·</span>
            <span className="text-muted-foreground">{objectsLabel}</span>
          </>
        )}
      </span>
      {agent.isVerified && (
        <VerifiedBadge size="sm" showLabel={false} className="shrink-0" />
      )}
    </>
  );

  if (agencyHref) {
    return (
      <Link
        to={agencyHref}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "group/seller flex items-center gap-1.5 text-[11px] min-w-0",
          className,
        )}
      >
        {body}
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-[11px] min-w-0",
        className,
      )}
    >
      {body}
    </div>
  );
}
