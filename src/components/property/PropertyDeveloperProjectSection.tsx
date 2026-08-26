import { ArrowRight, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import {
  useDeveloperPublicProperties,
  useProjectPublic,
} from "@/hooks/useDeveloper";
import {
  buildPropertyDisplayTitle,
  formatPropertyPrice,
} from "@/lib/propertyCard";
import { getPropertyDeveloperId } from "@/lib/listingSource";

type Props = {
  property: {
    id: string;
    developer_id?: string | null;
    developer_project_id?: string | null;
    type?: string | null;
    deal_type?: string | null;
    segment?: string | null;
    area?: number | null;
    price?: number | null;
    address?: string | null;
    district?: string | null;
    photos?: string[] | null;
    cover_photo?: string | null;
    extras?: Record<string, unknown> | null;
  };
};

/** Блок проекта застройщика + другие квартиры/дома в этом проекте */
export default function PropertyDeveloperProjectSection({ property }: Props) {
  const projectId =
    (property as { developer_project_id?: string | null })
      .developer_project_id || null;
  const developerId = getPropertyDeveloperId(property);

  const { data: project } = useProjectPublic(projectId || undefined);
  const { data: siblings = [] } = useDeveloperPublicProperties(
    developerId || undefined,
    projectId,
  );

  if (!projectId || !project) return null;

  const others = siblings.filter((p) => String(p.id) !== property.id);
  const isHouseSeries = project.project_kind === "house_series";
  const listLabel = isHouseSeries
    ? "Другие дома в проекте"
    : "Другие квартиры в проекте";

  const cover = project.cover_photo || null;

  return (
    <section className="mb-10 scroll-mt-14" id="project">
      <h2 className="font-display text-lg font-semibold text-foreground mb-4">
        Проект
      </h2>

      <Link
        to={`/proekt/${project.id}`}
        className="group flex gap-3 sm:gap-4 rounded-xl border border-border/70 bg-card overflow-hidden hover:border-border transition-colors"
      >
        <div className="w-28 sm:w-40 shrink-0 bg-muted aspect-[4/3] sm:aspect-auto sm:self-stretch">
          {cover ? (
            <img
              src={cover}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Building2 className="w-8 h-8 opacity-40" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 py-3 pr-3 sm:py-4 sm:pr-4 flex flex-col justify-center">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
            {isHouseSeries ? "Серия домов" : "Жилой комплекс"}
          </p>
          <h3 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {project.title}
          </h3>
          {(project.address || project.district) && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
              {[project.district, project.address].filter(Boolean).join(" · ")}
            </p>
          )}
          {project.description?.trim() && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 hidden sm:block">
              {project.description.trim()}
            </p>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-2">
            Открыть проект
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>

      {others.length > 0 && (
        <div className="mt-6">
          <div className="flex items-end justify-between gap-3 mb-3">
            <h3 className="text-sm font-semibold text-foreground">
              {listLabel}
            </h3>
            <Link
              to={`/proekt/${project.id}`}
              className="text-xs text-primary hover:underline shrink-0"
            >
              Все в проекте
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
            {others.slice(0, 12).map((row) => {
              const p = row as {
                id: string;
                photos?: string[] | null;
                cover_photo?: string | null;
                price?: number | null;
                area?: number | null;
                type?: string | null;
                deal_type?: string | null;
                address?: string | null;
                district?: string | null;
                segment?: string | null;
                extras?: Record<string, unknown> | null;
              };
              const img =
                p.photos?.find(Boolean) || p.cover_photo || "/placeholder.svg";
              const title = buildPropertyDisplayTitle(p);
              const price = formatPropertyPrice(p);
              return (
                <Link
                  key={p.id}
                  to={`/property/${p.id}`}
                  className="shrink-0 w-[200px] sm:w-[220px] rounded-lg border border-border/60 bg-card overflow-hidden hover:border-border transition-colors"
                >
                  <div className="aspect-[4/3] bg-muted">
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2.5 space-y-1">
                    <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">
                      {title}
                    </p>
                    <p className="text-sm font-semibold tabular-nums">
                      {price ?? "По запросу"}
                    </p>
                    {Number(p.area) > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        {Number(p.area).toLocaleString("ru-RU")} м²
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
