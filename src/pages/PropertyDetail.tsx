import { motion } from "framer-motion";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Columns2,
  Eye,
  FileText,
  Heart,
  Layers,
  Mail,
  MapPin,
  MessageSquareText,
  Paintbrush,
  Ruler,
  Flag,
  Send,
  Shield,
  Store,
  Tag,
  TreePine,
  Warehouse,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import NearbyPropertiesSlider from "@/components/NearbyPropertiesSlider";
import OwnerMessageDialog, {
  propertyCtaButtonClass,
} from "@/components/OwnerMessageDialog";
import PKKMapModal from "@/components/PKKMapModal";
import PropertyAIChat from "@/components/PropertyAIChat";
import PropertyDescription from "@/components/PropertyDescription";
import PropertyJsonLd from "@/components/PropertyJsonLd";
import PropertyMap from "@/components/PropertyMap";
import PropertyShareButton from "@/components/PropertyShareButton";
import PropertySidebarExtras from "@/components/PropertySidebarExtras";
import PropertyMediaGallery from "@/components/property/PropertyMediaGallery";
import { useCompareProperties } from "@/hooks/useCompareProperties";
import { SpecGrid, SpecQuickStats, SpecRow } from "@/components/PropertySpecList";
import PropertyStickyNav from "@/components/PropertyStickyNav";
import PropertyUnitsTable from "@/components/PropertyUnitsTable";
import ReportListingDialog from "@/components/ReportListingDialog";
import RequestPriceDialog from "@/components/RequestPriceDialog";
import RevealListingPhone from "@/components/RevealListingPhone";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  isResidentialSegment,
  SEGMENT_ROUTES,
} from "@/config/propertySegments";
import { useAuth } from "@/hooks/useAuth";
import { useProperty } from "@/hooks/useProperties";
import { trackPropertyView } from "@/lib/agencyNotify";
import {
  consultantAvatarForListing,
  listingHasAiConsultant,
  openConsultantChat,
  useAiConsultantAccess,
} from "@/lib/aiConsultant";
import { isAgencyListing } from "@/lib/listingSource";
import { trackPropertyPreference } from "@/lib/userPreferences";
import {
  buildPropertyDisplayTitle,
  formatListingActivityDates,
  formatListingViews,
  formatPropertyAddressShort,
} from "@/lib/propertyCard";
import {
  planTabLabel,
  readPropertyMediaExtras,
} from "@/lib/propertyMedia";
import { isSaleDeal } from "@/lib/propertyDeal";
import { getDefaultPropertyImage } from "@/lib/propertyImages";
import {
  getLandCadastral,
  getLandUse,
  isAnyLand,
  LAND_TYPE_LABEL,
} from "@/lib/propertyLand";
import { getOwnerUserId, isOwnerListing } from "@/lib/propertyModeration";
import {
  getResidentialBuildingType,
  getResidentialRooms,
  getWoodConfigId,
  getWoodFinish,
  getWoodFloors,
  getWoodFoundation,
  getWoodRoof,
  getWoodWall,
} from "@/lib/propertyResidential";
import { isHouseLike } from "@/lib/propertyTypeFamilies";
import { getWoodenHouseConfig } from "@/lib/woodenHouses";
import { resolveSidebarDisplay } from "@/lib/propertySidebar";
import {
  buildPropertyShareOgDescription,
  buildPropertySharePayload,
} from "@/lib/propertyShare";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";
import {
  formatPropertyTypesLabel,
  getPrimaryPropertyType,
  getPropertyTypes,
} from "@/lib/propertyTypes";
import { submitLead } from "@/lib/submitLead";

