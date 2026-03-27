import { useParams, useNavigate, Link } from "react-router-dom";
import { getPropertyById } from "@/data/properties";
import {
  ArrowLeft, Heart, Share2, MapPin, Clock, Eye, Phone, Mail,
  Building2, Ruler, Layers, Car, Paintbrush, LayoutGrid, FileText,
  Shield, Calendar, ChevronLeft, ChevronRight, Train, User,
} from "lucide-react";
import { useState } from "react";

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const property = getPropertyById(Number(id));
  const [saved, setSaved] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", message: "" });

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

  const Icon = property.icon;
  const specs = [
    { icon: Ruler, label: "Площадь", value: `${property.area} м²` },
    { icon: Layers, label: "Этаж", value: property.floor !== "-" ? `${property.floor} из ${property.totalFloors}` : "—" },
    { icon: Building2, label: "Высота потолков", value: property.ceilingHeight > 0 ? `${property.ceilingHeight} м` : "—" },
    { icon: Car, label: "Парковка", value: property.parking },
    { icon: Paintbrush, label: "Состояние", value: property.condition },
    { icon: LayoutGrid, label: "Планировка", value: property.layout },
    { icon: FileText, label: "Тип сделки", value: property.dealType },
    { icon: Shield, label: "Депозит", value: property.deposit },
    { icon: Calendar, label: "Срок договора", value: property.contractTerm },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Назад к списку</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSaved(!saved)}
              className={`p-2 rounded-lg transition-colors ${saved ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              <Heart className="w-5 h-5" fill={saved ? "currentColor" : "none"} />
            </button>
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-6 lg:py-10">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Главная</Link>
          <span>/</span>
          <span className="hover:text-foreground transition-colors cursor-pointer">{property.type}</span>
          <span>/</span>
          <span className="text-foreground">{property.address}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column — content */}
          <div className="flex-1 min-w-0">
            {/* Gallery */}
            <div className="rounded-2xl overflow-hidden mb-6">
              <div className="relative bg-gradient-to-br from-muted to-secondary aspect-[16/9] flex items-center justify-center">
                <Icon className="w-20 h-20 text-muted-foreground/20" />
                {/* Photo nav arrows */}
                <button
                  onClick={() => setActivePhoto(Math.max(0, activePhoto - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center text-foreground shadow-card hover:bg-card transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActivePhoto(Math.min(property.photos - 1, activePhoto + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center text-foreground shadow-card hover:bg-card transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                {/* Badges */}
                <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {property.type}
                </span>
                {property.class !== "-" && (
                  <span className="absolute top-4 left-[calc(4rem+1rem)] px-3 py-1.5 rounded-full bg-card text-foreground text-xs font-medium shadow-card">
                    Класс {property.class}
                  </span>
                )}
                <span className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur text-foreground text-xs font-medium">
                  {activePhoto + 1} / {property.photos}
                </span>
              </div>
              {/* Thumbnails */}
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {Array.from({ length: Math.min(property.photos, 6) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhoto(i)}
                    className={`shrink-0 w-20 h-14 rounded-lg bg-gradient-to-br from-muted to-secondary flex items-center justify-center transition-all ${
                      activePhoto === i ? "ring-2 ring-primary ring-offset-2" : "opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Icon className="w-5 h-5 text-muted-foreground/30" />
                  </button>
                ))}
              </div>
            </div>

            {/* Title + price (mobile) */}
            <div className="lg:hidden mb-6">
              <PropertyPriceBlock property={property} />
            </div>

            {/* Description */}
            <section className="mb-8">
              <h2 className="font-display text-xl font-semibold text-foreground mb-3">Описание</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p>
            </section>

            {/* Specs grid */}
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

            {/* Features */}
            <section className="mb-8">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">Удобства и оснащение</h2>
              <div className="flex flex-wrap gap-2">
                {property.features.map((f) => (
                  <span key={f} className="px-3.5 py-2 rounded-full bg-card shadow-card text-sm text-foreground border border-border">
                    {f}
                  </span>
                ))}
              </div>
            </section>

            {/* Location */}
            <section className="mb-8">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">Расположение</h2>
              <div className="rounded-2xl bg-gradient-to-br from-secondary to-muted h-64 relative overflow-hidden flex items-center justify-center">
                {/* Grid lines */}
                <div className="absolute inset-0 opacity-10">
                  {[...Array(6)].map((_, i) => (
                    <div key={`h${i}`} className="absolute w-full h-px bg-foreground" style={{ top: `${(i + 1) * 14}%` }} />
                  ))}
                  {[...Array(8)].map((_, i) => (
                    <div key={`v${i}`} className="absolute h-full w-px bg-foreground" style={{ left: `${(i + 1) * 11}%` }} />
                  ))}
                </div>
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary relative">
                    <div className="absolute inset-0 rounded-full bg-primary map-pulse" />
                  </div>
                  <span className="text-xs font-medium text-foreground bg-card/80 backdrop-blur px-3 py-1.5 rounded-full shadow-card">
                    {property.address}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  {property.district} район
                </div>
                {property.metro !== "-" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Train className="w-4 h-4 text-primary" />
                    м. {property.metro} — {property.metroMinutes} мин пешком
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right column — sticky card */}
          <aside className="hidden lg:block w-[360px] shrink-0">
            <div className="sticky top-20 space-y-5">
              <PropertyPriceBlock property={property} />
              <PropertyContactCard property={property} contactForm={contactForm} setContactForm={setContactForm} />
            </div>
          </aside>
        </div>

        {/* Mobile contact card */}
        <div className="lg:hidden mt-6">
          <PropertyContactCard property={property} contactForm={contactForm} setContactForm={setContactForm} />
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-4 mt-8 pt-6 border-t border-border text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Опубликовано {property.publishedDate}</span>
          <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {property.views} просмотров</span>
          <span>ID: {property.id}</span>
        </div>
      </main>
    </div>
  );
}

