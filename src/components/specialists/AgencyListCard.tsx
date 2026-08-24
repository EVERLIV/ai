import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { RatingBadge } from "@/components/specialists/SpecialistReviews";
import VerifiedBadge from "@/components/VerifiedBadge";
import type { PublicAgencyCard } from "@/lib/agencyApi";
import { cn } from "@/lib/utils";
import { pluralObjects } from "./specialistUtils";

type Props = {
  agency: PublicAgencyCard;
  className?: string;
};

export default function AgencyListCard({ agency, className }: Props) {
  const verified = agency.verification_status === "verified";

  return (
    <article className={cn("py-2", className)}>
      <Link
        to={`/agentstvo/${agency.id}`}
        className={cn(
          "group flex gap-4 sm:gap-5 items-start p-4 sm:p-5",
          "rounded-xl border border-border/60 bg-card",
          "hover:border-border hover:bg-muted/20 transition-colors",
        )}
      >
        <div className="w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem] rounded-xl border border-border/60 overflow-hidden bg-muted shrink-0 flex items-center justify-center">
          {agency.logo_url ? (
            <img
              src={agency.logo_url}
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
                {agency.name}
              </h3>
              {verified && <VerifiedBadge size="sm" showLabel={false} />}
            </div>
            <RatingBadge
              avgRating={agency.avg_rating}
              reviewsCount={agency.reviews_count}
            />
          </div>

          {agency.about && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {agency.about}
            </p>
          )}

          <p className="text-[11px] text-muted-foreground">
            {agency.managers_count}{" "}
            {agency.managers_count === 1
              ? "специалист"
              : agency.managers_count >= 2 && agency.managers_count <= 4
                ? "специалиста"
                : "специалистов"}
            {agency.response_minutes
              ? ` · ответ ~${agency.response_minutes} мин`
              : ""}
          </p>
        </div>

        <div className="shrink-0 self-center text-right pl-1">
          <div className="min-w-[4.5rem] rounded-xl bg-muted/50 px-3 py-2.5">
            <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums leading-none">
              {agency.objects_count}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 leading-snug">
              {pluralObjects(agency.objects_count)}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
