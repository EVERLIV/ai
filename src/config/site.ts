/** Публичный URL сайта — для canonical, OG, sitemap, RSS */
export const SITE_URL = "https://dadatut.ru";

export const SITE = {
  name: "ДАДАТУТ",
  /** Бренд в title, og:site_name и суффиксах SEO */
  seoBrand: "ДАДА ТУТ!",
  tagline: "У вас вся недвижимость региона? Дада, тут!",
  title: "ДАДА ТУТ! — вся недвижимость региона",
  description:
    "У вас вся недвижимость региона? Дада, тут! Жилая и коммерческая недвижимость Иркутска и области — бесплатный каталог ДАДАТУТ.",
  ogImage: `${SITE_URL}/og-default.jpg`,
  locale: "ru_RU",
  twitterSite: "@Dadatut",
} as const;

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
