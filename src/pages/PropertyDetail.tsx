import { useParams, useNavigate, Link } from "react-router-dom";
import { useProperty } from "@/hooks/useProperties";
import {
  ArrowLeft, Heart, MapPin, Clock, Eye, Mail,
  Building2, Ruler, Layers, Car, Paintbrush, LayoutGrid, FileText,
  Shield, Calendar, ChevronLeft, ChevronRight, Store, Warehouse, TreePine,
  MessageSquareText, Tag, Download, X, Send, ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NearbyPropertiesSlider from "@/components/NearbyPropertiesSlider";
import PropertyMap from "@/components/PropertyMap";
import { getDefaultPropertyImage } from "@/lib/propertyImages";
import RequestPriceDialog from "@/components/RequestPriceDialog";
import OwnerMessageDialog, { propertyCtaButtonClass } from "@/components/OwnerMessageDialog";
import RevealListingPhone from "@/components/RevealListingPhone";
import ReportListingDialog from "@/components/ReportListingDialog";
import PropertyAIChat from "@/components/PropertyAIChat";
import { isOwnerListing, getOwnerUserId } from "@/lib/propertyModeration";
import { isResidentialSegment, SEGMENT_ROUTES } from "@/config/propertySegments";
import PropertyUnitsTable from "@/components/PropertyUnitsTable";
import PropertySidebarExtras from "@/components/PropertySidebarExtras";
import PKKMapModal from "@/components/PKKMapModal";
import { getLandCadastral, getLandUse, isLandProperty, LAND_TYPE_LABEL } from "@/lib/propertyLand";
import { getPropertyTypes, getPrimaryPropertyType, formatPropertyTypesLabel } from "@/lib/propertyTypes";
import { isSaleDeal } from "@/lib/propertyDeal";
import { motion } from "framer-motion";
import SeoHead from "@/components/SeoHead";
import PropertyJsonLd from "@/components/PropertyJsonLd";
import { buildPropertyShareOgDescription, buildPropertySharePayload } from "@/lib/propertyShare";
import { formatListingViews, buildPropertyDisplayTitle, formatPropertyAddressShort } from "@/lib/propertyCard";
import { absoluteUrl } from "@/config/site";
import PropertyShareButton from "@/components/PropertyShareButton";
import PropertyDescription from "@/components/PropertyDescription";
import { submitLead } from "@/lib/submitLead";

const typeIcons: Record<string, React.ElementType> = {
  "Офис": Building2, "Торговая": Store, "Склад": Warehouse, "Земля": TreePine,
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: property, isLoading } = useProperty(id);
  const { user } = useAuth();
  const [activePhoto, setActivePhoto] = useState(0);
  const [showPKK, setShowPKK] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", message: "" });
  const [contactSent, setContactSent] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  const SUBJECTS = ["Аренда офисного помещения", "Аренда торговой площади", "Аренда склада", "Другое"];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    try {
      await submitLead({
        object_id: id || null,
        name: contactForm.name,
        phone: contactForm.phone,
        message: contactForm.message || null,
        source: "property_contact",
        business_category: property?.address || null,
      });
      setContactSent(true);
    } catch {
      // silent fallback
    } finally {
      setContactLoading(false);
    }
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

  const propertyTypes = getPropertyTypes(property);
  const primaryType = getPrimaryPropertyType(property);
  const Icon = typeIcons[primaryType] || Building2;
  const photos = property.photos || [];
  const photosCount = photos.length || 1;

  const isLand = isLandProperty(property);
  const isSale = isSaleDeal(property.deal_type);
  const isResidential = isResidentialSegment(property.segment);
  const segmentHome = isResidential ? SEGMENT_ROUTES.residential.home : SEGMENT_ROUTES.commercial.home;
  const segmentCatalog = isResidential ? SEGMENT_ROUTES.residential.catalog : SEGMENT_ROUTES.commercial.catalog;
  const landExtras = (property.extras || {}) as Record<string, unknown>;
  const ownerUserIdForInquiry = getOwnerUserId(landExtras, property.submitted_by);
  const ownerNameForInquiry = typeof landExtras.agent_name === "string" ? landExtras.agent_name : undefined;

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

  const seoTitle = buildPropertyDisplayTitle(property);
  const seoDescription = buildPropertyShareOgDescription(property);
  const sharePayload = buildPropertySharePayload(property);
  const displayTitle = seoTitle;
  const addressShort = formatPropertyAddressShort(property.address);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <SeoHead
        title={seoTitle}
        description={seoDescription}
        image={sharePayload.imageUrl || photos[0] || property.cover_photo}
        url={sharePayload.url}
        type="website"
      />
      <PropertyJsonLd
        id={property.id}
        deal_type={property.deal_type}
        type={property.type}
        extras={property.extras as Record<string, unknown> | null}
        address={property.address}
        district={property.district}
        price={Number(property.price) || null}
        area={property.area}
        description={property.description}
        coverPhoto={property.cover_photo}
        photos={photos}
      />

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
            <Link to={segmentHome} className="hover:text-foreground transition-colors shrink-0">Главная</Link>
            <span className="shrink-0 opacity-50">/</span>
            <Link to={segmentCatalog} className="hover:text-foreground transition-colors shrink-0">{formatPropertyTypesLabel(propertyTypes)}</Link>
            <span className="shrink-0 opacity-50">/</span>
            <span className="text-foreground truncate min-w-0">{displayTitle}</span>
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
            <PropertyShareButton property={property} />
          </div>
        </div>
      </div>

      {/* Mobile bottom action bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_24px_-12px_hsl(0_0%_0%/0.15)]">
        <div className="grid grid-cols-4 px-2 py-2 gap-1 max-w-md mx-auto">
          <RevealListingPhone property={property} variant="bar" />
          {isResidential ? (
            <OwnerMessageDialog
              propertyId={property.id}
              propertyAddress={property.address}
              ownerName={ownerNameForInquiry}
              ownerUserId={ownerUserIdForInquiry || undefined}
              title="Оставить заявку"
              source="property_inquiry"
              trigger={
                <button
                  type="button"
                  aria-label="Оставить заявку"
                  className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-foreground hover:bg-muted active:scale-95 transition-all w-full"
                >
                  <Mail className="w-6 h-6" strokeWidth={2.2} />
                  <span className="text-[9px] font-medium whitespace-nowrap">Заявка</span>
                </button>
              }
            />
          ) : (
            <button
              onClick={() => { setContactOpen(true); setContactSent(false); }}
              aria-label="Задать вопрос"
              className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-foreground hover:bg-muted active:scale-95 transition-all"
            >
              <Mail className="w-6 h-6" strokeWidth={2.2} />
              <span className="text-[9px] font-medium whitespace-nowrap">Задать вопрос</span>
            </button>
          )}
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
          <PropertyShareButton property={property} variant="bar" />
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>

      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="container mx-auto px-4 lg:px-8 pt-4 lg:pt-6 pb-24 lg:pb-10 flex-1">

        <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground leading-tight mb-1.5">
          {displayTitle}
        </h1>
        {addressShort && (
          <p className="mb-4 lg:mb-5 text-sm text-muted-foreground flex items-start gap-1.5">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
            <span>{addressShort}</span>
          </p>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            {/* Gallery */}
            <div className="mb-6">
              <div className="relative bg-muted aspect-[16/9] overflow-hidden">
                <img
                  src={photos.length > 0 ? photos[activePhoto] : getDefaultPropertyImage(primaryType)}
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
                  {propertyTypes.map((t) => (
                    <span key={t} className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">{t}</span>
                  ))}
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
                {formatListingViews(property.views_count)} просмотров
              </span>
              <span className="text-muted-foreground/60">ID: {property.id.slice(0, 8)}</span>
            </div>

            <div className="lg:hidden mb-6">
              <PropertyPriceBlock property={property} />
            </div>

            <section className="mb-8">
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">Описание</h2>
              <PropertyDescription text={property.description} />
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

        {!isResidential && (
          <PropertyAIChat propertyId={property.id} propertyAddress={property.address} />
        )}

        <NearbyPropertiesSlider
          district={property.district}
          excludeId={property.id}
          type={formatPropertyTypesLabel(propertyTypes)}
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
  const isResidential = isResidentialSegment(property.segment);
  const typesLabel = formatPropertyTypesLabel(getPropertyTypes(property));
  const useOwnerInquiry = isResidential || ownerListing;

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
          <div className="text-xs text-muted-foreground mt-1.5">{property.area} м² · {typesLabel}</div>
        </div>
      )}

      {/* CTAs — компактно: основные две рядом, "Предложить цену" — текстовая ссылка */}
      <div className="grid grid-cols-2 gap-2">
        {useOwnerInquiry ? (
          <OwnerMessageDialog
            propertyId={property.id}
            propertyAddress={property.address}
            ownerName={ownerName}
            ownerUserId={ownerUserId || undefined}
            title={isResidential ? "Оставить заявку" : "Задать вопрос"}
            source={isResidential ? "property_inquiry" : "owner_message"}
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
        <RevealListingPhone property={property} />
      </div>
      <RequestPriceDialog
        propertyId={property.id}
        propertyAddress={property.address}
        basePrice={Number(property.price) || undefined}
        dealType={property.deal_type}
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
      <div className="flex justify-center pt-1 border-t border-border/50">
        <ReportListingDialog propertyId={property.id} propertyAddress={property.address} />
      </div>
    </div>
  );
}

