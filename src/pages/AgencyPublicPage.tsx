import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Loader2,
  Phone,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import StorageImage from "@/components/StorageImage";
import SpecialistContactForm from "@/components/specialists/SpecialistContactForm";
import SpecialistReviews, {
  RatingBadge,
} from "@/components/specialists/SpecialistReviews";
import { pluralObjects } from "@/components/specialists/specialistUtils";
import VerifiedBadge from "@/components/VerifiedBadge";
import {
  useAgencyManagers,
  useAgencyPublic,
  useAgencyPublicProperties,
} from "@/hooks/useAgency";
import { isProfileVerified } from "@/hooks/useProfile";
import { buildCatalogUrl } from "@/lib/catalogLinks";

export default function AgencyPublicPage() {
  const { id } = useParams<{ id: string }>();
  const { data: agency, isLoading, error } = useAgencyPublic(id);
  const { data: managers = [] } = useAgencyManagers(id, true);
  const { data: rawProperties = [], isLoading: propsLoading } =
    useAgencyPublicProperties(id);

  const listingCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of rawProperties as { listing_manager_id?: string | null }[]) {
      const mid = p.listing_manager_id;
      if (!mid) continue;
      map.set(mid, (map.get(mid) || 0) + 1);
    }
    return map;
  }, [rawProperties]);

  const objectsCount = rawProperties.length;
  const catalogHref = buildCatalogUrl({ agency: id || "" });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Загрузка…
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-xl font-semibold">Агентство не найдено</h1>
          <Link
            to="/rieltory?tab=agentstva"
            className="text-primary text-sm mt-4 inline-block hover:underline"
          >
            Все агентства
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const verified = isProfileVerified(agency.verification_status);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title={`${agency.name} — агентство недвижимости`}
        description={
          agency.about?.slice(0, 160) ||
          `Объекты агентства ${agency.name} на АрендаСити`
        }
      />
      <SiteHeader />

      <div className="mt-[56px] lg:mt-[104px] border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-8 h-10 flex items-center">
          <Link
            to="/rieltory?tab=agentstva"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Все специалисты
          </Link>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <div className="flex-1 min-w-0 space-y-8">
            <section className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                {agency.logo_url ? (
                  <StorageImage
                    src={agency.logo_url}
                    alt=""
                    className="w-full h-full object-cover"
                    fallback={
                      <Building2 className="w-8 h-8 text-muted-foreground" />
                    }
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    {agency.name}
                  </h1>
                  {verified && <VerifiedBadge />}
                </div>
                {verified && (
                  <p className="text-xs text-primary">
                    Документы агентства проверены
                  </p>
                )}
                {agency.about && (
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl whitespace-pre-line">
                    {agency.about}
                  </p>
                )}
              </div>
            </section>

            <div className="rounded-xl bg-muted/50 border border-border/50 px-4 py-3 grid sm:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Открыто
                </div>
                <div className="font-medium mt-0.5 inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  {agency.opened_at
                    ? `с ${new Date(agency.opened_at).toLocaleDateString("ru-RU")}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Режим работы
                </div>
                <div className="font-medium mt-0.5 inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  {agency.working_hours || "—"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  Рейтинг
                </div>
                <div className="font-medium mt-0.5">
                  {agency.avg_rating ? (
                    <RatingBadge
                      avgRating={agency.avg_rating}
                      reviewsCount={agency.reviews_count}
                      href="#reviews"
                      className="text-sm"
                    />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  В каталоге
                </div>
                <div className="font-medium mt-0.5 inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  {managers.length} спец. ·{" "}
                  {propsLoading ? "…" : objectsCount}{" "}
                  {!propsLoading && pluralObjects(objectsCount)}
                </div>
              </div>
            </div>

            {managers.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">Специалисты</h2>
                <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden bg-card">
                  {managers.map((m) => {
                    const count = listingCounts.get(m.id) || 0;
                    const types = m.property_types ?? [];
                    return (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 p-3 sm:p-4 hover:bg-muted/40 transition-colors"
                      >
                        <Link
                          to={`/rieltor/${m.id}`}
                          className="flex items-center gap-3 min-w-0 flex-1"
                        >
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0">
                            {m.photo_url ? (
                              <img
                                src={m.photo_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                                {m.full_name?.[0] || "?"}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-foreground truncate">
                              {m.full_name}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              В работе: {count} {pluralObjects(count)}
                            </div>
                            {types.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {types.slice(0, 3).map((t) => (
                                  <span
                                    key={t}
                                    className="rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </Link>
                        {m.phone && (
                          <a
                            href={`tel:${m.phone.replace(/\D/g, "")}`}
                            className="hidden sm:inline-flex items-center gap-1 text-xs text-primary shrink-0 hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            {m.phone}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="rounded-xl border border-border/60 bg-card px-4 sm:px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] text-muted-foreground mb-1">
                  Объекты агентства
                </div>
                <div className="text-sm font-medium text-foreground tabular-nums">
                  {propsLoading
                    ? "Загрузка…"
                    : `${objectsCount} ${pluralObjects(objectsCount)} в каталоге`}
                </div>
              </div>
              {!propsLoading && objectsCount > 0 && (
                <Link
                  to={catalogHref}
                  className="h-7 px-[11px] rounded bg-primary text-primary-foreground text-sm font-medium inline-flex items-center hover:opacity-90"
                >
                  Смотреть в каталоге
                </Link>
              )}
            </section>

            <SpecialistReviews
              agencyId={agency.id}
              avgRating={agency.avg_rating}
              reviewsCount={agency.reviews_count}
              responseMinutes={agency.response_minutes}
            />
          </div>

          <aside className="lg:w-[340px] shrink-0">
            <div className="sticky top-24">
              <SpecialistContactForm
                title="Свяжитесь с агентством"
                source="agency_contact"
                targetLabel={agency.name}
              />
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
