import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { COMPANY, CONTACTS, REQUISITES_LINE } from "@/config/company";
import { absoluteUrl } from "@/config/site";

type DocKind = "privacy" | "terms";

const DOCS: Record<
  DocKind,
  { title: string; description: string; path: string }
> = {
  privacy: {
    title: "Политика конфиденциальности",
    description: `Политика обработки персональных данных ${COMPANY.brand}`,
    path: "/privacy",
  },
  terms: {
    title: "Правила пользования и лицензионное соглашение",
    description: `Правила пользования сайтом ${COMPANY.brand}`,
    path: "/terms",
  },
};

function PrivacyBody() {
  return (
    <>
      <p>
        Настоящая Политика определяет порядок обработки и защиты персональных
        данных пользователей сайта {COMPANY.brand} (далее — «Сервис»).
      </p>
      <h2>1. Оператор данных</h2>
      <p>
        Оператором персональных данных является {COMPANY.legalName}.{" "}
        {REQUISITES_LINE}. Контакт:{" "}
        <a href={`mailto:${CONTACTS.email}`}>{CONTACTS.email}</a>,{" "}
        <a href={`tel:${CONTACTS.phoneTel}`}>{CONTACTS.phone}</a>.
      </p>
      <h2>2. Какие данные мы обрабатываем</h2>
      <p>
        Имя, телефон, адрес электронной почты, сведения из форм заявок и отзывов,
        технические данные (IP-адрес, cookie, сведения о браузере и устройстве),
        а также иные данные, которые вы добровольно указываете при
        использовании Сервиса.
      </p>
      <h2>3. Цели обработки</h2>
      <ul>
        <li>предоставление доступа к каталогу и функциям Сервиса;</li>
        <li>обработка заявок и обратная связь;</li>
        <li>модерация объявлений и отзывов;</li>
        <li>улучшение качества Сервиса и показ релевантных предложений;</li>
        <li>исполнение требований законодательства РФ.</li>
      </ul>
      <h2 id="recommendations">4. Рекомендательные технологии</h2>
      <p>
        На информационном ресурсе применяются рекомендательные технологии
        Quality Match («Качественный подбор»): персонализация выдачи объявлений
        по качеству карточки и запросу пользователя. Рекламный бюджет агентства
        не влияет на позицию в выдаче «по релевантности». Подробные правила:{" "}
        <Link to="/recommendations">
          Правила применения рекомендательных технологий
        </Link>
        .
      </p>
      <h2>5. Передача третьим лицам</h2>
      <p>
        Данные могут передаваться агентствам и специалистам, к которым вы
        оставляете заявку, а также подрядчикам, обеспечивающим работу Сервиса
        (хостинг, аналитика, рассылки), в объёме, необходимом для оказания услуг.
      </p>
      <h2>6. Права пользователя</h2>
      <p>
        Вы вправе запросить доступ, уточнение, блокирование или удаление своих
        персональных данных, направив обращение на{" "}
        <a href={`mailto:${CONTACTS.email}`}>{CONTACTS.email}</a>.
      </p>
      <h2>7. Cookie</h2>
      <p>
        Сервис использует файлы cookie для авторизации, статистики и удобства
        работы. Продолжая пользоваться сайтом, вы соглашаетесь с их
        использованием.
      </p>
      <p className="text-muted-foreground text-sm pt-4">
        Актуальная редакция опубликована на сайте {COMPANY.brand}. Адрес:{" "}
        {COMPANY.legalAddress}.
      </p>
    </>
  );
}

function TermsBody() {
  return (
    <>
      <p>
        Настоящие Правила пользования сайтом и Лицензионное соглашение
        (далее — «Правила») регулируют доступ к Сервису {COMPANY.brand}.
      </p>
      <h2>1. Общие положения</h2>
      <p>
        Используя сайт, вы подтверждаете согласие с Правилами. Если вы не
        согласны с условиями, пожалуйста, прекратите использование Сервиса.
      </p>
      <h2>2. Услуги</h2>
      <p>
        Сервис предоставляет доступ к базе объявлений о продаже и аренде жилой,
        загородной и коммерческой недвижимости, а также связанные функции
        (поиск, сравнение, заявки, отзывы). Часть услуг может быть платной —
        условия оплаты доводятся до сведения до оплаты.
      </p>
      <h2>3. Лицензионное соглашение</h2>
      <p>
        Оплачивая услуги {COMPANY.brand}, вы принимаете условия оказания платных
        услуг (лицензионное соглашение): объём услуги, срок, стоимость и порядок
        оплаты указываются в соответствующем предложении или договоре.
      </p>
      <h2>4. Объявления пользователей</h2>
      <p>
        Размещая объявление или отзыв, вы гарантируете достоверность сведений и
        наличие прав на публикацию. Администрация вправе модерировать,
        отклонять или снимать материалы, нарушающие закон или Правила.
      </p>
      <h2>5. Ограничение ответственности</h2>
      <p>
        Сведения в объявлениях предоставляют авторы публикаций. {COMPANY.brand}{" "}
        не является стороной сделок между пользователями, если иное прямо не
        указано.
      </p>
      <h2>6. Контакты</h2>
      <p>
        {COMPANY.legalName}. Email:{" "}
        <a href={`mailto:${CONTACTS.email}`}>{CONTACTS.email}</a>. Телефон:{" "}
        <a href={`tel:${CONTACTS.phoneTel}`}>{CONTACTS.phone}</a>.
      </p>
    </>
  );
}

export default function LegalDocPage({ kind }: { kind: DocKind }) {
  const meta = DOCS[kind];
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title={meta.title}
        description={meta.description}
        url={absoluteUrl(meta.path)}
      />
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 lg:px-8 py-10 mt-[56px] lg:mt-[104px] max-w-3xl">
        <nav className="text-[11px] text-muted-foreground mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground transition-colors">
            Главная
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-foreground">{meta.title}</span>
        </nav>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-6">
          {meta.title}
        </h1>
        <article className="space-y-4 text-sm leading-relaxed text-foreground [&_h2]:font-display [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-[#2a6fdb] [&_a]:underline [&_a]:underline-offset-2">
          {kind === "privacy" ? <PrivacyBody /> : <TermsBody />}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
