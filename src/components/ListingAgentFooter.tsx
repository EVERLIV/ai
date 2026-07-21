import { Building2, MapPin } from "lucide-react";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";
import VerifiedBadge from "@/components/VerifiedBadge";
import { getListingAgentDisplay } from "@/lib/propertySidebar";
import { cn } from "@/lib/utils";

interface Props {
  extras?: Record<string, unknown> | null;
  district?: string | null;
  /** Доп. элемент справа (например, кадастровый номер) */
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
  const agent = getListingAgentDisplay(extras) ?? {
    primaryLabel: "Анастасия Романова",
    secondaryLabel: "Риелтор · «Аренда Сити»",
    avatarUrl: consultantAvatar,
    isVerified: true,
    isRealtor: false,
    objectsCount: 0,
  };

  const avatar = agent.avatarUrl || consultantAvatar;
  const objectsLabel =
    agent.objectsCount > 0
      ? `${agent.objectsCount} ${agent.objectsCount === 1 ? "объект" : agent.objectsCount < 5 ? "объекта" : "объектов"}`
      : null;

  return (
    <div className={cn("mt-auto pt-3", className)}>
      <div className={cn("flex items-center gap-2.5", compact ? "py-1" : "py-1.5")}>
        <img
          src={avatar}
          alt={agent.primaryLabel}
          className={cn(
            "rounded-lg object-cover shrink-0 bg-muted",
            compact ? "w-8 h-8" : "w-9 h-9",
          )}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 min-w-0">
            {agent.isRealtor && agent.primaryLabel !== agent.secondaryLabel && (
              <Building2 className="w-3 h-3 text-primary shrink-0" />
            )}
            <span className="text-xs font-semibold text-foreground truncate leading-tight">
              {agent.primaryLabel}
            </span>
            {agent.isVerified && <VerifiedBadge size="sm" showLabel={false} className="shrink-0" />}
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
        </div>

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