/* --- Sub-components --- */

function PropertyPriceBlock({ property }: { property: ReturnType<typeof getPropertyById> }) {
  if (!property) return null;
  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <div className="text-3xl font-bold text-foreground">
        {property.price.toLocaleString("ru-RU")} ₽<span className="text-base font-normal text-muted-foreground">/мес</span>
      </div>
      <div className="text-sm text-muted-foreground mt-1">
        {property.pricePerM2.toLocaleString("ru-RU")} ₽/м²/мес · {property.area} м²
      </div>
      <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4 text-primary shrink-0" />
        {property.address}
      </div>
      {property.metro !== "-" && (
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <Train className="w-4 h-4 text-primary shrink-0" />
          м. {property.metro} · {property.metroMinutes} мин
        </div>
      )}
    </div>
  );
}

function PropertyContactCard({
  property,
  contactForm,
  setContactForm,
}: {
  property: ReturnType<typeof getPropertyById>;
  contactForm: { name: string; phone: string; message: string };
  setContactForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string; message: string }>>;
}) {
  if (!property) return null;
  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      {/* Agent */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{property.agent.name}</div>
          <div className="text-xs text-muted-foreground">{property.agent.company}</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-5">
        <a
          href={`tel:${property.agent.phone}`}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Phone className="w-4 h-4" />
          Позвонить
        </a>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
          <Mail className="w-4 h-4" />
          Написать
        </button>
      </div>

      {/* Contact form */}
      <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
        <input
          type="text"
          placeholder="Ваше имя"
          value={contactForm.name}
          onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-xl bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <input
          type="tel"
          placeholder="Телефон"
          value={contactForm.phone}
          onChange={(e) => setContactForm((p) => ({ ...p, phone: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-xl bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <textarea
          placeholder="Сообщение"
          rows={3}
          value={contactForm.message}
          onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-xl bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <button
          type="submit"
          className="w-full py-2.5 rounded-xl bg-gold text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Отправить заявку
        </button>
      </form>
    </div>
  );
}
