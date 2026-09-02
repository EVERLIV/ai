import {
  AlertTriangle,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronRight,
  Home,
  Landmark,
  Search,
  Send,
  User,
  Users,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COMPANY, CONTACTS } from "@/config/company";
import { absoluteUrl } from "@/config/site";
import { submitLead } from "@/lib/submitLead";
import { BotGuardError, useFormBotGuard } from "@/hooks/useFormBotGuard";
import { cn } from "@/lib/utils";

type TocItem = {
  id: string;
  label: string;
  children?: { id: string; label: string }[];
};

const TOC: TocItem[] = [
  { id: "about", label: "О проекте" },
  {
    id: "sections",
    label: "Разделы портала",
    children: [
      { id: "sec-commercial", label: "Коммерческая" },
      { id: "sec-residential", label: "Жилая" },
      { id: "sec-land", label: "Земля" },
      { id: "sec-specialists", label: "Специалисты" },
    ],
  },
  {
    id: "catalog",
    label: "Каталог и поиск",
    children: [
      { id: "cat-filters", label: "Фильтры" },
      { id: "cat-views", label: "Виды выдачи" },
      { id: "cat-alerts", label: "Подписка на поиск" },
    ],
  },
  { id: "property", label: "Карточка объекта" },
  {
    id: "roles",
    label: "Роли пользователей",
    children: [
      { id: "role-seeker", label: "Ищу недвижимость" },
      { id: "role-owner", label: "Собственник" },
      { id: "role-realtor", label: "Риелтор" },
      { id: "role-agency", label: "Агентство" },
      { id: "role-developer", label: "Застройщик" },
    ],
  },
  { id: "list", label: "Как разместить объект" },
  { id: "edit", label: "Как изменить и управлять" },
  { id: "account", label: "Личный кабинет" },
  { id: "tools", label: "Сервисы портала" },
  { id: "faq", label: "Частые вопросы" },
  { id: "support", label: "Поддержка и баги" },
];

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <div className="text-sm text-foreground/90 leading-relaxed pt-0.5">
        {children}
      </div>
    </li>
  );
}

function Callout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <aside className="rounded-lg border border-border bg-muted/40 px-4 py-3 my-4">
      <p className="text-xs font-semibold text-foreground mb-1">{title}</p>
      <div className="text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </aside>
  );
}

function DocLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="text-primary font-medium underline-offset-2 hover:underline"
    >
      {children}
    </Link>
  );
}

function BugReportForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    page: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { BotGuard, ensureGuard, resetGuard } = useFormBotGuard();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const bot = await ensureGuard();
      const pageHint = form.page.trim()
        ? `\nСтраница: ${form.page.trim()}`
        : typeof window !== "undefined"
          ? `\nСтраница: ${window.location.href}`
          : "";
      await submitLead({
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        source: "docs_bug_report",
        business_category: "Баг / проблема на сайте",
        message: `[Нашёл баг] ${form.message.trim()}${pageHint}`,
        website: bot.website,
        captchaToken: bot.captchaToken,
      });
      resetGuard();
      setSent(true);
      setForm({ name: "", phone: "", email: "", page: "", message: "" });
    } catch (err) {
      if (err instanceof BotGuardError && err.message === "bot") return;
      setError(
        err instanceof BotGuardError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Не удалось отправить",
      );
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
        <h3 className="font-semibold text-foreground">Спасибо, заявка принята</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Мы разберём описание бага и свяжемся при необходимости. Срочные
          вопросы —{" "}
          <a
            href={`mailto:${CONTACTS.email}`}
            className="text-primary font-medium hover:underline"
          >
            {CONTACTS.email}
          </a>
          .
        </p>
        <Button variant="outline" size="sm" onClick={() => setSent(false)}>
          Отправить ещё одно сообщение
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl border border-border bg-card p-5 sm:p-6 space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Я нашёл баг</h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Опишите, что сломалось, на какой странице и что ожидали увидеть.
            Если вы вошли в аккаунт — удобнее через{" "}
            <DocLink to="/account#support">личный кабинет → Поддержка</DocLink>.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="bug-name">Имя *</Label>
          <Input
            id="bug-name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Как к вам обращаться"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bug-phone">Телефон *</Label>
          <Input
            id="bug-phone"
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+7 …"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="bug-email">Email</Label>
          <Input
            id="bug-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bug-page">Страница / URL</Label>
          <Input
            id="bug-page"
            value={form.page}
            onChange={(e) => setForm((f) => ({ ...f, page: e.target.value }))}
            placeholder="/catalog или полный адрес"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bug-msg">Что произошло *</Label>
        <Textarea
          id="bug-msg"
          required
          rows={5}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="Шаги: 1) открыл… 2) нажал… 3) увидел ошибку… Устройство / браузер — если важно."
          className="resize-y min-h-[120px]"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <BotGuard />

      <Button type="submit" disabled={loading} className="gap-2">
        <Send className="w-4 h-4" />
        {loading ? "Отправка…" : "Отправить отчёт о баге"}
      </Button>
    </form>
  );
}

