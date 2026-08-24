import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { RatingBadge } from "@/components/specialists/SpecialistReviews";
import VerifiedBadge from "@/components/VerifiedBadge";
import type { PublicManagerCard } from "@/lib/agencyApi";
import { cn } from "@/lib/utils";
import { pluralObjects } from "./specialistUtils";

type Props = {
  manager: PublicManagerCard;
  className?: string;
};

export default function RealtorListCard({ manager, className }: Props) {
  const types = manager.property_types ?? [];
  const verified = manager.agency.verification_status === "verified";

  return (
    <article className={cn("py-2", className)}>
      <Link
        to={`/rieltor/${manager.id}`}
        className={cn(
          "group flex gap-4 sm:gap-5 items-start p-4 sm:p-5",
          "rounded-xl border border-border/60 bg-card",
          "hover:border-border hover:bg-muted/20 transition-colors",
        )}
      >
        <div className="w-14 h-14 sm:w-[4.5rem] sm:h-[4.5rem] rounded-full overflow-hidden bg-muted shrink-0 ring-1 ring-border/50">
          {manager.photo_url ? (
            <img
              src={manager.photo_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-muted-foreground">
              {manager.full_name?.[0] || "?"}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-[15px] sm:text-base font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                {manager.full_name}
              </h3>
              {verified && <VerifiedBadge size="sm" showLabel={false} />}
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <RatingBadge
                avgRating={manager.avg_rating}
                reviewsCount={manager.reviews_count}
              />
              {manager.response_minutes != null &&
                manager.response_minutes > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    ответ ~{manager.response_minutes} мин
                  </span>
                )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5 min-w-0">
            <Building2 className="w-3.5 h-3.5 shrink-0 opacity-60" />
            <span className="truncate">{manager.agency.name}</span>
          </p>

          {types.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {types.slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="rounded-lg bg-muted/70 px-2 py-1 text-[11px] text-muted-foreground leading-none"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 self-center text-right pl-1">
          <div className="min-w-[4.5rem] rounded-xl bg-muted/50 px-3 py-2.5">
            <div className="text-lg sm:text-xl font-semibold text-foreground tabular-nums leading-none">
              {manager.objects_count}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 leading-snug max-w-[5.5rem] ml-auto">
              {pluralObjects(manager.objects_count)} в работе
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
