/** Публичный URL сайта — для canonical, OG, sitemap, RSS */
export const SITE_URL = "https://dadatut.ru";

export const SITE = {
  name: "ДАДАТУТ",
  title:
    "ДАДАТУТ — Аренда и продажа коммерческой и жилой недвижимости в Иркутске",
  description:
    "Аренда и продажа коммерческой и жилой недвижимости в Иркутске и Иркутской области. Офисы, торговые площади, склады, квартиры, дома и комнаты. Профессиональный подбор от ДАДАТУТ.",
  ogImage: `${SITE_URL}/og-default.jpg`,
  locale: "ru_RU",
  twitterSite: "@Dadatut",
} as const;

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
