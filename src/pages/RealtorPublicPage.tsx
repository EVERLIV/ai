import {
  ArrowLeft,
  Building2,
  Loader2,
  MapPin,
  Phone,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SpecialistContactForm from "@/components/specialists/SpecialistContactForm";
import SpecialistReviews, {
  RatingBadge,
} from "@/components/specialists/SpecialistReviews";
import { pluralObjects } from "@/components/specialists/specialistUtils";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useManagerPublic } from "@/hooks/useAgency";
import { isProfileVerified } from "@/hooks/useProfile";
import { buildCatalogUrl } from "@/lib/catalogLinks";
import { cn } from "@/lib/utils";

function InfoRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-[9.5rem_1fr] gap-1 sm:gap-6 py-3.5 border-b border-border/50 last:border-0",
        className,
      )}
    >
      <div className="text-xs sm:text-sm text-muted-foreground pt-0.5">
        {label}
      </div>
      <div className="text-sm text-foreground min-w-0">{children}</div>
    </div>
  );
}

export default function RealtorPublicPage() {
  const { id } = useParams<{ id: string }>();
  const { data: manager, isLoading, error } = useManagerPublic(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Загрузка…
      </div>
    );
  }

  if (error || !manager) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-xl font-semibold">Риелтор не найден</h1>
          <Link
            to="/rieltory"
            className="text-primary text-sm mt-4 inline-block hover:underline"
          >
            Все специалисты
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const agencyVerified = isProfileVerified(manager.agency.verification_status);
  const types = manager.property_types ?? [];
  const objectsCount = manager.objects_count ?? 0;
  const catalogHref = buildCatalogUrl({
    agency: manager.agency.id,
  });
  const about =
    manager.about?.trim() ||
    `Специалист агентства «${manager.agency.name}». Подбор объектов, показы и сопровождение сделки.`;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title={`${manager.full_name} — риелтор ${manager.agency.name}`}
        description={`Специалист ${manager.full_name} агентства ${manager.agency.name}. ${objectsCount} ${pluralObjects(objectsCount)} в работе.`}
      />
      <SiteHeader />

      <div className="mt-[56px] lg:mt-[104px] border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-8 h-10 flex items-center">
          <Link
            to="/rieltory"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Все специалисты
          </Link>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          <div className="flex-1 min-w-0 space-y-6">
            <section className="flex gap-4 sm:gap-5 items-start">
              <div className="w-[4.5rem] h-[4.5rem] sm:w-24 sm:h-24 rounded-full overflow-hidden bg-muted shrink-0 ring-1 ring-border/50">
                {manager.photo_url ? (
                  <img
                    src={manager.photo_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-muted-foreground">
                    {manager.full_name?.[0] || "?"}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl sm:text-[1.75rem] font-bold text-foreground leading-tight">
                    {manager.full_name}
                  </h1>
                  {agencyVerified && <VerifiedBadge size="md" />}
                </div>
                {agencyVerified && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Документы агентства проверены
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  {manager.avg_rating ? (
                    <RatingBadge
                      avgRating={manager.avg_rating}
                      reviewsCount={manager.reviews_count}
                      href="#reviews"
                      className="text-sm"
                    />
                  ) : null}
                  <Link
                    to={`/agentstvo/${manager.agency.id}`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    {manager.agency.name}
                  </Link>
                </div>
              </div>
            </section>

            <div className="rounded-xl bg-muted/40 border border-border/50 px-4 sm:px-5 py-4 grid sm:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <div className="text-[11px] text-muted-foreground mb-1">
                  Регион
                </div>
                <div className="text-sm font-medium text-foreground inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  Иркутск и область
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground mb-1">
                  Ответ
                </div>
                <div className="text-sm font-medium text-foreground">
                  {manager.response_minutes
                    ? `~${manager.response_minutes} мин`
                    : "В рабочее время"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground mb-1">
                  В работе
                </div>
                <div className="text-sm font-medium text-foreground tabular-nums">
                  {objectsCount} {pluralObjects(objectsCount)}
                </div>
              </div>
            </div>

            <section className="rounded-xl border border-border/60 bg-card px-4 sm:px-5">
              <InfoRow label="О себе">
                <p className="leading-relaxed text-muted-foreground">{about}</p>
              </InfoRow>
              <InfoRow label="Специализация">
                {types.length > 0 ? (
                  <ul className="space-y-1">
                    {types.map((t) => (
                      <li key={t} className="text-foreground">
                        {t}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted-foreground">Недвижимость</span>
                )}
              </InfoRow>
              <InfoRow label="Агентство">
                <Link
                  to={`/agentstvo/${manager.agency.id}`}
                  className="inline-flex items-center gap-1.5 font-medium hover:underline"
                >
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  {manager.agency.name}
                </Link>
              </InfoRow>
              <InfoRow label="Контакты">
                {manager.phone ? (
                  <a
                    href={`tel:${manager.phone.replace(/\D/g, "")}`}
                    className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
                  >
                    <Phone className="w-4 h-4" />
                    {manager.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">
                    Оставьте заявку в форме справа
                  </span>
                )}
              </InfoRow>
              <InfoRow label="Объекты">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="font-medium tabular-nums">
                    {objectsCount} {pluralObjects(objectsCount)} в работе
                  </span>
                  {objectsCount > 0 && (
                    <Link
                      to={catalogHref}
                      className="text-sm text-primary hover:underline"
                    >
                      Смотреть в каталоге →
                    </Link>
                  )}
                </div>
              </InfoRow>
            </section>

            <SpecialistReviews
              agencyId={manager.agency.id}
              managerId={manager.id}
              avgRating={manager.avg_rating}
              reviewsCount={manager.reviews_count}
              responseMinutes={manager.response_minutes}
              title="Отзывы о специалисте"
            />
          </div>

          <aside className="lg:w-[340px] shrink-0">
            <div className="sticky top-24">
              <SpecialistContactForm
                title="Свяжитесь с риелтором"
                source="realtor_contact"
                targetLabel={`${manager.full_name} · ${manager.agency.name}`}
              />
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
