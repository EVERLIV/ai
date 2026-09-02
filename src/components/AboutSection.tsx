import { Ban, Handshake, MapPinned, Quote, Unlock } from "lucide-react";
import { Link } from "react-router-dom";
import managerPhoto from "@/assets/manager-arenda-city.jpg";
import { COMPANY } from "@/config/company";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const reasons = [
  {
    icon: Unlock,
    title: "Бесплатный доступ",
    desc: "Каталог открыт всем жителям Иркутска и области — без подписок и платных просмотров.",
  },
  {
    icon: Ban,
    title: "Без переплат на агрегаторах",
    desc: "Объекты идут напрямую от собственников и агентства, а не через чужие витрины с наценкой.",
  },
  {
    icon: Handshake,
    title: "Без лишних комиссий",
    desc: "Прозрачные условия сделки. Не навязываем посредников и скрытые сборы за «вход».",
  },
  {
    icon: MapPinned,
    title: "Регион целиком",
    desc: "Иркутск, Ангарск, Шелехов и область — коммерция и жильё в одном месте.",
  },
];

export default function AboutSection() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} id="about" className="py-20 bg-surface-warm">
      <div
        className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
      >
        <div className="max-w-3xl mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-4">
            О портале
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-[0.015em]">
            {COMPANY.brand} — портал недвижимости региона
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-2xl">
            Площадку создало агентство недвижимости в Иркутске и области, чтобы
            жители могли находить объекты и сделки по аренде сами: бесплатно,
            без переплат на агрегаторах и без лишних комиссий.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 relative overflow-hidden bg-foreground min-h-[440px]">
            <img
              src={managerPhoto}
              alt="Менеджер ДАДАТУТ"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-95"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/40 to-transparent" />
            <div className="relative h-full flex flex-col justify-end p-8 lg:p-10 text-background">
              <Quote className="w-10 h-10 text-primary mb-3 -ml-1" strokeWidth={1.5} />
              <blockquote className="font-display text-xl lg:text-2xl leading-snug font-medium max-w-xl">
                «Рынку региона нужен свой открытый каталог. Мы сделали портал,
                где объекты доступны всем — а агентство рядом, если нужна помощь
                со сделкой.»
              </blockquote>
              <div className="mt-5 flex items-center gap-3">
                <div className="w-10 h-px bg-primary" />
                <div>
                  <div className="text-sm font-semibold">
                    Команда ДАДАТУТ
                  </div>
                  <div className="text-xs text-background/70">
                    Иркутск и область
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-card p-7 shadow-card flex-1">
              <h3 className="font-display text-xl font-bold text-foreground mb-3">
                Зачем мы запустили портал
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Агентство работает на рынке региона с 2013 года. Портал —
                следующий шаг: вы сами смотрите объявления, связываетесь с
                менеджером или публикуете объект бесплатно. Жильё и коммерция в
                одном кабинете.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {reasons.map((r) => {
                  const Icon = r.icon;
                  return (
                    <div key={r.title} className="bg-surface-warm p-4">
                      <Icon className="w-4 h-4 text-primary mb-2" strokeWidth={1.75} />
                      <div className="text-sm font-semibold text-foreground leading-snug">
                        {r.title}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                        {r.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-foreground text-background p-7 shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-base font-medium leading-relaxed">
                Нужны детали о компании или условия размещения — напишите нам.
              </p>
              <Link
                to="/about"
                className="ui-btn-primary shrink-0"
              >
                О компании
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
