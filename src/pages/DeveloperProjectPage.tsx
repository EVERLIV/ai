import {
  ArrowLeft,
  Building2,
  Loader2,
  MapPin,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import DeveloperPromotions from "@/components/developers/DeveloperPromotions";
import PropertyGridCard from "@/components/PropertyGridCard";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SpecialistContactForm from "@/components/specialists/SpecialistContactForm";
import {
  useDeveloperPublic,
  useDeveloperPublicProperties,
  useProjectConstructionStages,
  useProjectMedia,
  useProjectPhases,
  useProjectPublic,
  useProjectUnitTypes,
  useTrackDeveloperEvent,
} from "@/hooks/useDeveloper";
import { useAuth } from "@/hooks/useAuth";
import type { DbProperty } from "@/hooks/useProperties";
import {
  DEVELOPER_PROJECT_KIND_LABELS,
  DEVELOPER_PROJECT_STATUS_LABELS,
  parseDeveloperPromotions,
  type Developer,
} from "@/lib/developerTypes";

const DEVELOPER_INTENTS = [
  "Купить квартиру",
  "Ипотека",
  "Рассрочка",
  "Показ",
  "Другой запрос",
] as const;

export default function DeveloperProjectPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: project, isLoading, error } = useProjectPublic(id);
  const { data: unitTypes = [] } = useProjectUnitTypes(id);
  const { data: phases = [] } = useProjectPhases(id);
  const { data: stages = [] } = useProjectConstructionStages(id, true);
  const { data: media = [] } = useProjectMedia(id);
  const developerEmbed = (
    Array.isArray(project?.developers)
      ? project?.developers[0]
      : project?.developers
  ) as Developer | undefined;
  const { data: developerFull } = useDeveloperPublic(
    developerEmbed?.id || project?.developer_id,
  );
  const developer = developerFull || developerEmbed;
  const { data: rawProperties = [] } = useDeveloperPublicProperties(
    project?.developer_id,
    project?.id,
  );
  const track = useTrackDeveloperEvent();

  const properties = rawProperties as unknown as DbProperty[];
  const propertyByUnit = useMemo(() => {
    const map = new Map<string, DbProperty>();
    for (const p of properties) {
      const uid = (p as { developer_unit_type_id?: string | null })
        .developer_unit_type_id;
      if (uid && !map.has(uid)) map.set(uid, p);
    }
    return map;
  }, [properties]);

  const promotions = useMemo(() => {
    const fromDev = parseDeveloperPromotions(developer?.promotions);
    if (fromDev.length) return fromDev;
    const fallback = [];
    if (project?.mortgage_terms) {
      fallback.push({
        title: "Ипотека",
        text: project.mortgage_terms,
        badge: "Акция",
      });
    }
    if (project?.installment_terms) {
      fallback.push({
        title: "Рассрочка",
        text: project.installment_terms,
        badge: "Акция",
      });
    }
    return fallback;
  }, [developer?.promotions, project?.mortgage_terms, project?.installment_terms]);

  const isHouseSeries = project?.project_kind === "house_series";
  const developerIntents = isHouseSeries
    ? (["Дом на заказ", "Ипотека", "Рассрочка", "Показ", "Другой запрос"] as const)
    : DEVELOPER_INTENTS;

  useEffect(() => {
    if (!project?.id) return;
    track.mutate({
      event_type: "view_project",
      developer_id: project.developer_id,
      project_id: project.id,
      source_page: `/proekt/${project.id}`,
      actor_id: user?.id || null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Загрузка…
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-xl font-semibold">Проект не найден</h1>
          <Link
            to="/zastroyshchiki"
            className="text-primary text-sm mt-4 inline-block hover:underline"
          >
            К застройщикам
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const backHref = developer
    ? `/zastroyshchik/${developer.id}`
    : "/zastroyshchiki";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title={`${project.title} — проект застройщика`}
        description={project.description?.slice(0, 160) || project.title}
      />
      <SiteHeader />

      <div className="mt-[56px] lg:mt-[104px] border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-8 h-10 flex items-center">
          <Link
            to={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            {developer?.name || "Застройщик"}
          </Link>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <div className="flex-1 min-w-0 space-y-8">
            <section className="overflow-hidden rounded-xl border border-border/60 bg-card">
              <div className="aspect-[16/7] min-h-[200px] max-h-[320px] bg-muted">
                {project.cover_photo ? (
                  <img
                    src={project.cover_photo}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="p-5 space-y-2">
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {isHouseSeries
                      ? "Под заказ"
                      : DEVELOPER_PROJECT_STATUS_LABELS[project.status]}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {DEVELOPER_PROJECT_KIND_LABELS[project.project_kind]}
                  </span>
                  {!isHouseSeries && project.delivery_year && (
                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      Сдача {project.delivery_year}
                      {project.delivery_quarter
                        ? ` Q${project.delivery_quarter}`
                        : ""}
                    </span>
                  )}
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold">
                  {project.title}
                </h1>
                {project.address && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {project.address}
                  </p>
                )}
              </div>
            </section>

            {project.description && (
              <section>
                <h2 className="text-lg font-semibold mb-2">О проекте</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {project.description}
                </p>
              </section>
            )}

            <DeveloperPromotions promotions={promotions} />

            {unitTypes.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">
                  {isHouseSeries ? "Модели серии" : "Планировки"}
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {unitTypes.map((u) => {
                    const listing = propertyByUnit.get(u.id);
                    const href = listing
                      ? `/property/${listing.id}`
                      : properties[0]
                        ? `/property/${properties[0].id}`
                        : null;
                    const inner = (
                      <>
                        {u.plan_image_url && (
                          <div className="aspect-[16/10] bg-muted">
                            <img
                              src={u.plan_image_url}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-4 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold group-hover:text-primary">
                              {u.title}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {u.rooms}
                              {u.area_from != null
                                ? ` · от ${u.area_from} м²`
                                : ""}
                            </p>
                          </div>
                          {u.price_from != null && (
                            <div className="text-sm font-semibold tabular-nums shrink-0">
                              от {Number(u.price_from).toLocaleString("ru-RU")} ₽
                            </div>
                          )}
                        </div>
                      </>
                    );
                    const className =
                      "group rounded-xl border border-border/60 overflow-hidden bg-card hover:border-border hover:bg-muted/20 transition-colors text-left block";
                    return href ? (
                      <Link key={u.id} to={href} className={className}>
                        {inner}
                      </Link>
                    ) : (
                      <div key={u.id} className={className}>
                        {inner}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {properties.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-lg font-semibold">
                  {isHouseSeries ? "Дома на заказ" : "Квартиры"}
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {properties.map((p) => (
                    <PropertyGridCard key={p.id} property={p} />
                  ))}
                </div>
              </section>
            )}

            {!isHouseSeries && phases.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Очереди</h2>
                <ul className="rounded-xl border border-border/60 divide-y divide-border/60 bg-card">
                  {phases.map((ph) => (
                    <li key={ph.id} className="px-4 py-3 text-sm">
                      {ph.name}
                      {ph.delivery_year ? ` · ${ph.delivery_year}` : ""}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {stages.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">
                  Ход строительства
                </h2>
                <ul className="rounded-xl border border-border/60 divide-y divide-border/60 bg-card">
                  {stages.map((s) => (
                    <li key={s.id} className="px-4 py-3 text-sm">
                      <div className="font-medium">{s.title}</div>
                      {s.stage_date && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {s.stage_date}
                        </div>
                      )}
                      {s.description && (
                        <p className="text-muted-foreground mt-1 text-xs">
                          {s.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {media.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Галерея</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {media.map((m) => (
                    <a
                      key={m.id}
                      href={m.url}
                      target="_blank"
                      rel="noreferrer"
                      className="aspect-video rounded-lg overflow-hidden bg-muted border border-border/40"
                    >
                      <img
                        src={m.url}
                        alt={m.caption || ""}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="lg:w-[340px] shrink-0">
            <div className="sticky top-24">
              <SpecialistContactForm
                title="Оставить заявку"
                source="developer_contact"
                targetLabel={developer?.name || project.title}
                intents={developerIntents}
              />
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
