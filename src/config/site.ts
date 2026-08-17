/** Публичный URL сайта — для canonical, OG, sitemap, RSS */
export const SITE_URL = "https://arendacity.com";

export const SITE = {
  name: "АрендаСити",
  title: "АрендаСити — Аренда коммерческой недвижимости в Иркутске",
  description:
    "Аренда и продажа коммерческой недвижимости в Иркутске и Иркутской области. Офисы, торговые площади, склады. Профессиональный подбор от агентства АрендаСити.",
  ogImage: `${SITE_URL}/og-default.jpg`,
  locale: "ru_RU",
  twitterSite: "@ArendaCity",
} as const;

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