const typeIcons: Record<string, React.ElementType> = {
  Офис: Building2,
  Торговая: Store,
  Склад: Warehouse,
  Земля: TreePine,
};

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: property, isLoading } = useProperty(id);
  const { user } = useAuth();
  const { data: consultantAccess } = useAiConsultantAccess();
  const [activePhoto, setActivePhoto] = useState(0);
  const [showPKK, setShowPKK] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryTab, setGalleryTab] = useState<"plan" | "video" | "photos">(
    "photos",
  );
  const viewTrackedRef = useRef(false);

  useEffect(() => {
    if (!property?.id || viewTrackedRef.current) return;
    const key = `pv_${property.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    viewTrackedRef.current = true;
    void trackPropertyView(property.id);
    trackPropertyPreference({
      id: property.id,
      type: property.type,
      district: property.district,
      deal_type: property.deal_type,
      segment: property.segment,
      price: property.price,
      area: property.area,
    });
  }, [property]);
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    message: "",
  });
  const [contactSent, setContactSent] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  const _SUBJECTS = [
    "Аренда офисного помещения",
    "Аренда торговой площади",
    "Аренда склада",
    "Другое",
  ];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    try {
      const extras = (property?.extras || {}) as Record<string, unknown>;
      const managerName =
        extras.listing_manager_id && typeof extras.agent_name === "string"
          ? extras.agent_name.trim()
          : "";
      const categoryParts = [
        property?.address || null,
        managerName ? `Менеджер: ${managerName}` : null,
      ].filter(Boolean);

      await submitLead({
        object_id: id || null,
        name: contactForm.name,
        phone: contactForm.phone,
        message: contactForm.message || null,
        source: "property_contact",
        business_category: categoryParts.join(" · ") || null,
      });
      setContactSent(true);
    } catch {
      // silent fallback
    } finally {
      setContactLoading(false);
    }
  };

  const getSaved = (): string[] =>
    JSON.parse(localStorage.getItem("saved_properties") || "[]");
  const [saved, setSaved] = useState(() =>
    id ? getSaved().includes(id) : false,
  );

  const handleSave = () => {
    if (!user) {
      navigate(
        `/auth?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
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

  const { inCompare, toggleCompare } = useCompareProperties(id);

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
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Объект не найден
          </h1>
          <p className="text-muted-foreground mb-6">
            Возможно, он был снят с публикации
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            На главную
          </button>
        </div>
      </div>
    );
  }

  const propertyTypes = getPropertyTypes(property);
  const primaryType = getPrimaryPropertyType(property);
  const _Icon = typeIcons[primaryType] || Building2;
  const photos = property.photos || [];
  const photosCount = photos.length || 1;
  const mediaExtras = readPropertyMediaExtras(
    (property.extras || {}) as Record<string, unknown>,
  );
  const hasPlanChip =
    !!mediaExtras.planImageUrl || !!property.developer_unit_type_id;
  const hasVideoChip = mediaExtras.videoUrls.length > 0;
  const openGallery = (tab: "plan" | "video" | "photos" = "photos") => {
    setGalleryTab(tab);
    setGalleryOpen(true);
  };

  const isLand = isAnyLand(property);
  const isHouse = isHouseLike(property);
  const isSale = isSaleDeal(property.deal_type);
  const isResidential = isResidentialSegment(property.segment);
  const hasAiConsultant =
    !isResidential && listingHasAiConsultant(property, consultantAccess);
  const segmentHome = isResidential
    ? SEGMENT_ROUTES.residential.home
    : SEGMENT_ROUTES.commercial.home;
  const segmentCatalog = isResidential
    ? SEGMENT_ROUTES.residential.catalog
    : SEGMENT_ROUTES.commercial.catalog;
  const landExtras = (property.extras || {}) as Record<string, unknown>;
  const ownerUserIdForInquiry = getOwnerUserId(
    landExtras,
    property.submitted_by,
  );
  const ownerNameForInquiry =
    typeof landExtras.agent_name === "string"
      ? landExtras.agent_name
      : undefined;

  const rentTerms = isSale
    ? []
    : [
        {
          icon: Shield,
          label: "Депозит",
          value: property.deposit || "—",
        },
        {
          icon: Calendar,
          label: "Срок договора",
          value: property.contract_term || "—",
        },
      ];

  const cadastral = getLandCadastral(landExtras);
  const buildingType = getResidentialBuildingType(property);
  const roomsLabel = getResidentialRooms(property);
  const woodConfig = getWoodenHouseConfig(getWoodConfigId(property));
  const houseSpecs = [
    { label: "Конфигурация", value: woodConfig?.label || "—" },
    { label: "Стены", value: getWoodWall(property) || "—" },
    { label: "Этажность", value: getWoodFloors(property) || "—" },
    { label: "Фундамент", value: getWoodFoundation(property) || "—" },
    { label: "Кровля", value: getWoodRoof(property) || "—" },
    { label: "Готовность", value: getWoodFinish(property) || "—" },
  ];

  const quickStats = isLand
    ? [
        { icon: Ruler, label: "Площадь", value: `${property.area} м²` },
        {
          icon: TreePine,
          label: LAND_TYPE_LABEL,
          value: getLandUse(property) || "—",
        },
        { icon: FileText, label: "Сделка", value: property.deal_type || "—" },
        ...rentTerms,
      ]
    : [
        { icon: Ruler, label: "Общая площадь", value: `${property.area} м²` },
        {
          icon: Layers,
          label: isHouse ? "Этажей" : "Этаж",
          value:
            property.floor && property.floor !== "-"
              ? `${property.floor} из ${property.total_floors || "—"}`
              : "—",
        },
        {
          icon: Building2,
          label: "Тип дома",
          value: buildingType || "—",
        },
        {
          icon: Building2,
          label: "Потолки",
          value:
            property.ceiling_height && Number(property.ceiling_height) > 0
              ? `${property.ceiling_height} м`
              : "—",
        },
        {
          icon: Paintbrush,
          label: "Состояние",
          value: property.condition || "—",
        },
        {
          icon: Calendar,
          label: "Сделка",
          value: property.deal_type || "—",
        },
      ];

  const detailSpecs = isLand
    ? [
        { label: "Площадь", value: `${property.area} м²` },
        {
          label: "Кадастровый номер",
          value: cadastral ? (
            <button
              type="button"
              onClick={() => setShowPKK(true)}
              className="font-mono text-primary hover:underline underline-offset-2"
            >
              {cadastral}
            </button>
          ) : (
            "—"
          ),
        },
        {
          label: LAND_TYPE_LABEL,
          value: getLandUse(property) || "—",
        },
        { label: "Тип сделки", value: property.deal_type || "—" },
        ...rentTerms.map((t) => ({ label: t.label, value: t.value })),
      ]
    : [
        { label: "Площадь", value: `${property.area} м²` },
        {
          label: isHouse ? "Этажей" : "Этаж",
          value:
            property.floor && property.floor !== "-"
              ? `${property.floor} из ${property.total_floors || "—"}`
              : "—",
        },
        { label: "Комнат", value: roomsLabel || "—" },
        { label: "Тип дома", value: buildingType || "—" },
        {
          label: "Высота потолков",
          value:
            property.ceiling_height && Number(property.ceiling_height) > 0
              ? `${property.ceiling_height} м`
              : "—",
        },
        { label: "Парковка", value: property.parking || "—" },
        { label: "Состояние", value: property.condition || "—" },
        { label: "Планировка", value: property.layout || "—" },
        { label: "Тип сделки", value: property.deal_type || "—" },
        ...rentTerms.map((t) => ({ label: t.label, value: t.value })),
      ];

  const seoTitle = buildPropertyDisplayTitle(property);
  const seoDescription = buildPropertyShareOgDescription(property);
  const sharePayload = buildPropertySharePayload(property);
  const displayTitle = seoTitle;
  const addressShort = formatPropertyAddressShort(property.address);
  const listingActivity = formatListingActivityDates(property);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader
        contextSegment={isResidential ? "residential" : "commercial"}
        isLandContext={isLand}
        collapsed={headerCollapsed}
      />

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
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setContactOpen(false)}
          />
          <div className="relative bg-card w-full sm:max-w-md sm:rounded-none shadow-2xl animate-fade-in-up">
            {/* Шапка */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Оставить заявку
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-[260px]">
                  {property?.address}
                </p>
              </div>
              <button
                onClick={() => setContactOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
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
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Заявка отправлена!
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Свяжемся с вами в течение часа в рабочее время.
                  </p>
                  <button
                    onClick={() => {
                      setContactOpen(false);
                      setContactSent(false);
                      setContactForm({ name: "", phone: "", message: "" });
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Закрыть
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Имя *
                    </label>
                    <input
                      required
                      value={contactForm.name}
                      onChange={(e) =>
                        setContactForm((f) => ({ ...f, name: e.target.value }))
                      }
                      placeholder="Иван Иванов"
                      className="w-full h-10 px-3 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Телефон *
                    </label>
                    <input
                      required
                      type="tel"
                      value={contactForm.phone}
                      onChange={(e) =>
                        setContactForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      placeholder="+7 (999) 000-00-00"
                      className="w-full h-10 px-3 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                      Сообщение
                    </label>
                    <textarea
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm((f) => ({
                          ...f,
                          message: e.target.value,
                        }))
                      }
                      placeholder="Уточните ваш запрос..."
                      rows={3}
                      className="w-full px-3 py-2.5 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors resize-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
                  >
                    {contactLoading ? (
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-primary-foreground animate-bounce" />
                        <span className="w-1.5 h-1.5 bg-primary-foreground animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 bg-primary-foreground animate-bounce [animation-delay:300ms]" />
                      </span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Отправить заявку
                      </>
                    )}
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

      <div className="mt-[56px] lg:mt-[104px] border-b border-border/40">
        <div className="container mx-auto px-3 lg:px-8 h-10 lg:h-11 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Назад"
            className="shrink-0 flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <nav className="flex-1 min-w-0 flex items-center gap-1.5 text-[11px] lg:text-xs text-muted-foreground whitespace-nowrap overflow-hidden">
            <Link
              to={segmentHome}
              className="hover:text-foreground transition-colors shrink-0"
            >
              Главная
            </Link>
            <span className="shrink-0 opacity-50">/</span>
            <Link
              to={segmentCatalog}
              className="hover:text-foreground transition-colors shrink-0"
            >
              {formatPropertyTypesLabel(propertyTypes)}
            </Link>
            <span className="shrink-0 opacity-50">/</span>
            <span className="text-foreground truncate min-w-0">
              {displayTitle}
            </span>
          </nav>

          <div className="shrink-0 hidden lg:flex items-center gap-1">
            <button
              type="button"
              onClick={() => property && toggleCompare(property)}
              aria-label={inCompare ? "Убрать из сравнения" : "Сравнить"}
              aria-pressed={inCompare}
              className={`flex items-center justify-center w-8 h-8 transition-colors ${
                inCompare
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              aria-label="Сохранить"
              className={`flex items-center justify-center w-8 h-8 transition-colors ${
                saved
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart
                className="w-4 h-4"
                fill={saved ? "currentColor" : "none"}
              />
            </button>
            <PropertyShareButton property={property} />
          </div>
        </div>
      </div>

      {/* Mobile bottom action bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border shadow-[0_-8px_24px_-12px_hsl(0_0%_0%/0.15)]">
        <div className="grid grid-cols-5 px-2 py-2 gap-1 max-w-lg mx-auto">
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
                  className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-md text-foreground hover:bg-muted active:scale-95 transition-all w-full"
                >
                  <Mail className="w-6 h-6" strokeWidth={1.75} />
                  <span className="text-[9px] font-medium whitespace-nowrap">
                    Заявка
                  </span>
                </button>
              }
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setContactOpen(true);
                setContactSent(false);
              }}
              aria-label="Задать вопрос"
              className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-md text-foreground hover:bg-muted active:scale-95 transition-all"
            >
              <Mail className="w-6 h-6" strokeWidth={1.75} />
              <span className="text-[9px] font-medium whitespace-nowrap">
                Задать вопрос
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => toggleCompare(property)}
            aria-label={inCompare ? "Убрать из сравнения" : "Сравнить"}
            aria-pressed={inCompare}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-md active:scale-95 transition-all ${
              inCompare
                ? "text-foreground bg-muted"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <Columns2 className="w-6 h-6" strokeWidth={1.75} />
            <span className="text-[10px] font-medium">Сравнить</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            aria-label="Сохранить"
            aria-pressed={saved}
            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-md active:scale-95 transition-all ${
              saved
                ? "text-foreground bg-muted"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <Heart
              className="w-6 h-6"
              strokeWidth={1.75}
              fill={saved ? "currentColor" : "none"}
            />
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
        className="container mx-auto px-4 lg:px-8 pt-4 lg:pt-6 pb-24 lg:pb-10 flex-1"
      >
        <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground leading-tight tracking-[0.015em] mb-1.5">
          {displayTitle}
        </h1>
        {addressShort && (
          <p className="mb-5 lg:mb-7 text-sm text-muted-foreground flex items-start gap-1.5">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
            <span>{addressShort}</span>
          </p>
        )}

        <PropertyStickyNav
          sections={[
            {
              id: "photos",
              label: `Фотографии${photosCount > 0 ? ` (${photosCount})` : ""}`,
            },
            { id: "description", label: "Описание" },
            { id: "location", label: "Расположение" },
            { id: "similar", label: "Похожие объявления" },
          ]}
          title={displayTitle}
          property={property}
          onPinnedChange={setHeaderCollapsed}
        />

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <div className="flex-1 min-w-0">
            {/* Gallery */}
            <div id="photos" className="mb-8 scroll-mt-14">
              <div
                role="button"
                tabIndex={0}
                onClick={() => openGallery("photos")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openGallery("photos");
                  }
                }}
                className="relative bg-muted aspect-[16/10] lg:aspect-[3/2] overflow-hidden rounded-lg cursor-zoom-in group/gallery"
              >
                <img
                  src={
                    photos.length > 0
                      ? photos[activePhoto]
                      : getDefaultPropertyImage(primaryType)
                  }
                  alt={property.address}
                  className="w-full h-full object-cover object-top"
                />
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-foreground/25 to-transparent"
                  aria-hidden
                />
                {photosCount > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhoto(Math.max(0, activePhoto - 1));
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-background/90 backdrop-blur flex items-center justify-center text-foreground shadow-card hover:bg-background transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhoto(
                          Math.min(photosCount - 1, activePhoto + 1),
                        );
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-background/90 backdrop-blur flex items-center justify-center text-foreground shadow-card hover:bg-background transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-[1]">
                  {propertyTypes.map((t) => (
                    <span
                      key={t}
                      className="px-3 py-1.5 rounded-md bg-background/90 text-foreground text-xs font-medium backdrop-blur-sm"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <span className="absolute bottom-4 right-4 z-[1] px-3.5 py-2 rounded-md bg-foreground/85 text-background text-sm font-medium tabular-nums tracking-wide backdrop-blur-sm">
                  {activePhoto + 1} / {photosCount}
                </span>
                <span className="absolute bottom-4 left-4 z-[1] px-3 py-1.5 rounded-md bg-background/90 text-foreground text-xs font-medium opacity-0 group-hover/gallery:opacity-100 transition-opacity pointer-events-none">
                  Открыть галерею
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => openGallery("photos")}
                  className="h-8 px-3 rounded-md border border-border text-xs font-medium hover:border-foreground/30"
                >
                  {photos.length || 1} фото
                </button>
                {hasVideoChip && (
                  <button
                    type="button"
                    onClick={() => openGallery("video")}
                    className="h-8 px-3 rounded-md border border-border text-xs font-medium hover:border-foreground/30"
                  >
                    Видео
                  </button>
                )}
                {hasPlanChip && (
                  <button
                    type="button"
                    onClick={() => openGallery("plan")}
                    className="h-8 px-3 rounded-md border border-border text-xs font-medium hover:border-foreground/30"
                  >
                    {planTabLabel(property)}
                  </button>
                )}
              </div>

              {photos.length > 1 && (
                <div className="flex gap-2.5 mt-3 overflow-x-auto scrollbar-none">
                  {photos.slice(0, 8).map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => {
                        setActivePhoto(i);
                        openGallery("photos");
                      }}
                      className={`shrink-0 w-24 h-16 lg:w-28 lg:h-20 rounded-md overflow-hidden border-2 transition-colors ${
                        activePhoto === i
                          ? "border-foreground"
                          : "border-transparent hover:border-border"
                      }`}
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover object-top"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Meta: date, views, ID — under gallery */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-7 text-xs text-muted-foreground">
              {listingActivity.addedLabel && (
                <span className="flex items-center gap-1.5" title="Добавлен">
                  <Clock className="w-3.5 h-3.5" />
                  {listingActivity.addedLabel}
                </span>
              )}
              {listingActivity.updatedLabel && (
                <span className="flex items-center gap-1.5" title="Обновлён">
                  обн. {listingActivity.updatedLabel}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                {formatListingViews(property.views_count)} просмотров
              </span>
              <span className="text-muted-foreground/60">
                ID: {property.id.slice(0, 8)}
              </span>
            </div>

            <div className="lg:hidden mb-8">
              <PropertyPriceBlock
                property={property}
                hasAiConsultant={hasAiConsultant}
              />
            </div>

            <section id="description" className="mb-10 scroll-mt-14">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                Описание
              </h2>
              <PropertyDescription text={property.description} />
            </section>

            <PropertyUnitsTable propertyId={property.id} />

            <SpecQuickStats items={quickStats} className="mb-10" />

            <section className="mb-10">
              <h2 className="font-display text-lg font-semibold text-foreground mb-3">
                О объекте
              </h2>
              <SpecGrid items={detailSpecs} />
            </section>

            {isHouse && houseSpecs.some((s) => s.value && s.value !== "—") && (
              <section className="mb-10">
                <h2 className="font-display text-lg font-semibold text-foreground mb-3">
                  О доме
                </h2>
                <SpecGrid items={houseSpecs} />
              </section>
            )}

            {(property.features || []).length > 0 && (
              <section className="mb-10">
                <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                  В объекте есть
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
                  {(property.features || []).map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-sm text-foreground"
                    >
                      <Check
                        className="w-4 h-4 text-muted-foreground shrink-0"
                        strokeWidth={1.75}
                      />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section id="location" className="mb-10 scroll-mt-14">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">
                Расположение
              </h2>
              <PropertyMap
                address={property.address}
                district={property.district}
                lat={(property as any).lat ?? null}
                lng={(property as any).lng ?? null}
                height={340}
              />
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-muted-foreground" />{" "}
                  {property.address} · {property.district}
                </div>
              </div>
            </section>
          </div>

          <aside className="hidden lg:block w-[360px] shrink-0">
            <div
              className={`sticky space-y-5 ${
                headerCollapsed ? "top-16" : "top-24"
              }`}
            >
              <PropertyPriceBlock
                property={property}
                hasAiConsultant={hasAiConsultant}
              />
              <PropertySidebarExtras property={property} />
            </div>
          </aside>
        </div>

        {hasAiConsultant && (
          <PropertyAIChat
            propertyId={property.id}
            propertyAddress={property.address}
            avatarUrl={consultantAvatarForListing(property, consultantAvatar)}
          />
        )}

        <div id="similar" className="scroll-mt-14">
          <NearbyPropertiesSlider
            district={property.district}
            excludeId={property.id}
            type={formatPropertyTypesLabel(propertyTypes)}
          />
        </div>
      </motion.main>
      <SiteFooter />
      {showPKK && getLandCadastral(landExtras) && (
        <PKKMapModal
          cadastralNumber={getLandCadastral(landExtras)!}
          onClose={() => setShowPKK(false)}
        />
      )}
      <PropertyMediaGallery
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        property={property}
        initialTab={galleryTab}
        initialPhotoIndex={activePhoto}
      />
    </div>
  );
}

function PropertyPriceBlock({
  property,
  hasAiConsultant,
}: {
  property: any;
  hasAiConsultant: boolean;
}) {
  const extras = (property.extras || {}) as Record<string, unknown>;
  const ownerListing = isOwnerListing(extras, property.submitted_by);
  const agencyListing = isAgencyListing(property);
  const ownerUserId = getOwnerUserId(extras, property.submitted_by);
  const ownerName =
    typeof extras.agent_name === "string" ? extras.agent_name : undefined;
  const isResidential = isResidentialSegment(property.segment);
  const typesLabel = formatPropertyTypesLabel(getPropertyTypes(property));
  const useOwnerInquiry = isResidential || ownerListing || agencyListing;
  const isSale = isSaleDeal(property.deal_type);
  const sidebar = resolveSidebarDisplay(property);

  const termRows: { label: string; value: string; emphasis?: boolean }[] = [];
  if (!isSale) {
    if (property.deposit)
      termRows.push({ label: "Залог", value: String(property.deposit) });
    if (sidebar.utilities_included !== "—")
      termRows.push({
        label: "Коммунальные",
        value: sidebar.utilities_included,
      });
    if (sidebar.min_term !== "—")
      termRows.push({
        label: "Срок аренды",
        value: sidebar.min_term,
        emphasis: true,
      });
    if (property.contract_term && sidebar.min_term === "—")
      termRows.push({
        label: "Срок договора",
        value: String(property.contract_term),
      });
  }
  if (sidebar.vat !== "—" && !isSale)
    termRows.push({ label: "НДС", value: sidebar.vat });

  return (
    <div
      id="contact-form"
      className="bg-card rounded-lg border border-border/70 p-5 scroll-mt-24 space-y-4"
    >
      {Number(property.price) > 0 ? (
        <div>
          <div className="price-display text-2xl lg:text-[1.75rem] text-foreground leading-none">
            {Number(property.price).toLocaleString("ru-RU")} ₽
            {property.deal_type === "Аренда" && (
              <span className="text-sm font-normal text-muted-foreground tracking-normal ml-1">
                /мес
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1.5 tabular-nums">
            {Number(property.price_per_m2) > 0 && (
              <>
                {Number(property.price_per_m2).toLocaleString("ru-RU")} ₽/м² ·{" "}
              </>
            )}
            {property.area} м² · {property.deal_type || "Сделка"}
          </div>
        </div>
      ) : (
        <div>
          <div className="price-display text-xl lg:text-2xl text-foreground">
            По запросу
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {property.area} м² · {typesLabel}
          </div>
        </div>
      )}

      {termRows.length > 0 && (
        <div className="border-t border-border/50 pt-1">
          {termRows.map((row) => (
            <SpecRow
              key={row.label}
              label={row.label}
              value={row.value}
              emphasis={row.emphasis}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {hasAiConsultant ? (
          <button
            type="button"
            onClick={() =>
              openConsultantChat({
                propertyId: property.id,
                propertyAddress: property.address,
                avatarUrl: consultantAvatarForListing(
                  property,
                  consultantAvatar,
                ),
              })
            }
            className={`${propertyCtaButtonClass} bg-primary text-primary-foreground`}
          >
            <MessageSquareText className="w-4 h-4 shrink-0" />
            Написать
          </button>
        ) : useOwnerInquiry ? (
          <OwnerMessageDialog
            propertyId={property.id}
            propertyAddress={property.address}
            ownerName={ownerName}
            ownerUserId={ownerUserId || undefined}
            title={isResidential ? "Оставить заявку" : "Задать вопрос"}
            source={isResidential ? "property_inquiry" : "owner_message"}
          />
        ) : (
          <OwnerMessageDialog
            propertyId={property.id}
            propertyAddress={property.address}
            ownerName={ownerName}
            ownerUserId={ownerUserId || undefined}
            title="Задать вопрос"
            source="owner_message"
          />
        )}
        <RevealListingPhone property={property} />
      </div>
      <div className="flex items-center gap-2 border-t border-border/50 pt-2">
        <RequestPriceDialog
          propertyId={property.id}
          propertyAddress={property.address}
          basePrice={Number(property.price) || undefined}
          dealType={property.deal_type}
          trigger={
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors min-w-0 flex-1 justify-start"
            >
              <Tag className="w-3 h-3 shrink-0" />
              <span className="truncate">Предложить свою цену</span>
            </button>
          }
        />
        <span className="text-border shrink-0" aria-hidden>
          ·
        </span>
        <ReportListingDialog
          propertyId={property.id}
          propertyAddress={property.address}
          trigger={
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors min-w-0 flex-1 justify-end"
            >
              <Flag className="w-3 h-3 shrink-0" />
              <span className="truncate">Сообщить о проблеме</span>
            </button>
          }
        />
      </div>
    </div>
  );
}
