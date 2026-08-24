import { Building2, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";
import VerifiedBadge from "@/components/VerifiedBadge";
import { DEFAULT_AGENT } from "@/config/defaultAgent";
import { useActivePropertiesCount } from "@/hooks/useProperties";
import { formatAgentObjectsLabel } from "@/lib/propertyCard";
import { getListingAgentDisplay } from "@/lib/propertySidebar";
import { cn } from "@/lib/utils";

interface Props {
  extras?: Record<string, unknown> | null;
  district?: string | null;
  /** Доп. элемент справа (район уже через district) */
  trailing?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export default function ListingAgentFooter({
  extras,
  district,
  trailing,
  className,
  compact = false,
}: Props) {
  const { data: catalogCount } = useActivePropertiesCount();
  const extrasRecord = extras as Record<string, unknown> | null;
  const agent = getListingAgentDisplay(extras) ?? {
    primaryLabel: DEFAULT_AGENT.name,
    secondaryLabel: `Менеджер · «${DEFAULT_AGENT.agencyName}»`,
    avatarUrl: DEFAULT_AGENT.avatar,
    isVerified: DEFAULT_AGENT.isVerified,
    isRealtor: false,
    isAgency: false,
    agencyId: null,
    objectsCount: 0,
  };

  const isAgencyListing =
    (agent.isAgency || agent.isRealtor) && !extrasRecord?.owner_user_id;
  const objectsCount = isAgencyListing
    ? Math.max(agent.objectsCount, catalogCount ?? 0)
    : agent.objectsCount;

  const avatar = agent.avatarUrl || consultantAvatar;
  const objectsLabel = formatAgentObjectsLabel(objectsCount, {
    isAgency: isAgencyListing,
  });
  const agencyHref = agent.agencyId ? `/agentstvo/${agent.agencyId}` : null;

  const nameBlock = (
    <>
      <div className="flex items-center gap-1 min-w-0">
        {(agent.isAgency || agent.isRealtor) &&
          agent.primaryLabel !== agent.secondaryLabel && (
            <Building2 className="w-3 h-3 text-primary shrink-0" />
          )}
        <span
          className={cn(
            "text-xs font-semibold truncate leading-tight",
            agencyHref
              ? "text-primary group-hover/agent:underline"
              : "text-foreground",
          )}
        >
          {agent.primaryLabel}
        </span>
        {agent.isVerified && (
          <VerifiedBadge size="sm" showLabel={false} className="shrink-0" />
        )}
      </div>
      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
        {agent.secondaryLabel}
        {objectsLabel && (
          <>
            <span className="mx-1 opacity-40">·</span>
            {objectsLabel}
          </>
        )}
      </p>
    </>
  );

  return (
    <div className={cn("mt-auto pt-3", className)}>
      <div
        className={cn("flex items-center gap-2.5", compact ? "py-1" : "py-1.5")}
      >
        {agencyHref ? (
          <Link
            to={agencyHref}
            onClick={(e) => e.stopPropagation()}
            className="group/agent flex items-center gap-2.5 min-w-0 flex-1"
          >
            <img
              src={avatar}
              alt={agent.primaryLabel}
              className={cn(
                "rounded-lg object-cover shrink-0 bg-muted",
                compact ? "w-8 h-8" : "w-9 h-9",
              )}
            />
            <div className="min-w-0 flex-1">{nameBlock}</div>
          </Link>
        ) : (
          <>
            <img
              src={avatar}
              alt={agent.primaryLabel}
              className={cn(
                "rounded-lg object-cover shrink-0 bg-muted",
                compact ? "w-8 h-8" : "w-9 h-9",
              )}
            />
            <div className="min-w-0 flex-1">{nameBlock}</div>
          </>
        )}

        <div className="shrink-0 flex flex-col items-end gap-1 max-w-[40%]">
          {district && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground truncate">
              <MapPin className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">{district}</span>
            </span>
          )}
          {trailing}
        </div>
      </div>
    </div>
  );
}
