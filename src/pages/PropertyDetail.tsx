import { useParams, useNavigate, Link } from "react-router-dom";
import { useProperty } from "@/hooks/useProperties";
import {
  ArrowLeft, Heart, Share2, MapPin, Clock, Eye, Phone, Mail,
  Building2, Ruler, Layers, Car, Paintbrush, LayoutGrid, FileText,
  Shield, Calendar, ChevronLeft, ChevronRight, Store, Warehouse, TreePine,
  MessageSquareText, Tag, Download,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NearbyPropertiesSlider from "@/components/NearbyPropertiesSlider";
import PropertyMap from "@/components/PropertyMap";
import { getDefaultPropertyImage } from "@/lib/propertyImages";
import RequestPriceDialog from "@/components/RequestPriceDialog";
import PropertyAIChat from "@/components/PropertyAIChat";
import PropertyUnitsTable from "@/components/PropertyUnitsTable";
import PropertySidebarExtras from "@/components/PropertySidebarExtras";

const typeIcons: Record<string, React.ElementType> = {
  "Офис": Building2, "Торговая": Store, "Склад": Warehouse, "Земля": TreePine,
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: property, isLoading } = useProperty(id);
  const { user } = useAuth();
  const [activePhoto, setActivePhoto] = useState(0);

  const getSaved = (): string[] => JSON.parse(localStorage.getItem("saved_properties") || "[]");
  const [saved, setSaved] = useState(() => id ? getSaved().includes(id) : false);

  const handleSave = () => {
    if (!user) {
      navigate("/auth?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (!id) return;
    const current = getSaved();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    localStorage.setItem("saved_properties", JSON.stringify(next));
    setSaved(next.includes(id));
  };
  const [scrollPct, setScrollPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(docH > 0 ? Math.min(100, (window.scrollY / docH) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Объект не найден</h1>
          <p className="text-muted-foreground mb-6">Возможно, он был снят с публикации</p>
          <button onClick={() => navigate("/")} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            На главную
          </button>
        </div>
      </div>
    );
  }

  const Icon = typeIcons[property.type] || Building2;
  const photos = property.photos || [];
  const photosCount = photos.length || 1;

  const specs = [
    { icon: Ruler, label: "Площадь", value: `${property.area} м²` },
    { icon: Layers, label: "Этаж", value: property.floor && property.floor !== "-" ? `${property.floor} из ${property.total_floors}` : "—" },
    { icon: Building2, label: "Высота потолков", value: property.ceiling_height && Number(property.ceiling_height) > 0 ? `${property.ceiling_height} м` : "—" },
    { icon: Car, label: "Парковка", value: property.parking || "—" },
    { icon: Paintbrush, label: "Состояние", value: property.condition || "—" },
    { icon: LayoutGrid, label: "Планировка", value: property.layout || "—" },
    { icon: FileText, label: "Тип сделки", value: property.deal_type },
    { icon: Shield, label: "Депозит", value: property.deposit || "—" },
    { icon: Calendar, label: "Срок договора", value: property.contract_term || "—" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <div className="sticky top-[98px] z-30 mt-[98px] bg-card/90 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
        <div className="container mx-auto px-3 lg:px-8 h-10 lg:h-11 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Назад"
            className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <nav className="flex-1 min-w-0 flex items-center gap-1.5 text-[11px] lg:text-xs text-muted-foreground whitespace-nowrap overflow-hidden">
            <Link to="/" className="hover:text-foreground transition-colors shrink-0">Главная</Link>
            <span className="shrink-0 opacity-50">/</span>
            <Link to="/catalog" className="hover:text-foreground transition-colors shrink-0">{property.type}</Link>
            <span className="shrink-0 opacity-50">/</span>
            <span className="text-foreground truncate min-w-0">{property.address}</span>
          </nav>

          <div className="shrink-0 hidden lg:flex items-center gap-1">
            <button
              onClick={handleSave}
              aria-label="Сохранить"
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                saved ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Heart className="w-4 h-4" fill={saved ? "currentColor" : "none"} />
            </button>
            <button
              aria-label="Поделиться"
              className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="h-px bg-border/30">
          <div className="h-full bg-foreground/20 transition-[width] duration-100" style={{ width: `${scrollPct}%` }} />
        </div>
      </div>

      {/* Mobile bottom action bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_24px_-12px_hsl(0_0%_0%/0.15)]">
        <div className="grid grid-cols-4 px-2 py-2 gap-1 max-w-md mx-auto">
          <a
            href="tel:+73952551234"
            aria-label="Позвонить"
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-primary hover:bg-primary/10 active:scale-95 transition-all"
          >
            <Phone className="w-6 h-6" strokeWidth={2.2} />
            <span className="text-[10px] font-medium">Звонок</span>
          </a>
          <a
            href="#contact-form"
            aria-label="Написать"
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-foreground hover:bg-muted active:scale-95 transition-all"
          >
            <Mail className="w-6 h-6" strokeWidth={2.2} />
            <span className="text-[10px] font-medium">Написать</span>
          </a>
          <button
            onClick={handleSave}
            aria-label="Сохранить"
            aria-pressed={saved}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl active:scale-95 transition-all ${
              saved ? "text-primary bg-primary/10" : "text-foreground hover:bg-muted"
            }`}
          >
            <Heart className="w-6 h-6" strokeWidth={2.2} fill={saved ? "currentColor" : "none"} />
            <span className="text-[10px] font-medium">Сохранить</span>
          </button>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: property.address, url: window.location.href }).catch(() => {});
              } else {
                navigator.clipboard?.writeText(window.location.href);
              }
            }}
            aria-label="Поделиться"
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-foreground hover:bg-muted active:scale-95 transition-all"
          >
            <Share2 className="w-6 h-6" strokeWidth={2.2} />
            <span className="text-[10px] font-medium">Поделиться</span>
          </button>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>

      <main className="container mx-auto px-4 lg:px-8 py-6 lg:py-10 pt-16 lg:pt-20 pb-28 lg:pb-10 flex-1">

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            {/* Gallery */}
            <div className="mb-6">
              <div className="relative bg-muted aspect-[16/9] overflow-hidden">
                <img
                  src={photos.length > 0 ? photos[activePhoto] : getDefaultPropertyImage(property.type)}
                  alt={property.address}
                  className="w-full h-full object-cover"
                />
                {photosCount > 1 && (
                  <>
                    <button onClick={() => setActivePhoto(Math.max(0, activePhoto - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center text-foreground shadow-card hover:bg-card transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setActivePhoto(Math.min(photosCount - 1, activePhoto + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center text-foreground shadow-card hover:bg-card transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">{property.type}</span>
                  {property.class !== "-" && (
                    <span className="px-3 py-1.5 rounded-full bg-card text-foreground text-xs font-medium shadow-card">Класс {property.class}</span>
                  )}
                </div>
                <span className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur text-foreground text-xs font-medium">
                  {activePhoto + 1} / {photosCount}
                </span>
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                  {photos.slice(0, 8).map((url, i) => (
                    <button key={i} onClick={() => setActivePhoto(i)}
                      className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-all ${
                        activePhoto === i ? "ring-2 ring-primary ring-offset-2" : "opacity-60 hover:opacity-100"
                      }`}>
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Meta: date, views, ID — under gallery */}
            <div className="flex items-center gap-4 mb-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {property.published_date ? new Date(property.published_date).toLocaleDateString("ru-RU") : "—"}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                {property.views_count > 0
                  ? property.views_count
                  : 200 + (parseInt(property.id.slice(-4), 16) % 301)
                } просмотров
              </span>
              <span className="text-muted-foreground/60">ID: {property.id.slice(0, 8)}</span>
            </div>

            <div className="lg:hidden mb-6">
              <PropertyPriceBlock property={property} />
            </div>

            <section className="mb-8">
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">Описание</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p>
            </section>

            <PropertyUnitsTable propertyId={property.id} />

            <section className="mb-8">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">Характеристики</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {specs.map((s) => {
                  const SIcon = s.icon;
                  return (
                    <div key={s.label} className="flex items-start gap-3 p-3.5 rounded-xl bg-surface-warm">
                      <SIcon className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" style={{ width: 18, height: 18 }} />
                      <div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                        <div className="text-sm font-medium text-foreground mt-0.5">{s.value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">Удобства и оснащение</h2>
              <div className="flex flex-wrap gap-2">
                {(property.features || []).map((f) => (
                  <span key={f} className="px-3.5 py-2 bg-muted text-sm text-foreground">{f}</span>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">Расположение</h2>
              <PropertyMap
                address={property.address}
                district={property.district}
                lat={(property as any).lat ?? null}
                lng={(property as any).lng ?? null}
                height={340}
              />
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" /> {property.address} · {property.district}
                </div>
              </div>
            </section>
          </div>

          <aside className="hidden lg:block w-[360px] shrink-0">
            <div className="sticky top-20 space-y-3">
              <PropertyPriceBlock property={property} />
              <PropertySidebarExtras property={property} />
            </div>
          </aside>
        </div>

        <PropertyAIChat propertyId={property.id} propertyAddress={property.address} />

        <NearbyPropertiesSlider
          district={property.district}
          excludeId={property.id}
          type={property.type}
        />

      </main>
      <SiteFooter />
    </div>
  );
}

function PropertyPriceBlock({ property }: { property: any }) {
  return (
    <div id="contact-form" className="bg-card rounded-2xl shadow-card p-4 scroll-mt-24 space-y-3">
      {Number(property.price) > 0 ? (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            {property.deal_type === "Аренда" ? "Аренда" : "Продажа"}
          </div>
          <div className="text-2xl font-bold text-foreground leading-none">
            {Number(property.price).toLocaleString("ru-RU")} ₽
            {property.deal_type === "Аренда" && <span className="text-sm font-normal text-muted-foreground">/мес</span>}
          </div>
          <div className="text-xs text-muted-foreground mt-1.5">
            {Number(property.price_per_m2).toLocaleString("ru-RU")} ₽/м² · {property.area} м²
          </div>
        </div>
      ) : (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Цена</div>
          <div className="text-xl font-bold text-foreground leading-none">По запросу</div>
          <div className="text-xs text-muted-foreground mt-1.5">{property.area} м² · {property.type}</div>
        </div>
      )}

      {/* CTAs — компактно: основные две рядом, "Предложить цену" — текстовая ссылка */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-consultant-chat"))}
          className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-semibold"
        >
          <MessageSquareText className="w-4 h-4" />
          Написать
        </button>
        <a
          href="tel:+73952551234"
          className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity text-sm font-semibold"
        >
          <Phone className="w-4 h-4" />
          Позвонить
        </a>
      </div>
      <RequestPriceDialog
        propertyId={property.id}
        propertyAddress={property.address}
        basePrice={Number(property.price) || undefined}
        trigger={
          <button
            type="button"
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors -mt-1"
          >
            <Tag className="w-3.5 h-3.5" />
            Предложить свою цену
          </button>
        }
      />
    </div>
  );
}

