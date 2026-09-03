import { Link } from "react-router-dom";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { COMPANY, CONTACTS } from "@/config/company";
import { absoluteUrl } from "@/config/site";

const sectionTitle =
  "font-display text-xl sm:text-2xl font-bold text-foreground mb-3";
const body = "text-[15px] leading-relaxed text-muted-foreground";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SeoHead
        title={`О проекте ${COMPANY.brand}`}
        description={`${COMPANY.brand} — каталог жилья и помещений для жителей и малого бизнеса Иркутска и области. Баннеры, размещение, каталог агентств и риелторов.`}
        url={absoluteUrl("/about")}
      />
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8 lg:py-10 mt-[56px] lg:mt-[104px] max-w-3xl">
        <nav className="text-[11px] text-muted-foreground mb-8 flex flex-wrap items-center gap-1.5">
          <Link to="/" className="hover:text-foreground transition-colors">
            Главная
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-foreground">О нас</span>
        </nav>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-5">
          О проекте
        </h1>
        <div className={`space-y-4 ${body} mb-14`}>
          <p>
            <span className="text-foreground font-medium">{COMPANY.brand}</span>{" "}
            — открытый каталог недвижимости Иркутска и области. Мы строим
            площадку, которая помогает жителям найти жильё, а малому бизнесу —
            помещение под работу: офис, торговлю, склад или землю.
          </p>
          <p>
            Смотрите объявления, сравнивайте варианты и пишите напрямую. Без
            переплат на чужих витринах и без лишних посредников. Собственник
            может разместить объект бесплатно — сами или с нашей помощью.
          </p>
        </div>

        <section className="mb-14">
          <h2 className={sectionTitle}>Кому это интересно</h2>
          <div className={`space-y-5 ${body}`}>
            <p>
              <span className="text-foreground font-medium">Жителям региона.</span>{" "}
              Квартира, дом, комната или участок — в аренду, в продажу или
              посуточно. Каталог открыт без регистрации.
            </p>
            <p>
              <span className="text-foreground font-medium">Малому бизнесу.</span>{" "}
              Нужно помещение, чтобы открыться или переехать. Ищем офис,
              торговлю, павильон, склад — по району, площади и бюджету.
            </p>
            <p>
              <span className="text-foreground font-medium">Собственникам.</span>{" "}
              Есть квартира, дом или коммерция — помогаем выложить объявление в
              каталог. Можно заполнить карточку самостоятельно или прислать
              данные нам.
            </p>
            <p>
              <span className="text-foreground font-medium">
                Агентствам и риелторам.
              </span>{" "}
              Своя страница в каталоге специалистов, объекты рядом с профилем,
              заявки от людей, которые уже ищут в регионе.
            </p>
            <p>
              <span className="text-foreground font-medium">
                Застройщикам и рекламодателям.
              </span>{" "}
              Баннеры и размещение на главной, в каталоге и в рассылках —
              аудитория, которая смотрит недвижимость, а не случайный трафик.
            </p>
          </div>
        </section>

        <section className="mb-14">
          <h2 className={sectionTitle}>Что можем предложить</h2>
          <div className={`space-y-5 ${body}`}>
            <p>
              <span className="text-foreground font-medium">
                Баннеры и размещение.
              </span>{" "}
              Рекламные блоки на сайте: главная, каталог, карточки объектов.
              Формат и срок обсуждаем по задаче — новостройка, услуга, акция.
            </p>
            <p>
              <span className="text-foreground font-medium">
                Каталог агентств и риелторов.
              </span>{" "}
              Можем сами занести агентство или риелтора в каталог: профиль,
              фото, районы, типы объектов. Вам не нужно разбираться в кабинете
              — достаточно написать и прислать материалы.
            </p>
            <p>
              <span className="text-foreground font-medium">
                Помощь собственникам.
              </span>{" "}
              Если нет времени заполнять форму, пришлите описание, адрес, цену и
              фото. Мы подготовим карточку и опубликуем объявление после
              проверки.
            </p>
            <p>
              <span className="text-foreground font-medium">
                Бесплатная публикация.
              </span>{" "}
              Размещение объектов в каталоге для собственников — без платы за
              «вход» на площадку. Платные опции только там, где нужна реклама:
              баннеры и приоритетный показ.
            </p>
          </div>
        </section>

        <section id="partnership" className="border-t border-border pt-10">
          <h2 className={sectionTitle}>Сотрудничество</h2>
          <p className={`${body} mb-5 max-w-xl`}>
            Баннер, размещение агентства или риелтора, помощь с объявлением —
            напишите, что нужно. Все заявки принимаем на почту.
          </p>
          <a
            href={`mailto:${CONTACTS.email}?subject=${encodeURIComponent(`Сотрудничество — ${COMPANY.brand}`)}`}
            className="text-lg font-semibold text-primary hover:underline"
          >
            {CONTACTS.email}
          </a>
          <p className="text-sm text-muted-foreground mt-3 max-w-xl">
            В письме укажите, кто вы и что хотите: реклама, профиль в каталоге
            или публикация объекта. Ответим в рабочее время.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
