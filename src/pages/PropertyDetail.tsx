import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useProperty } from "@/hooks/useProperties";
import {
  ArrowLeft, Heart, Share2, MapPin, Clock, Eye, Phone, Mail,
  Building2, Ruler, Layers, Car, Paintbrush, LayoutGrid, FileText,
  Shield, Calendar, ChevronLeft, ChevronRight, Store, Warehouse, TreePine,
  MessageSquareText, Tag, Download, X, Send, ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NearbyPropertiesSlider from "@/components/NearbyPropertiesSlider";
import { useProperties } from "@/hooks/useProperties";
import PropertyMap from "@/components/PropertyMap";
import { getDefaultPropertyImage } from "@/lib/propertyImages";
import RequestPriceDialog from "@/components/RequestPriceDialog";
import OwnerMessageDialog, { propertyCtaButtonClass } from "@/components/OwnerMessageDialog";
import PropertyAIChat from "@/components/PropertyAIChat";
import { isOwnerListing, getOwnerUserId } from "@/lib/propertyModeration";
import PropertyUnitsTable from "@/components/PropertyUnitsTable";
import PropertySidebarExtras from "@/components/PropertySidebarExtras";
import PKKMapModal from "@/components/PKKMapModal";
import { getLandCadastral, getLandUse, isLandProperty, LAND_TYPE_LABEL } from "@/lib/propertyLand";
import { isSaleDeal } from "@/lib/propertyDeal";
import { motion } from "framer-motion";

const typeIcons: Record<string, React.ElementType> = {
  "Офис": Building2, "Торговая": Store, "Склад": Warehouse, "Земля": TreePine,
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: property, isLoading } = useProperty(id);
  const { data: allProperties } = useProperties();
  const { user } = useAuth();
  const [activePhoto, setActivePhoto] = useState(0);
  const [showPKK, setShowPKK] = useState(false);

  // Соседние объекты для свайпа
  const ids = allProperties?.map((p) => p.id) ?? [];
  const currentIdx = ids.indexOf(id ?? "");
  const prevId = currentIdx > 0 ? ids[currentIdx - 1] : null;
  const nextId = currentIdx >= 0 && currentIdx < ids.length - 1 ? ids[currentIdx + 1] : null;

  // Touch swipe
  const touchStartX = useRef<number | null>(null);
  const [swipeDir, setSwipeDir] = useState<"left" | "right" | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 60) return; // порог
    if (dx < 0 && nextId) { setSwipeDir("left"); setTimeout(() => { navigate(`/property/${nextId}`); setSwipeDir(null); }, 200); }
    if (dx > 0 && prevId) { setSwipeDir("right"); setTimeout(() => { navigate(`/property/${prevId}`); setSwipeDir(null); }, 200); }
  };
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", message: "" });
  const [contactSent, setContactSent] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  const SUBJECTS = ["Аренда офисного помещения", "Аренда торговой площади", "Аренда склада", "Другое"];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setTimeout(() => { setContactLoading(false); setContactSent(true); }, 1200);
  };

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

  const isLand = isLandProperty(property.type);
  const isSale = isSaleDeal(property.deal_type);
  const landExtras = (property.extras || {}) as Record<string, unknown>;

  const rentTerms = isSale
    ? []
    : [
        { icon: Shield, label: "Депозит", value: property.deposit || "—" },
        { icon: Calendar, label: "Срок договора", value: property.contract_term || "—" },
      ];

  const specs = isLand
    ? [
        { icon: Ruler, label: "Площадь", value: `${property.area} м²` },
        {
          icon: FileText, label: "Кадастровый номер",
          value: getLandCadastral(landExtras)
            ? <button onClick={() => setShowPKK(true)} className="font-mono text-primary hover:underline underline-offset-2 cursor-pointer">{getLandCadastral(landExtras)}</button>
            : "—"
        },
        { icon: TreePine, label: LAND_TYPE_LABEL, value: getLandUse(property) || "—" },
        { icon: FileText, label: "Тип сделки", value: property.deal_type },
        ...rentTerms,
      ]
    : [
        { icon: Ruler, label: "Площадь", value: `${property.area} м²` },
        { icon: Layers, label: "Этаж", value: property.floor && property.floor !== "-" ? `${property.floor} из ${property.total_floors}` : "—" },
        { icon: Building2, label: "Высота потолков", value: property.ceiling_height && Number(property.ceiling_height) > 0 ? `${property.ceiling_height} м` : "—" },
        { icon: Car, label: "Парковка", value: property.parking || "—" },
        { icon: Paintbrush, label: "Состояние", value: property.condition || "—" },
        { icon: LayoutGrid, label: "Планировка", value: property.layout || "—" },
        { icon: FileText, label: "Тип сделки", value: property.deal_type },
        ...rentTerms,
      ];

  return (
    <div
      className={`min-h-screen bg-background flex flex-col transition-transform duration-200 ${
        swipeDir === "left" ? "-translate-x-8 opacity-0" : swipeDir === "right" ? "translate-x-8 opacity-0" : ""
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <SiteHeader />

      {/* ── Попап формы заявки ── */}
      {contactOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setContactOpen(false)} />
          <div className="relative bg-card w-full sm:max-w-md sm:rounded-none shadow-2xl animate-fade-in-up">
            {/* Шапка */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div>
                <h3 className="text-sm font-bold text-foreground">Оставить заявку</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[260px]">{property?.address}</p>
              </div>
              <button onClick={() => setContactOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Тело */}
            <div className="px-5 py-5">
              {contactSent ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Send className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Заявка отправлена!</p>
                  <p className="text-xs text-muted-foreground mb-4">Свяжемся с вами в течение часа в рабочее время.</p>
                  <button onClick={() => { setContactOpen(false); setContactSent(false); setContactForm({ name: "", phone: "", message: "" }); }}
                    className="text-xs text-primary hover:underline">Закрыть</button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Имя *</label>
                    <input required value={contactForm.name} onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Иван Иванов"
                      className="w-full h-10 px-3 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Телефон *</label>
                    <input required type="tel" value={contactForm.phone} onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+7 (999) 000-00-00"
                      className="w-full h-10 px-3 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Сообщение</label>
                    <textarea value={contactForm.message} onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                      placeholder="Уточните ваш запрос..."
                      rows={3}
                      className="w-full px-3 py-2.5 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors resize-none" />
                  </div>
                  <button type="submit" disabled={contactLoading}
                    className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60">
                    {contactLoading ? (
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-primary-foreground animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-primary-foreground animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-primary-foreground animate-bounce [animation-delay:300ms]" />
                      </span>
                    ) : <><Send className="w-4 h-4" /> Отправить заявку</>}
                  </button>
                  <p className="text-[11px] text-muted-foreground/60 text-center">
                    Ответим в течение часа в рабочее время
                  </p>
                </form>
              )}
            </div>

            {/* Безопасный отступ для iOS */}
            <div style={{ height: "env(safe-area-inset-bottom)" }} />
          </div>
        </div>
      )}

      <div className="mt-[56px] md:mt-[98px] border-b border-border/40">
        <div className="container mx-auto px-3 lg:px-8 h-10 lg:h-11 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Назад"
            className="shrink-0 flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
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
              className={`flex items-center justify-center w-8 h-8 transition-colors ${
                saved ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className="w-4 h-4" fill={saved ? "currentColor" : "none"} />
            </button>
            <button
              aria-label="Поделиться"
              className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Swipe indicators — мобильный, полупрозрачные стрелки по краям */}
      {prevId && (
        <button
          onClick={() => navigate(`/property/${prevId}`)}
          className="lg:hidden fixed left-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-8 h-16 bg-background/80 backdrop-blur-sm border-r border-border/40 text-muted-foreground active:text-primary transition-colors"
          aria-label="Предыдущий объект"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {nextId && (
        <button
          onClick={() => navigate(`/property/${nextId}`)}
          className="lg:hidden fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-8 h-16 bg-background/80 backdrop-blur-sm border-l border-border/40 text-muted-foreground active:text-primary transition-colors"
          aria-label="Следующий объект"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Счётчик позиции */}
      {ids.length > 0 && currentIdx >= 0 && (
        <div className="lg:hidden fixed top-[calc(56px+40px+8px)] left-1/2 -translate-x-1/2 z-30 px-2.5 py-1 bg-foreground/70 backdrop-blur-sm text-background text-[10px] font-medium rounded-full pointer-events-none">
          {currentIdx + 1} / {ids.length}
        </div>
      )}

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
          <button
            onClick={() => { setContactOpen(true); setContactSent(false); }}
            aria-label="Задать вопрос"
            className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-foreground hover:bg-muted active:scale-95 transition-all"
          >
            <Mail className="w-6 h-6" strokeWidth={2.2} />
            <span className="text-[9px] font-medium whitespace-nowrap">Задать вопрос</span>
          </button>
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

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="container mx-auto px-4 lg:px-8 py-6 lg:py-10 pt-16 lg:pt-20 pb-28 lg:pb-10 flex-1">

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

      </motion.main>
      <SiteFooter />
      {showPKK && getLandCadastral(landExtras) && (
        <PKKMapModal cadastralNumber={getLandCadastral(landExtras)!} onClose={() => setShowPKK(false)} />
      )}
    </div>
  );
}

function PropertyPriceBlock({ property }: { property: any }) {
  const extras = (property.extras || {}) as Record<string, unknown>;
  const ownerListing = isOwnerListing(extras, property.submitted_by);
  const ownerUserId = getOwnerUserId(extras, property.submitted_by);
  const ownerName = typeof extras.agent_name === "string" ? extras.agent_name : undefined;

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
        {ownerListing ? (
          <OwnerMessageDialog
            propertyId={property.id}
            propertyAddress={property.address}
            ownerName={ownerName}
            ownerUserId={ownerUserId || undefined}
          />
        ) : (
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-consultant-chat"))}
            className={`${propertyCtaButtonClass} bg-primary text-primary-foreground`}
          >
            <MessageSquareText className="w-4 h-4 shrink-0" />
            Задать вопрос
          </button>
        )}
        <a
          href="tel:+73952551234"
          className={`${propertyCtaButtonClass} bg-foreground text-background`}
        >
          <Phone className="w-4 h-4 shrink-0" />
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

