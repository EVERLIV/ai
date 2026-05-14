import { Link } from "react-router-dom";
import { MapPin, ArrowRight, Building2, Sparkles, Phone } from "lucide-react";
import { useProperties } from "@/hooks/useProperties";
import { getPropertyCover } from "@/lib/propertyImages";
import PropertyAIChat from "@/components/PropertyAIChat";

const TYPE_LABELS: Record<string, string> = {
  "Офис": "Офис", "Торговая": "Торговля", "Склад": "Склад",
  "Земля": "Земля", "Производство": "Производство",
};

export default function NewsSidebar() {
  const { data: properties = [] } = useProperties();
  const featured = properties.slice(0, 5);

  return (
    <aside className="w-full lg:w-[300px] shrink-0 space-y-5">

      {/* ── BANNER: New construction ── */}
      <div className="relative overflow-hidden bg-foreground text-background">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.15) 10px, rgba(255,255,255,0.15) 11px)",
          }}
        />
        <div className="relative p-5">
          <div className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-1 mb-3">
            <Sparkles className="w-2.5 h-2.5" /> Новый объект
          </div>
          <h3 className="font-display text-lg font-bold leading-snug mb-1">
            БЦ «Кварта»<br />
            <span className="text-background/70 text-sm font-normal">Иркутск, Центр</span>
          </h3>
          <p className="text-[11px] text-background/60 leading-relaxed mb-4">
            Офисы класса А · 2 500 м² · Сдача Q3 2026<br />
            Предварительная бронь открыта
          </p>
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            {[
              { label: "Этажей", value: "12" },
              { label: "Класс", value: "A" },
              { label: "Паркинг", value: "✓" },
            ].map(s => (
              <div key={s.label} className="bg-background/10 py-2">
                <div className="font-bold text-sm">{s.value}</div>
                <div className="text-[9px] text-background/50 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
          <a
            href="tel:+73952551234"
            className="flex items-center justify-center gap-2 w-full h-9 bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Phone className="w-3.5 h-3.5" /> Узнать подробнее
          </a>
          <p className="text-[9px] text-background/30 text-center mt-2 uppercase tracking-widest">Рекламный блок</p>
        </div>
      </div>

      {/* ── Properties list ── */}
      <div className="bg-card border border-border">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Объекты</span>
          <Link to="/catalog" className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5">
            Все <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-muted-foreground">
            <Building2 className="w-6 h-6 mx-auto mb-2 opacity-30" />
            Объекты появятся здесь
          </div>
        ) : (
          <div className="divide-y divide-border">
            {featured.map((p) => (
              <Link
                key={p.id}
                to={`/property/${p.id}`}
                className="group flex gap-3 p-3 hover:bg-muted transition-colors"
              >
                <div className="shrink-0 w-16 h-14 bg-muted overflow-hidden">
                  <img
                    src={p.cover_photo || getPropertyCover(p.cover_photo, p.type)}
                    alt={p.address}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-muted-foreground mb-0.5">
                    {TYPE_LABELS[p.type] ?? p.type} · {p.area} м²
                  </div>
                  <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {p.address}
                  </div>
                  <div className="text-[11px] font-bold text-foreground mt-1">
                    {Number(p.price).toLocaleString("ru-RU")} ₽
                    <span className="font-normal text-muted-foreground">
                      {p.deal_type === "Аренда" ? "/мес" : ""}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="px-4 py-3 border-t border-border">
          <Link
            to="/catalog"
            className="flex items-center justify-center gap-1.5 h-8 w-full border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            Смотреть все объекты <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── Second banner: CTA ── */}
      <div className="bg-muted/60 border border-border p-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Для собственников</p>
        <h4 className="font-display text-base font-bold text-foreground mb-1">Сдайте объект за 14 дней</h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
          Профессиональный маркетинг, проверенные арендаторы, юридическое сопровождение — всё включено.
        </p>
        <Link
          to="/list-property"
          className="flex items-center justify-center gap-1.5 h-8 w-full bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Разместить объект
        </Link>
        <p className="text-[9px] text-muted-foreground/50 text-center mt-2 uppercase tracking-widest">Реклама</p>
      </div>

    </aside>
  );
}