export default function DocsHandbookPage() {
  const [activeId, setActiveId] = useState("about");

  const flatIds = useMemo(
    () =>
      TOC.flatMap((t) => [t.id, ...(t.children?.map((c) => c.id) || [])]),
    [],
  );

  useEffect(() => {
    const nodes = flatIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [flatIds]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title={`Документация и справочник — ${COMPANY.brand}`}
        description={`Подробная инструкция по порталу ${COMPANY.brand}: каталог, роли пользователей, размещение объектов, кабинет и поддержка.`}
        url={absoluteUrl("/docs")}
      />
      <SiteHeader />

      <div className="flex-1 mt-[56px] lg:mt-[104px]">
        {/* Hero */}
        <div className="border-b border-border bg-gradient-to-b from-muted/50 to-background">
          <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12 max-w-6xl">
            <nav className="text-[11px] text-muted-foreground mb-4 flex items-center gap-1.5 flex-wrap">
              <Link to="/" className="hover:text-foreground">
                Главная
              </Link>
              <ChevronRight className="w-3 h-3 opacity-50" />
              <Link to="/help" className="hover:text-foreground">
                Справочный центр
              </Link>
              <ChevronRight className="w-3 h-3 opacity-50" />
              <span className="text-foreground">Документация</span>
            </nav>
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex w-12 h-12 rounded-xl bg-primary/10 text-primary items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                  Справочник портала {COMPANY.brand}
                </h1>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                  Полное описание разделов, ролей и сценариев: как искать,
                  размещать и редактировать объекты, пользоваться кабинетом и
                  сообщить о проблеме.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-10 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* TOC */}
            <aside className="lg:w-56 xl:w-64 shrink-0">
              <div className="lg:sticky lg:top-28">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Содержание
                </p>
                <nav
                  aria-label="Оглавление"
                  className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-1 px-1 scrollbar-none"
                >
                  {TOC.map((item) => (
                    <div key={item.id} className="shrink-0 lg:shrink">
                      <a
                        href={`#${item.id}`}
                        className={cn(
                          "block text-sm px-2.5 py-1.5 rounded-md whitespace-nowrap lg:whitespace-normal transition-colors",
                          activeId === item.id ||
                            item.children?.some((c) => c.id === activeId)
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                        )}
                      >
                        {item.label}
                      </a>
                      {item.children && (
                        <div className="hidden lg:block ml-2 border-l border-border/80 pl-2 mt-0.5 space-y-0.5">
                          {item.children.map((c) => (
                            <a
                              key={c.id}
                              href={`#${c.id}`}
                              className={cn(
                                "block text-xs px-2 py-1 rounded-md transition-colors",
                                activeId === c.id
                                  ? "text-primary font-medium"
                                  : "text-muted-foreground hover:text-foreground",
                              )}
                            >
                              {c.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Content */}
            <article className="flex-1 min-w-0 prose-docs space-y-12">
              <section id="about" className="scroll-mt-28">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">
                  О проекте
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  <strong className="text-foreground">{COMPANY.brand}</strong> —
                  портал аренды и продажи недвижимости Иркутска и области:
                  коммерческие помещения, жильё и земельные участки. Объявления
                  публикуют собственники, агентства, риелторы и застройщики;
                  ищущие сохраняют избранное, сравнивают объекты и оставляют
                  заявки.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Сайт объединяет три сегмента под одним брендом: коммерция на
                  главной, жилая на <DocLink to="/zhilaya">/zhilaya</DocLink>,
                  земля на <DocLink to="/zemlya">/zemlya</DocLink>. Шапка и
                  размещение подстраиваются под сегмент, но аккаунт один —
                  вход через <DocLink to="/auth">/auth</DocLink>.
                </p>
                <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                  {[
                    {
                      icon: Search,
                      t: "Каталог с фильтрами и картой",
                      d: "Тип, сделка, район, цена, площадь",
                    },
                    {
                      icon: Home,
                      t: "Три сегмента",
                      d: "Коммерция, жилая, земля",
                    },
                    {
                      icon: Users,
                      t: "Каталог специалистов",
                      d: "Риелторы, агентства, застройщики",
                    },
                    {
                      icon: Landmark,
                      t: "Кабинет и модерация",
                      d: "Заявки, объекты, статус публикации",
                    },
                  ].map((x) => (
                    <li
                      key={x.t}
                      className="flex gap-3 rounded-lg border border-border/70 bg-card p-3"
                    >
                      <x.icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>
                        <span className="font-medium text-foreground block">
                          {x.t}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {x.d}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <Callout title="Юридические документы">
                  Политика конфиденциальности —{" "}
                  <DocLink to="/privacy">/privacy</DocLink>, правила —{" "}
                  <DocLink to="/terms">/terms</DocLink>, о компании —{" "}
                  <DocLink to="/about">/about</DocLink>. Краткие FAQ и ссылки —
                  в <DocLink to="/help">справочном центре</DocLink>.
                </Callout>
              </section>

              <section id="sections" className="scroll-mt-28">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">
                  Разделы портала
                </h2>

                <div id="sec-commercial" className="scroll-mt-28 mb-8">
                  <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Коммерческая недвижимость
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                    Главная <DocLink to="/">/</DocLink> и каталог{" "}
                    <DocLink to="/catalog">/catalog</DocLink>. Типы: офис,
                    торговая, склад, производство, павильон, ПСН, общепит,
                    автосервис и др. Быстрые страницы:{" "}
                    <DocLink to="/offices">офисы</DocLink>,{" "}
                    <DocLink to="/retail">торговля</DocLink>,{" "}
                    <DocLink to="/warehouses">склады</DocLink>.
                  </p>
                </div>

                <div id="sec-residential" className="scroll-mt-28 mb-8">
                  <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Home className="w-4 h-4 text-primary" />
                    Жилая недвижимость
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                    Раздел <DocLink to="/zhilaya">/zhilaya</DocLink>, каталог{" "}
                    <DocLink to="/zhilaya/catalog">/zhilaya/catalog</DocLink>.
                    Квартиры, дома, комнаты, таунхаусы, апартаменты, «дом на
                    заказ». Рынок: вторичка, новостройка, на заказ. Сделки:
                    аренда, продажа, посуточно.
                  </p>
                </div>

                <div id="sec-land" className="scroll-mt-28 mb-8">
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    Земля
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    <DocLink to="/zemlya">/zemlya</DocLink> и{" "}
                    <DocLink to="/zemlya/catalog">каталог участков</DocLink> —
                    аренда и продажа земли.
                  </p>
                </div>

                <div id="sec-specialists" className="scroll-mt-28">
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    Специалисты и застройщики
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                    <li>
                      <DocLink to="/rieltory">Риелторы</DocLink> и вкладка
                      агентств
                    </li>
                    <li>
                      <DocLink to="/zastroyshchiki">Застройщики</DocLink> —
                      витрина компаний и проектов
                    </li>
                    <li>
                      <DocLink to="/zastroyshchikam">Застройщикам</DocLink> —
                      лендинг для подключения
                    </li>
                  </ul>
                </div>
              </section>

              <section id="catalog" className="scroll-mt-28">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">
                  Каталог и поиск
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Каталог — основной способ найти объект. Коммерция:{" "}
                  <DocLink to="/catalog">/catalog</DocLink>, жилая:{" "}
                  <DocLink to="/zhilaya/catalog">/zhilaya/catalog</DocLink>,
                  земля: <DocLink to="/zemlya/catalog">/zemlya/catalog</DocLink>.
                  На мобильных удобна нижняя навигация и полноэкранные фильтры.
                </p>
                <div id="cat-filters" className="scroll-mt-28 mb-6">
                  <h3 className="text-base font-semibold mb-2">Фильтры</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                    В шапке каталога: тип сделки (аренда / продажа / посуточно
                    — где доступно), типы объектов, район и локация, цена и
                    площадь, дополнительные параметры (комнаты, рынок жилья,
                    класс и др. — зависят от сегмента). Параметры сохраняются в
                    URL — ссылкой можно поделиться с коллегой или сохранить в
                    закладки.
                  </p>
                  <Callout title="Совет">
                    Сначала сузьте тип и район, затем цену и площадь — так
                    выдана стабильнее, а подписка на поиск точнее попадёт в
                    нужные объекты.
                  </Callout>
                </div>
                <div id="cat-views" className="scroll-mt-28 mb-6">
                  <h3 className="text-base font-semibold mb-2">Виды выдачи</h3>
                  <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5 mb-2">
                    <li>
                      <strong className="text-foreground">Сетка</strong> —
                      карточки с фото и ключевыми параметрами.
                    </li>
                    <li>
                      <strong className="text-foreground">Список</strong> —
                      больше текста и характеристик в ряд.
                    </li>
                    <li>
                      <strong className="text-foreground">Карта</strong> —
                      маркеры по координатам; клик подсвечивает карточку.
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Сортировка — по дате публикации, цене, площади. Пустые
                    результаты: сбросьте часть фильтров или расширьте район.
                  </p>
                </div>
                <div id="cat-alerts" className="scroll-mt-28">
                  <h3 className="text-base font-semibold mb-2">
                    Подписка «Уведомить о новых»
                  </h3>
                  <ol className="space-y-2">
                    <Step n={1}>
                      Войдите в аккаунт (гостю покажется кнопка «Войти»).
                    </Step>
                    <Step n={2}>
                      Настройте фильтры каталога, нажмите «Уведомить о новых».
                    </Step>
                    <Step n={3}>
                      Отметьте типы объектов, согласие с политикой —
                      сохраните. Email берётся из профиля — проверьте его во
                      вкладке «Профиль».
                    </Step>
                    <Step n={4}>
                      При публикации подходящего объекта (после модерации)
                      придёт письмо на этот email.
                    </Step>
                  </ol>
                </div>
              </section>

              <section id="property" className="scroll-mt-28">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">
                  Карточка объекта
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Адрес вида{" "}
                  <code className="text-xs bg-muted px-1 rounded">
                    /property/…
                  </code>
                  . На странице: галерея (фото, план, видео), цена и условия,
                  описание, характеристики, карта, блок агента / собственника /
                  застройщика. На телефоне карточки контактов и связанные блоки
                  идут под ценой; на десктопе — в боковой колонке.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Для объектов застройщика внизу — карточка проекта и другие
                  квартиры или дома этой серии (если задан проект).
                </p>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                  <li>Позвонить / написать / предложить цену</li>
                  <li>В избранное и сравнение</li>
                  <li>Поделиться и печать объявления</li>
                  <li>Сообщить о проблеме с объявлением</li>
                </ul>
              </section>

              <section id="roles" className="scroll-mt-28">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-4">
                  Роли пользователей
                </h2>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Тип аккаунта выбирается при{" "}
                  <DocLink to="/auth?tab=register">регистрации</DocLink> и влияет
                  на кабинет и права на размещение.
                </p>

                <div
                  id="role-seeker"
                  className="scroll-mt-28 mb-8 rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">Ищу недвижимость (seeker)</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Основной сценарий — поиск и заявки, без публикации своих
                    объектов.
                  </p>
                  <ol className="space-y-2">
                    <Step n={1}>
                      Регистрация с типом «Хочу найти» → подтверждение email при
                      необходимости.
                    </Step>
                    <Step n={2}>
                      Каталог → фильтры → карточка → избранное / сравнение /
                      заявка.
                    </Step>
                    <Step n={3}>
                      Подписка на поиск из каталога — письмо о новых подходящих
                      объектах.
                    </Step>
                    <Step n={4}>
                      Кабинет <DocLink to="/account">/account</DocLink>: профиль,
                      избранное, сообщения и заявки.
                    </Step>
                  </ol>
                </div>

                <div
                  id="role-owner"
                  className="scroll-mt-28 mb-8 rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Home className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">Собственник</h3>
                  </div>
                  <ol className="space-y-2">
                    <Step n={1}>
                      Регистрация «Хочу сдать» или смена типа в профиле.
                    </Step>
                    <Step n={2}>
                      <DocLink to="/list-property">Разместить объект</DocLink> →
                      бесплатно в каталог или передать в управление.
                    </Step>
                    <Step n={3}>
                      Заполнить визард: адрес, тип, фото, цена, описание →
                      отправка на модерацию.
                    </Step>
                    <Step n={4}>
                      После одобрения объект в каталоге; правки — в кабинете →
                      «Мои объекты».
                    </Step>
                  </ol>
                </div>

                <div
                  id="role-realtor"
                  className="scroll-mt-28 mb-8 rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">Риелтор</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Публикует объекты от своего имени или в составе агентства
                    (приглашение). Публичный профиль в каталоге риелторов.
                  </p>
                  <ol className="space-y-2">
                    <Step n={1}>Регистрация с типом «Риелтор».</Step>
                    <Step n={2}>
                      Заполнить профиль (фото, контакты) → при необходимости
                      запросить верификацию.
                    </Step>
                    <Step n={3}>
                      Размещать объекты через кабинет / list-property; следить за
                      статусом модерации.
                    </Step>
                  </ol>
                </div>

                <div
                  id="role-agency"
                  className="scroll-mt-28 mb-8 rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">Агентство</h3>
                  </div>
                  <ol className="space-y-2">
                    <Step n={1}>
                      Регистрация «Агентство» → карточка компании (логотип,
                      описание, менеджеры).
                    </Step>
                    <Step n={2}>
                      Приглашать сотрудников, назначать менеджера на объект.
                    </Step>
                    <Step n={3}>
                      Публиковать объявления; лиды и отзывы — во вкладках
                      кабинета.
                    </Step>
                    <Step n={4}>
                      Опционально подключить Telegram-уведомления агентства.
                    </Step>
                  </ol>
                </div>

                <div
                  id="role-developer"
                  className="scroll-mt-28 rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Landmark className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">Застройщик</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Два подтипа: многоквартирные ЖК или деревянные / каркасные
                    дома («на заказ»). См. также{" "}
                    <DocLink to="/zastroyshchikam">лендинг для застройщиков</DocLink>
                    .
                  </p>
                  <ol className="space-y-2">
                    <Step n={1}>
                      Регистрация «Застройщик» → название компании и тип.
                    </Step>
                    <Step n={2}>
                      В кабинете создать проект (ЖК или серию домов), планировки
                      / юниты.
                    </Step>
                    <Step n={3}>
                      Добавить объекты продажи: привязка к проекту и планировке
                      обязательна по правилам подтипа.
                    </Step>
                    <Step n={4}>
                      После модерации проект и объявления видны в каталоге
                      застройщиков и жилом каталоге.
                    </Step>
                  </ol>
                </div>
              </section>

              <section id="list" className="scroll-mt-28">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">
                  Как разместить объект
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Точки входа: кнопка «+ Разместить» в шапке,{" "}
                  <DocLink to="/list-property">/list-property</DocLink>{" "}
                  (коммерция),{" "}
                  <DocLink to="/zhilaya/list-property">
                    /zhilaya/list-property
                  </DocLink>
                  ,{" "}
                  <DocLink to="/zemlya/list-property">
                    /zemlya/list-property
                  </DocLink>
                  .
                </p>
                <ol className="space-y-2 mb-4">
                  <Step n={1}>
                    Откройте нужный путь размещения под ваш сегмент.
                  </Step>
                  <Step n={2}>
                    Выберите <strong>бесплатное размещение</strong> (сами
                    ведёте объявление) или <strong>управление</strong> (
                    {COMPANY.brand} помогает со сдачей).
                  </Step>
                  <Step n={3}>
                    Если не авторизованы — регистрация / вход с возвратом в
                    кабинет или в визард.
                  </Step>
                  <Step n={4}>
                    Визард: сегмент, тип объекта, адрес (карта/подсказки),
                    параметры, фото, цена, описание контактов → отправить.
                  </Step>
                  <Step n={5}>
                    Статус «на проверке» → после одобрения модератором —
                    «опубликован» и виден в каталоге (для free listing).
                  </Step>
                </ol>
                <Callout title="Важно">
                  Объект без модерации в публичный каталог не попадает.
                  Некорректные данные или фото могут отклонить с причиной в
                  кабинете. Для застройщика сначала создайте проект, затем
                  юниты/планировки и только потом объявления продажи.
                </Callout>
              </section>

              <section id="edit" className="scroll-mt-28">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">
                  Как изменить и просматривать свои объекты
                </h2>
                <ol className="space-y-2">
                  <Step n={1}>
                    <DocLink to="/account#properties">
                      Кабинет → Мои объекты
                    </DocLink>
                    .
                  </Step>
                  <Step n={2}>
                    Откройте карточку: статус (черновик, на проверке,
                    опубликован, отклонён / снят).
                  </Step>
                  <Step n={3}>
                    Редактирование — те же поля визарда; после существенных
                    правок может потребоваться повторная модерация.
                  </Step>
                  <Step n={4}>
                    Публичную страницу смотрите по ссылке «Открыть на сайте»
                    или{" "}
                    <code className="text-xs bg-muted px-1 rounded">
                      /property/ID
                    </code>
                    .
                  </Step>
                  <Step n={5}>
                    Заявки по объекту — во вкладке{" "}
                    <DocLink to="/account#requests">заявок</DocLink> кабинета.
                  </Step>
                  <Step n={6}>
                    Статистика просмотров (где доступна) — вкладка статистики.
                  </Step>
                </ol>
              </section>

              <section id="account" className="scroll-mt-28">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">
                  Личный кабинет
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  <DocLink to="/account">/account</DocLink> — единая точка для
                  профиля и работы с объявлениями. Вкладки переключаются и по
                  хешу в адресе, например{" "}
                  <code className="text-xs bg-muted px-1 rounded">
                    /account#properties
                  </code>
                  ,{" "}
                  <code className="text-xs bg-muted px-1 rounded">
                    /account#profile
                  </code>
                  . Набор вкладок зависит от роли:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5 mb-4">
                  <li>
                    <strong className="text-foreground">Профиль</strong> —
                    имя, телефон, email, аватар, тип аккаунта
                  </li>
                  <li>
                    <strong className="text-foreground">Избранное</strong> —
                    сохранённые объекты
                  </li>
                  <li>
                    <strong className="text-foreground">Мои объекты</strong> —
                    для собственников, риелторов, агентств и застройщиков
                  </li>
                  <li>
                    <strong className="text-foreground">Проекты / документы</strong>{" "}
                    — для застройщика (проекты ЖК или серий домов)
                  </li>
                  <li>
                    <strong className="text-foreground">Заявки</strong> —
                    входящие обращения по вашим объектам
                  </li>
                  <li>
                    <strong className="text-foreground">Команда / Telegram</strong>{" "}
                    — настройки агентства
                  </li>
                  <li>
                    <strong className="text-foreground">Статистика и отзывы</strong>{" "}
                    — где доступно по роли
                  </li>
                </ul>
                <Callout title="Вход и регистрация">
                  <DocLink to="/auth">/auth</DocLink> — вкладки входа и
                  регистрации. При регистрации выберите тип: ищу / сдаю /
                  риелтор / агентство / застройщик. После входа можно вернуться
                  на страницу, с которой ушли (redirect). Сброс пароля —{" "}
                  <DocLink to="/reset-password">/reset-password</DocLink>.
                </Callout>
              </section>

              <section id="tools" className="scroll-mt-28">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">
                  Сервисы портала
                </h2>
                <ul className="space-y-3 text-sm">
                  <li className="rounded-lg border border-border p-3 bg-card">
                    <strong className="text-foreground">Сравнение</strong>
                    <span className="text-muted-foreground">
                      {" "}
                      — добавьте объекты с карточки или каталога, откройте{" "}
                      <DocLink to="/compare">/compare</DocLink>. Параметры
                      выводятся рядом: цена, площадь, адрес, тип сделки.
                    </span>
                  </li>
                  <li className="rounded-lg border border-border p-3 bg-card">
                    <strong className="text-foreground">Избранное</strong>
                    <span className="text-muted-foreground">
                      {" "}
                      — иконка «сердце» на карточке; список в кабинете. Без
                      входа избранное может сохраняться локально и
                      синхронизироваться после авторизации.
                    </span>
                  </li>
                  <li className="rounded-lg border border-border p-3 bg-card">
                    <strong className="text-foreground">Умный подбор</strong>
                    <span className="text-muted-foreground">
                      {" "}
                      — мастер в меню / на главной подбирает объекты по
                      пожеланиям. Правила показа описаны на{" "}
                      <DocLink to="/recommendations">
                        странице рекомендаций
                      </DocLink>
                      .
                    </span>
                  </li>
                  <li className="rounded-lg border border-border p-3 bg-card">
                    <strong className="text-foreground">Новости</strong>
                    <span className="text-muted-foreground">
                      {" "}
                      — <DocLink to="/news">/news</DocLink>, статьи о рынке и
                      сервисе.
                    </span>
                  </li>
                  <li className="rounded-lg border border-border p-3 bg-card">
                    <strong className="text-foreground">Реклама</strong>
                    <span className="text-muted-foreground">
                      {" "}
                      — баннеры и спецразмещения, заявки через{" "}
                      <DocLink to="/support">поддержку</DocLink> или{" "}
                      <DocLink to="/ads">каталог рекламы</DocLink>.
                    </span>
                  </li>
                  <li className="rounded-lg border border-border p-3 bg-card">
                    <strong className="text-foreground">Вакансии</strong>
                    <span className="text-muted-foreground">
                      {" "}
                      — <DocLink to="/vacancies">/vacancies</DocLink>.
                    </span>
                  </li>
                </ul>
              </section>

              <section id="faq" className="scroll-mt-28">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3">
                  Частые вопросы
                </h2>
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="font-semibold text-foreground mb-1">
                      Почему объект не виден в каталоге?
                    </dt>
                    <dd className="text-muted-foreground leading-relaxed">
                      Обычно он ещё на модерации, отклонён или снят с
                      публикации. Проверьте статус в «Мои объекты». Free listing
                      появляется в каталоге только после одобрения.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground mb-1">
                      Не приходят письма о новых объектах
                    </dt>
                    <dd className="text-muted-foreground leading-relaxed">
                      Проверьте email в профиле, папку «Спам» и что подписка
                      активна с теми же фильтрами. Письмо уходит при публикации
                      нового подходящего объекта.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground mb-1">
                      Как сменить тип аккаунта?
                    </dt>
                    <dd className="text-muted-foreground leading-relaxed">
                      В профиле кабинета, если смена доступна, или напишите в
                      поддержку через форму ниже / контакты — тип влияет на
                      права размещения.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground mb-1">
                      Чем «бесплатное размещение» отличается от управления?
                    </dt>
                    <dd className="text-muted-foreground leading-relaxed">
                      Бесплатно вы сами заполняете и ведёте объявление.
                      Управление — заявка команде {COMPANY.brand} помочь со
                      сдачей или продажей (отдельный процесс через{" "}
                      <DocLink to="/list-property">list-property</DocLink>).
                    </dd>
                  </div>
                </dl>
              </section>

              <section id="support" className="scroll-mt-28">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2">
                  Поддержка
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Email{" "}
                  <a
                    href={`mailto:${CONTACTS.email}`}
                    className="text-primary font-medium hover:underline"
                  >
                    {CONTACTS.email}
                  </a>
                  . Часы: {CONTACTS.hours}, {CONTACTS.hoursWeekend}. Для
                  зарегистрированных пользователей —{" "}
                  <DocLink to="/account#support">
                    личный кабинет → Поддержка
                  </DocLink>
                  . Ниже — форма для гостей, если нашли ошибку на сайте.
                </p>
                <BugReportForm />
              </section>

              <div className="pt-6 border-t border-border flex flex-wrap gap-3 text-sm">
                <DocLink to="/help">← Справочный центр</DocLink>
                <span className="text-border">·</span>
                <DocLink to="/support">Поддержка</DocLink>
                <span className="text-border">·</span>
                <DocLink to="/privacy">Конфиденциальность</DocLink>
              </div>
            </article>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
