import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  FileText,
  Megaphone,
  Phone as PhoneIcon,
  Settings2,
  ShieldCheck,
  Star,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";
import { CONTACTS } from "@/config/company";
import type { PropertySegment } from "@/config/propertySegments";
import { useAuth } from "@/hooks/useAuth";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  type ListPropertyMode,
  listPropertyPath,
  loginToAddPropertyPath,
  placementCtaPath,
} from "@/lib/listPropertyLinks";

interface Props {
  variant?: "page" | "section";
  segment?: PropertySegment;
}

const freeStepsCommercial = [
  { title: "Зарегистрируйтесь", body: "Имя, телефон и email — меньше минуты." },
  {
    title: "Заполните карточку объекта",
    body: "Адрес, площадь, ставка, фото и описание в кабинете.",
  },
  {
    title: "Дождитесь проверки",
    body: "После модерации объявление появится в каталоге и начнёт получать заявки.",
  },
];

const freeStepsResidential = [
  { title: "Зарегистрируйтесь", body: "Имя, телефон и email — меньше минуты." },
  {
    title: "Добавьте квартиру, дом или комнату",
    body: "Адрес, площадь, цена, фото и описание в кабинете.",
  },
  {
    title: "Дождитесь проверки",
    body: "После модерации жильё появится в каталоге и начнёт получать отклики.",
  },
];

const freePerksCommercial = [
  "Размещение в каталоге бесплатно",
  "Редактируйте объявление в любой момент",
  "Заявки приходят в личный кабинет",
  "Нужна помощь — подключим менеджера",
];

const freePerksResidential = [
  "Размещение жилья бесплатно",
  "Редактируйте объявление в любой момент",
  "Отклики приходят в личный кабинет",
  "Нужна помощь — подключим менеджера",
];

const managementSteps = [
  {
    n: "1",
    title: "Подберём менеджера",
    body: "Персональный менеджер изучит объект и предложит цену, условия и аудиторию.",
  },
  {
    n: "2",
    title: "Подготовим к сдаче",
    body: "Профессиональные фото, продающее описание и оценка рыночной ставки.",
  },
  {
    n: "3",
    title: "Разместим и продвинем",
    body: "Каталог, SEO и партнёрские площадки — чтобы найти арендатора быстрее.",
  },
  {
    n: "4",
    title: "Звонки и показы — на нас",
    body: "Принимаем звонки, организуем показы и отсеиваем неподходящих кандидатов.",
  },
];

const managementPerks = [
  {
    icon: ShieldCheck,
    title: "Проверенные арендаторы",
    body: "Проверяем платёжеспособность и репутацию перед показом.",
  },
  {
    icon: FileText,
    title: "Договор и документы",
    body: "Юридическое сопровождение: договор, акты, контроль оплат.",
  },
  {
    icon: Camera,
    title: "Фото и маркетинг",
    body: "Профессиональная съёмка и описание — за наш счёт.",
  },
  {
    icon: BarChart3,
    title: "Аналитика и отчёты",
    body: "Ежемесячный отчёт о платежах и состоянии объекта.",
  },
  {
    icon: Users,
    title: "Поток заявок",
    body: "Целевые арендаторы из каталога и партнёрских каналов.",
  },
  {
    icon: TrendingUp,
    title: "Доход без простоев",
    body: "Средний срок сдачи — 14 дней. Контролируем заполняемость.",
  },
];

const stats = [
  { value: "320+", label: "объектов под управлением" },
  { value: "14 дн.", label: "средний срок сдачи" },
  { value: "0 ₽", label: "размещение в каталоге" },
];

function parseMode(search: string): ListPropertyMode | null {
  const m = new URLSearchParams(search).get("mode");
  if (m === "rent" || m === "management") return m;
  return null;
}

