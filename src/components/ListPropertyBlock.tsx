import {
  Building2,
  CheckCircle2,
  Megaphone,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { PropertySegment } from "@/config/propertySegments";
import { useAuth } from "@/hooks/useAuth";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  listPropertyAiPath,
  loginToAddPropertyPath,
  loginToSmartListingPath,
  placementCtaPath,
} from "@/lib/listPropertyLinks";

interface Props {
  variant?: "page" | "section";
  segment?: PropertySegment;
}

const freeStepsCommercial = [
  { title: "Зарегистрируйтесь", body: "Имя, телефон и email — меньше минуты." },
  {
    title: "Расскажите об объекте ИИ или заполните сами",
    body: "Диалог заполнит карточку за вас — или откройте форму в кабинете.",
  },
  {
    title: "Дождитесь проверки",
    body: "После модерации объявление появится в каталоге и начнёт получать заявки.",
  },
];

const freeStepsResidential = [
  { title: "Зарегистрируйтесь", body: "Имя, телефон и email — меньше минуты." },
  {
    title: "Расскажите о жилье ИИ или заполните сами",
    body: "Умный чат соберёт черновик — или заполните карточку вручную.",
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

const stats = [
  { value: "0 ₽", label: "размещение в каталоге" },
  { value: "24/7", label: "карточка в поиске" },
  { value: "1 день", label: "средняя модерация" },
];

export default function ListPropertyBlock({
  variant = "section",
  segment = "commercial",
}: Props) {
  const { ref, isVisible } = useScrollReveal();
  const { user } = useAuth();

  const isResidential = segment === "residential";
  const freeSteps = isResidential ? freeStepsResidential : freeStepsCommercial;
  const freePerks = isResidential ? freePerksResidential : freePerksCommercial;
  const ctaTo = placementCtaPath(segment, "rent", !!user);
  const loginTo = loginToAddPropertyPath(segment, "free_listing");
  const aiTo = user
    ? listPropertyAiPath(segment)
    : loginToSmartListingPath(segment);

  return (
    <div
      ref={ref}
      className={`${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
    >
      <section
        className={`border-b border-border ${variant === "page" ? "bg-muted/60 py-12 lg:py-16" : "bg-background py-10 lg:py-14"}`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-3 inline-flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5" />
              {isResidential ? "Жильё на ДАДАТУТ" : "Сдайте на ДАДАТУТ"}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-foreground mb-4">
              {isResidential
                ? "Сдайте жильё бесплатно"
                : "Сдайте объект бесплатно"}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-xl">
              {isResidential
                ? "Сами заполняете карточку в кабинете — после модерации жильё появляется в каталоге и получает отклики."
                : "Сами заполняете карточку в кабинете — после модерации объект появляется в каталоге и получает заявки."}
            </p>

            <div className="flex flex-wrap gap-8 mb-10">
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
                  Три шага — от регистрации до публикации.
                </p>
              </div>

              <ul className="space-y-3">
                {freePerks.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-3 text-sm text-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4 text-foreground shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to={aiTo}
                  className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-[#ff5c85] hover:bg-[#ff4574] text-white text-sm font-semibold transition-colors"
                >
                  Создать с ИИ
                </Link>
                <Link
                  to={ctaTo}
                  className="h-11 px-5 rounded inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  {user ? (
                    <Building2 className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {user
                    ? "Добавить объект"
                    : "Зарегистрироваться и добавить объект"}
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                Или заполните карточку вручную в кабинете.
                {!user && (
                  <>
                    {" "}
                    Уже есть аккаунт?{" "}
                    <Link
                      to={loginTo}
                      className="text-foreground hover:underline"
                    >
                      Войти
                    </Link>
                  </>
                )}
              </p>
            </div>

            <div className="bg-card border border-border p-6 sm:p-7 rounded-lg">
              <h3 className="font-display text-lg font-bold text-foreground mb-1">
                Как это работает
              </h3>
              <p className="text-xs text-muted-foreground mb-6">
                Быстрый старт для собственника
              </p>
              <ol className="space-y-5">
                {freeSteps.map((s, i) => (
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
    </div>
  );
}
