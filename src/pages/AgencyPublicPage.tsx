import { Link, useParams } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SeoHead from "@/components/SeoHead";
import VerifiedBadge from "@/components/VerifiedBadge";
import PropertyGridCard from "@/components/PropertyGridCard";
import {
  useAgencyManagers,
  useAgencyPublic,
  useAgencyPublicProperties,
} from "@/hooks/useAgency";
import { isProfileVerified } from "@/hooks/useProfile";
import { Building2, Clock, Calendar, Loader2, Phone } from "lucide-react";
import type { DbProperty } from "@/hooks/useProperties";

export default function AgencyPublicPage() {
  const { id } = useParams<{ id: string }>();
  const { data: agency, isLoading, error } = useAgencyPublic(id);
  const { data: managers = [] } = useAgencyManagers(id, true);
  const { data: rawProperties = [], isLoading: propsLoading } = useAgencyPublicProperties(id);
  const properties = rawProperties as unknown as DbProperty[];

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
          <Link to="/" className="text-primary text-sm mt-4 inline-block hover:underline">
            На главную
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
        description={agency.about?.slice(0, 160) || `Объекты агентства ${agency.name} на АрендаСити`}
      />
      <SiteHeader />

      <div className="sticky top-[56px] md:top-[98px] z-30 mt-[56px] md:mt-[98px] bg-card/90 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-8 h-10 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Главная</Link>
          <span>/</span>
          <span className="text-foreground truncate">{agency.name}</span>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8 space-y-10">
        <section className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-24 h-24 rounded-2xl border border-border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
            {agency.logo_url ? (
              <img src={agency.logo_url} alt="" className="w-full h-full object-cover" />
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
            {agency.about && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl whitespace-pre-line">
                {agency.about}
              </p>
            )}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
              {agency.opened_at && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Открыто с {new Date(agency.opened_at).toLocaleDateString("ru-RU")}
                </span>
              )}
              {agency.working_hours && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {agency.working_hours}
                </span>
              )}
            </div>
          </div>
        </section>

        {managers.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Менеджеры</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {managers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0">
                    {m.photo_url ? (
                      <img src={m.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                        {m.full_name?.[0] || "?"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{m.full_name}</div>
                    {m.phone && (
                      <a
                        href={`tel:${m.phone.replace(/\D/g, "")}`}
                        className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                      >
                        <Phone className="w-3 h-3" /> {m.phone}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            Объекты {properties.length > 0 ? `(${properties.length})` : ""}
          </h2>
          {propsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
              <Loader2 className="w-4 h-4 animate-spin" /> Загрузка объектов…
            </div>
          ) : properties.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">Пока нет опубликованных объектов.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((p) => (
                <PropertyGridCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