export default function ListPropertyBlock({
  variant = "section",
  segment = "commercial",
}: Props) {
  const { ref, isVisible } = useScrollReveal();
  const { search } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const mode = parseMode(search);

  const isResidential = segment === "residential";
  const basePath = listPropertyPath(segment);

  const setMode = (next: ListPropertyMode | null) => {
    if (!next) {
      navigate(basePath, { replace: true });
      return;
    }
    navigate(`${basePath}?mode=${next}`, { replace: true });
  };

  const freeSteps = isResidential ? freeStepsResidential : freeStepsCommercial;
  const freePerks = isResidential ? freePerksResidential : freePerksCommercial;

  return (
    <div
      ref={ref}
      className={`${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
    >
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="bg-muted/60 border-b border-border py-12 lg:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl">
            {mode && (
              <button
                type="button"
                onClick={() => setMode(null)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-4 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Выбрать другой способ
              </button>
            )}
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-3">
              {isResidential ? "Жильё на АрендаСити" : "Сдайте на АрендаСити"}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-foreground mb-4">
              {!mode &&
                (isResidential
                  ? "Как разместить жильё?"
                  : "Как разместить объект?")}
              {mode === "rent" &&
                (isResidential
                  ? "Сдайте жильё бесплатно"
                  : "Сдайте объект бесплатно")}
              {mode === "management" && "Передайте в управление"}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-xl">
              {!mode &&
                (isResidential
                  ? "Выберите: опубликовать самостоятельно в каталоге за 0 ₽ или передать АрендаСити полное сопровождение."
                  : "Выберите: опубликовать самостоятельно в каталоге за 0 ₽ или передать АрендаСити поиск арендаторов и документы.")}
              {mode === "rent" &&
                (isResidential
                  ? "Сами заполняете карточку в кабинете — после модерации жильё появляется в каталоге и получает отклики."
                  : "Сами заполняете карточку в кабинете — после модерации объект появляется в каталоге и получает заявки.")}
              {mode === "management" &&
                "Мы берём объект на полное сопровождение: фото, показы, договор и контроль платежей."}
            </p>

            {!mode && (
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                <PathCard
                  icon={Megaphone}
                  title="Сдать бесплатно"
                  badge="0 ₽"
                  body={
                    isResidential
                      ? "Сами публикуете квартиру, дом или комнату в каталоге. Заявки — в личный кабинет."
                      : "Сами публикуете объект в каталоге. Заявки от арендаторов — в личный кабинет."
                  }
                  cta="Выбрать бесплатное размещение"
                  onClick={() => setMode("rent")}
                  primary
                />
                <PathCard
                  icon={Settings2}
                  title="Передать в управление"
                  badge="Под ключ"
                  body="Менеджер ведёт показы, документы и поиск. Вам — только решения по кандидатам."
                  cta="Выбрать управление"
                  onClick={() => setMode("management")}
                />
              </div>
            )}

            <div className="flex flex-wrap gap-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-2xl font-bold text-foreground">
                    {s.value}
                  </div>
                  <div className="text-muted-foreground text-xs mt-0.5">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {mode === "rent" && (
        <FreeListingContent
          segment={segment}
          isResidential={isResidential}
          steps={freeSteps}
          perks={freePerks}
          user={!!user}
        />
      )}

      {mode === "management" && (
        <ManagementContent
          segment={segment}
          isResidential={isResidential}
          user={!!user}
        />
      )}

      {!mode && variant === "section" && (
        <div className="container mx-auto px-4 lg:px-8 py-10">
          <p className="text-sm text-muted-foreground text-center">
            Выберите способ размещения выше — дальше покажем шаги и кнопку
            действия.
          </p>
        </div>
      )}
    </div>
  );
}

function PathCard({
  icon: Icon,
  title,
  badge,
  body,
  cta,
  onClick,
  primary,
}: {
  icon: React.ElementType;
  title: string;
  badge: string;
  body: string;
  cta: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-5 sm:p-6 rounded-lg border transition-all hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/30 ${
        primary
          ? "bg-foreground text-background border-foreground"
          : "bg-card text-foreground border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-md flex items-center justify-center ${primary ? "bg-background/15" : "bg-muted"}`}
        >
          <Icon
            className={`w-5 h-5 ${primary ? "text-background" : "text-foreground"}`}
            strokeWidth={1.75}
          />
        </div>
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm ${
            primary
              ? "bg-background/15 text-background"
              : "bg-muted text-foreground"
          }`}
        >
          {badge}
        </span>
      </div>
      <h2
        className={`font-display text-xl font-bold mb-2 ${primary ? "text-background" : "text-foreground"}`}
      >
        {title}
      </h2>
      <p
        className={`text-sm leading-relaxed mb-5 ${primary ? "text-background/75" : "text-muted-foreground"}`}
      >
        {body}
      </p>
      <span
        className={`inline-flex items-center gap-1.5 text-sm font-semibold ${primary ? "text-background" : "text-foreground"}`}
      >
        {cta}
        <ArrowRight className="w-4 h-4" />
      </span>
    </button>
  );
}

function FreeListingContent({
  segment,
  isResidential,
  steps,
  perks,
  user,
}: {
  segment: PropertySegment;
  isResidential: boolean;
  steps: { title: string; body: string }[];
  perks: string[];
  user: boolean;
}) {
  const ctaTo = placementCtaPath(segment, "rent", user);
  const loginTo = loginToAddPropertyPath(segment, "free_listing");

  return (
    <section className="py-12 lg:py-16 bg-background" id="list-property">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                {isResidential
                  ? "Бесплатное размещение жилья"
                  : "Бесплатное размещение в каталоге"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Три шага — от регистрации до публикации. Без звонков менеджеру,
                если справляетесь сами.
              </p>
            </div>

            <ul className="space-y-3">
              {perks.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-foreground"
                >
                  <CheckCircle2 className="w-4 h-4 text-foreground shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <PrimaryCta
              to={ctaTo}
              loggedIn={user}
              mode="rent"
              className="w-full sm:w-auto"
            />
            {!user && (
              <p className="text-xs text-muted-foreground">
                Уже есть аккаунт?{" "}
                <Link to={loginTo} className="text-foreground hover:underline">
                  Войти
                </Link>
              </p>
            )}
          </div>

          <div className="bg-card border border-border p-6 sm:p-7">
            <h3 className="font-display text-lg font-bold text-foreground mb-1">
              Как это работает
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Быстрый старт для собственника
            </p>
            <ol className="space-y-5">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="shrink-0 w-7 h-7 bg-muted text-foreground flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-foreground">
                      {s.title}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                      {s.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function ManagementContent({
  segment,
  isResidential,
  user,
}: {
  segment: PropertySegment;
  isResidential: boolean;
  user: boolean;
}) {
  const ctaTo = placementCtaPath(segment, "management", user);
  const loginTo = loginToAddPropertyPath(segment, "management");

  return (
    <>
      <section className="py-12 lg:py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Что вы получите
          </h2>
          <p className="text-sm text-muted-foreground mb-10">
            Полное операционное управление — от поиска до контроля платежей
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {managementPerks.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="bg-card border border-border p-6 flex flex-col gap-3"
              >
                <div className="w-10 h-10 bg-muted flex items-center justify-center">
                  <Icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">
                  {title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-card border-y border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Пройдём с вами весь путь
          </h2>
          <p className="text-sm text-muted-foreground mb-12">
            Прозрачный процесс от заявки до подписания договора
          </p>
          <div className="space-y-0">
            {managementSteps.map((step, i) => (
              <div
                key={step.n}
                className={`grid lg:grid-cols-2 gap-0 border border-border ${i > 0 ? "border-t-0" : ""}`}
              >
                <div
                  className={`p-8 lg:p-10 flex gap-6 items-start ${i % 2 === 1 ? "lg:order-2" : ""}`}
                >
                  <div className="shrink-0 w-10 h-10 rounded-md bg-foreground flex items-center justify-center">
                    <span className="text-background font-bold text-sm">
                      {step.n}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </div>
                <div
                  className={`hidden lg:flex bg-muted items-center justify-center min-h-[200px] border-l border-border ${i % 2 === 1 ? "lg:order-1 border-l-0 border-r border-border" : ""}`}
                >
                  <StepVisual n={step.n} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-background" id="list-property">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  Заявка на управление
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isResidential
                    ? "Зарегистрируйтесь и оставьте заявку на управление жильём — менеджер свяжется и предложит план сдачи."
                    : "Зарегистрируйтесь и оставьте заявку на управление объектом — менеджер свяжется и предложит план сдачи."}
                </p>
              </div>

              <div className="flex items-center gap-4 p-5 border border-border bg-card">
                <div className="relative shrink-0">
                  <img
                    src={consultantAvatar}
                    alt="Анастасия Романова"
                    className="w-16 h-16 object-cover ring-2 ring-primary/20"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 ring-2 ring-card" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">
                      Анастасия Романова
                    </span>
                    <BadgeCheck className="w-4 h-4 text-foreground shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Менеджер по аренде
                  </p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-foreground">4.9</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="w-3.5 h-3.5" /> ~12 мин ответ
                    </span>
                  </div>
                </div>
              </div>

              <a
                href={`tel:${CONTACTS.phoneTel}`}
                className="inline-flex items-center gap-2 px-5 py-3 border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                <PhoneIcon className="w-4 h-4" />
                {CONTACTS.phone}
              </a>
            </div>

            <div className="bg-card border border-border p-6 sm:p-7">
              <h3 className="font-display text-lg font-bold text-foreground mb-1">
                Начать с заявки
              </h3>
              <p className="text-xs text-muted-foreground mb-6">
                После регистрации откроется форма объекта с типом «Передать в
                управление»
              </p>
              <PrimaryCta
                to={ctaTo}
                loggedIn={user}
                mode="management"
                className="w-full"
              />
              {!user && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Уже есть аккаунт?{" "}
                  <Link to={loginTo} className="text-foreground hover:underline">
                    Войти
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function PrimaryCta({
  to,
  loggedIn,
  mode,
  className = "",
}: {
  to: string;
  loggedIn: boolean;
  mode: ListPropertyMode;
  className?: string;
}) {
  const label = loggedIn
    ? mode === "rent"
      ? "Добавить объект"
      : "Оставить заявку на управление"
    : mode === "rent"
      ? "Зарегистрироваться и добавить объект"
      : "Зарегистрироваться и оставить заявку";

  return (
    <Link
      to={to}
      className={`h-7 px-[11px] rounded inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity ${className}`}
    >
      {loggedIn ? (
        <Building2 className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      {label}
    </Link>
  );
}

function StepVisual({ n }: { n: string }) {
  const visuals: Record<string, React.ReactNode> = {
    "1": (
      <div className="p-6 w-full max-w-[260px]">
        <div className="bg-card border border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <img
              src={consultantAvatar}
              alt=""
              className="w-10 h-10 object-cover"
            />
            <div>
              <div className="h-2.5 w-24 bg-muted" />
              <div className="h-2 w-16 bg-muted mt-1.5" />
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              "Объекты на Карла Маркса",
              "Склад в Ангарске",
              "ТЦ Иркутск-1",
            ].map((t) => (
              <div key={t} className="flex items-center gap-2 py-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={1.75} />
                <span className="text-xs text-foreground">{t}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    "2": (
      <div className="p-6 w-full max-w-[260px] space-y-3">
        <div className="bg-card border border-border p-3 flex gap-3 items-center">
          <Camera className="w-8 h-8 text-foreground" strokeWidth={1.5} />
          <div>
            <div className="text-xs font-semibold text-foreground">
              Фотосъёмка
            </div>
            <div className="text-[11px] text-muted-foreground">
              Профессиональный фотограф
            </div>
          </div>
        </div>
        <div className="bg-card border border-border p-3 flex gap-3 items-center">
          <TrendingUp className="w-8 h-8 text-foreground" strokeWidth={1.5} />
          <div>
            <div className="text-xs font-semibold text-foreground">
              Оценка рынка
            </div>
            <div className="text-[11px] text-muted-foreground">
              44 500 ₽ / мес
            </div>
          </div>
        </div>
        <div className="bg-card border border-border p-3 flex gap-3 items-center">
          <FileText className="w-8 h-8 text-foreground" strokeWidth={1.5} />
          <div>
            <div className="text-xs font-semibold text-foreground">
              Описание
            </div>
            <div className="text-[11px] text-muted-foreground">
              Готово к публикации
            </div>
          </div>
        </div>
      </div>
    ),
    "3": (
      <div className="p-6 w-full max-w-[260px]">
        <div className="bg-card border border-border p-4 space-y-2">
          <div className="text-[11px] font-semibold text-foreground mb-3">
            Охват объявления
          </div>
          {[
            { label: "Каталог АрендаСити", w: "w-full", v: "1 840" },
            { label: "SEO-страницы", w: "w-4/5", v: "920" },
            { label: "Партнёрские сайты", w: "w-3/5", v: "430" },
          ].map((r) => (
            <div key={r.label}>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{r.label}</span>
                <span>{r.v}</span>
              </div>
              <div className="h-1.5 bg-muted">
                <div className={`h-full bg-foreground ${r.w}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    "4": (
      <div className="p-6 w-full max-w-[260px] space-y-2">
        {[
          {
            from: "Менеджер",
            text: "Показ завтра в 11:00 — подходит?",
            mine: false,
          },
          { from: "Арендатор", text: "Да, подтверждаю", mine: true },
          {
            from: "Менеджер",
            text: "Отлично! Договор готов к подписанию",
            mine: false,
          },
        ].map((m, i) => (
          <div key={i} className={`flex ${m.mine ? "justify-end" : ""}`}>
            <div
              className={`max-w-[80%] px-3 py-2 text-[11px] leading-snug ${
                m.mine
                  ? "bg-foreground text-background"
                  : "bg-card border border-border text-foreground"
              }`}
            >
              {!m.mine && (
                <div className="text-[9px] text-muted-foreground mb-0.5">
                  {m.from}
                </div>
              )}
              {m.text}
            </div>
          </div>
        ))}
      </div>
    ),
  };

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[220px]">
      {visuals[n] ?? null}
    </div>
  );
}
