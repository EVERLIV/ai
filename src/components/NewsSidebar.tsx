import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Phone } from "lucide-react";
import { CONTACTS } from "@/config/company";
import ctaRentOutBg from "@/assets/cta-rent-out.jpg";

export default function NewsSidebar() {
  return (
    <aside className="w-full space-y-5 min-w-0">

      {/* ── BANNER: New construction ── */}
      <div className="relative overflow-hidden text-background" style={{ minHeight: 280 }}>
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80"
          alt="БЦ Кварта"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/60" />

        <div className="relative p-5 flex flex-col h-full" style={{ minHeight: 280 }}>
          <div className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-1 mb-4 self-start">
            <Sparkles className="w-2.5 h-2.5" /> Новый объект
          </div>

          <div
            className="p-4 mb-4"
            style={{
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <h3 className="font-display text-lg font-bold leading-snug mb-0.5">БЦ «Кварта»</h3>
            <p className="text-background/70 text-xs mb-3">Иркутск, Центр · Офисы класса А</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Этажей", value: "12" },
                { label: "Класс", value: "A" },
                { label: "Сдача", value: "Q3'26" },
              ].map(s => (
                <div key={s.label} className="py-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="font-bold text-sm">{s.value}</div>
                  <div className="text-[9px] text-background/50 uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-background/70 leading-relaxed mb-4">
            2 500 м² · Предварительная бронь открыта
          </p>

          <a
            href={`tel:${CONTACTS.phoneTel}`}
            className="flex items-center justify-center gap-2 w-full h-9 bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity mt-auto"
          >
            <Phone className="w-3.5 h-3.5" /> Узнать подробнее
          </a>
          <p className="text-[9px] text-background/30 text-center mt-2 uppercase tracking-widest">Рекламный блок</p>
        </div>
      </div>

      {/* ── CTA banner ── */}
      <div className="relative overflow-hidden text-background" style={{ minHeight: 260 }}>
        <img
          src={ctaRentOutBg}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/75 to-foreground/55" />

        <div className="relative p-5 flex flex-col h-full" style={{ minHeight: 260 }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-2">Для собственников</p>
          <h4 className="font-display text-base font-bold text-background mb-1">Сдайте объект за 14 дней</h4>
          <p className="text-[11px] text-background/75 leading-relaxed mb-4">
            Профессиональный маркетинг, проверенные арендаторы, юридическое сопровождение — всё включено.
          </p>
          <Link
            to="/list-property"
            className="flex items-center justify-center gap-1.5 h-9 w-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity mt-auto"
          >
            Разместить объект <ArrowRight className="w-3 h-3" />
          </Link>
          <p className="text-[9px] text-background/35 text-center mt-2 uppercase tracking-widest">Реклама</p>
        </div>
      </div>

    </aside>
  );
}
