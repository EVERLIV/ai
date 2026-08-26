import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import CatalogCountChip from "@/components/specialists/CatalogCountChip";
import { RatingBadge } from "@/components/specialists/SpecialistReviews";
import { pluralProjects } from "@/components/specialists/specialistUtils";
import VerifiedBadge from "@/components/VerifiedBadge";
import {
  DEVELOPER_SUBTYPE_LABELS,
  type Developer,
} from "@/lib/developerTypes";
import { cn } from "@/lib/utils";

type Props = {
  developer: Developer;
  projectsCount?: number;
  className?: string;
};

export default function DeveloperListCard({
  developer,
  projectsCount = 0,
  className,
}: Props) {
  const verified = developer.verification_status === "verified";

  return (
    <article className={cn("py-2", className)}>
      <Link
        to={`/zastroyshchik/${developer.id}`}
        className={cn(
          "group flex gap-3 sm:gap-4 items-start p-4 sm:p-5",
          "rounded-xl border border-border/60 bg-card",
          "hover:border-border hover:bg-muted/20 transition-colors",
        )}
      >
        <div className="w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem] rounded-xl border border-border/60 overflow-hidden bg-muted shrink-0 flex items-center justify-center">
          {developer.logo_url ? (
            <img
              src={developer.logo_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <Building2 className="w-6 h-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-[15px] sm:text-base font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                {developer.name}
              </h3>
              {verified && <VerifiedBadge size="sm" showLabel={false} />}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {DEVELOPER_SUBTYPE_LABELS[developer.subtype]}
              {developer.city ? ` · ${developer.city}` : ""}
            </p>
            <RatingBadge
              avgRating={developer.avg_rating}
              reviewsCount={developer.reviews_count}
            />
          </div>

          {developer.about && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {developer.about}
            </p>
          )}
        </div>

        <div className="shrink-0 self-center">
          <CatalogCountChip
            count={projectsCount}
            label={pluralProjects(projectsCount)}
          />
        </div>
      </Link>
    </article>
  );
}
