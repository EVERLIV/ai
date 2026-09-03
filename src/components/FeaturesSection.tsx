import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const items = [
  {
    n: "01",
    title: "Каталог по фильтрам и карте",
    lead: "Аренда, продажа и посуточно. Жильё, коммерция и земля в одной выдаче по Иркутску, Ангарску, Шелехову и области.",
    details: [
      "Тип объекта, площадь, цена, район и этаж задаёте сами, без готовых «подборок».",
      "На карте видно, где объект стоит относительно улицы и соседних объявлений.",
      "Карточка: фото, описание, кадастр, контакты собственника или риелтора.",
    ],
    href: "/catalog",
    cta: "Открыть каталог",
  },
  {
    n: "02",
    title: "Подбор в диалоге",
    lead: "Опишите задачу своими словами: «офис 40 метров в центре» или «двушка до 30 тысяч». Консультант ищет по живой базе, а не по шаблону.",
    details: [
      "Ответ строится из объявлений, которые уже в каталоге.",
      "Можно сузить город, бюджет и тип сделки по ходу разговора.",
      "Если подходящего нет, заявка уходит менеджеру, а не «в никуда».",
    ],
    href: "/catalog",
    cta: "Каталог",
  },
  {
    n: "03",
    title: "Следить за поиском",
    lead: "Сохраняете текущие фильтры и получаете письмо, когда появляется объект под них. Не нужно заходить каждый день.",
    details: [
      "Работает с той же выдачей, что вы уже смотрите в каталоге.",
      "Письмо приходит на email из профиля.",
      "Критерии можно сменить: старый набор отключается, новый пишется заново.",
    ],
    href: "/catalog",
    cta: "Настроить в каталоге",
  },
  {
    n: "04",
    title: "Избранное и сравнение",
    lead: "Откладываете варианты, чтобы вернуться позже. Сравнение ставит площадь, цену и характеристики рядом, без переключения вкладок.",
    details: [
      "Избранное доступно в кабинете и с телефона.",
      "В сравнение попадают объекты одной категории, чтобы цифры были сопоставимы.",
      "Заявку на просмотр отправляете с карточки, история остаётся в кабинете.",
    ],
    href: "/account",
    cta: "Кабинет",
  },
  {
    n: "05",
    title: "Публикация объявления",
    lead: "Собственник размещает жильё или помещение бесплатно. Карточку можно заполнить самому или надиктовать ИИ-черновик, затем проверить и отправить на модерацию.",
    details: [
      "После проверки объявление появляется в поиске и на карте.",
      "Правки, пауза и снятие с публикации — в «Моих объектах».",
      "Если нет времени на форму, пришлите адрес, цену и фото на почту, подготовим карточку.",
    ],
    href: "/list-property",
    cta: "Разместить объект",
  },
  {
    n: "06",
    title: "Риелторы и агентства",
    lead: "Отдельный каталог специалистов: профиль, районы, типы объектов. Можно занести агентство или риелтора сами или попросить нас добавить запись.",
    details: [
      "В карточке видно, сколько объявлений сейчас в работе.",
      "Отзывы и ответ по времени, если агентство их ведёт.",
      "Заявка уходит выбранному человеку, а не «в общую линию».",
    ],
    href: "/rieltory",
    cta: "Каталог риелторов",
  },
];

export default function FeaturesSection() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="py-16 lg:py-20 bg-background border-y border-border/50">
      <div
        className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
      >
        <div className="max-w-2xl mb-10 lg:mb-14">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-2">
            Возможности
          </p>
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-foreground leading-tight">
            Поиск, публикация и работа с заявками
          </h2>
          <p className="mt-3 text-[15px] text-muted-foreground leading-relaxed">
            Отфильтровать выдачу, сохранить поиск, сравнить два помещения,
            выложить своё или написать риелтору. Ниже — как это устроено.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-border/70 border border-border/70">
          {items.map((item) => (
            <article
              key={item.n}
              className="bg-background p-6 sm:p-8 flex flex-col min-h-[280px]"
            >
              <div className="flex items-baseline justify-between gap-4 mb-3">
                <span className="font-display text-xs tabular-nums tracking-widest text-primary">
                  {item.n}
                </span>
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground leading-snug mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {item.lead}
              </p>
              <ul className="space-y-2 mb-6 flex-1">
                {item.details.map((line) => (
                  <li
                    key={line}
                    className="text-[13px] leading-relaxed text-foreground/80 pl-3 border-l border-primary/30"
                  >
                    {line}
                  </li>
                ))}
              </ul>
              <Link
                to={item.href}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline self-start"
              >
                {item.cta} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
