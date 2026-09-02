/**
 * Prebuild: sitemap.xml, feed.xml, robots.txt, rich /og/property HTML from Supabase.
 * Env: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY (или .env в корне)
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE_URL = "https://dadatut.ru";
const SITE_NAME = "ДАДАТУТ";
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const publicDir = join(rootDir, "public");

function loadEnvFile() {
  try {
    const raw = readFileSync(join(rootDir, ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] == null || process.env[key] === "") {
        process.env[key] = val;
      }
    }
  } catch {
    // .env optional
  }
}

loadEnvFile();

const SUPABASE_URL = (
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  ""
).replace(/\/$/, "");
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY;

const TYPE_SEO = {
  Офис: "офис",
  Торговая: "помещение для торговли",
  Склад: "склад",
  Земля: "земельный участок",
  Помещение: "помещение",
  Павильон: "павильон",
  Киоск: "киоск",
  Квартира: "квартира",
  Дом: "дом",
  Комната: "комната",
  Таунхаус: "таунхаус",
  Апартаменты: "апартаменты",
  Дача: "дача",
  Коттедж: "коттедж",
  Участок: "участок",
  Гараж: "гараж",
  Машиноместо: "машиноместо",
  Доля: "доля в квартире",
};

const STATIC_PATHS = [
  "/",
  "/catalog",
  "/offices",
  "/retail",
  "/warehouses",
  "/land",
  "/zemlya",
  "/zemlya/catalog",
  "/about",
  "/support",
  "/vacancies",
  "/news",
  "/list-property",
  "/ads",
  "/rieltory",
  "/zastroyshchiki",
  "/docs",
  "/help",
  "/privacy",
  "/terms",
  "/zhilaya",
  "/zhilaya/catalog",
  "/zhilaya/kvartiry",
  "/zhilaya/doma",
  "/zhilaya/komnaty",
  "/zhilaya/uchastki",
  "/zhilaya/list-property",
];

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatW3CDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? new Date().toISOString().slice(0, 10)
    : d.toISOString().slice(0, 10);
}

function formatRssDate(value) {
  const d = value ? new Date(value) : new Date();
  return d.toUTCString();
}

function isSaleDeal(dealType) {
  return dealType === "Продажа";
}

function formatPriceShort(price, dealType) {
  const n = Number(price) || 0;
  if (n <= 0) return "цена по запросу";
  const rent = !isSaleDeal(dealType || "Аренда");
  const suffix = rent ? " ₽/мес" : " ₽";
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    const label =
      m >= 10
        ? `${Math.round(m)} млн`
        : `${m.toFixed(1).replace(".0", "")} млн`;
    return `${label}${suffix}`;
  }
  if (n >= 1_000) {
    const k = Math.round(n / 1_000);
    return `${k} тыс${suffix}`;
  }
  return `${n.toLocaleString("ru-RU")}${suffix}`;
}

function getPrimaryPropertyType(p) {
  const extras = p.extras;
  const fromExtras = extras?.property_types;
  if (Array.isArray(fromExtras) && fromExtras.length > 0) {
    const t = fromExtras.find((x) => typeof x === "string" && x.trim());
    if (t) return t.trim();
  }
  return (p.type || "").trim();
}

function typeSeoLabel(type) {
  return TYPE_SEO[type] || (type ? type.toLowerCase() : "объект");
}

function parseAddress(address, district) {
  const parts = String(address || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0)
    return { location: (district || "").trim(), street: "" };

  const first = parts[0];
  const rest = parts.slice(1).join(", ");
  let location = first;
  if (district?.trim()) {
    const d = district.trim();
    if (!first.toLowerCase().includes(d.toLowerCase())) {
      location = `${first}, ${d}`;
    }
  }
  const street = rest.length > 60 ? `${rest.slice(0, 57)}…` : rest;
  return { location, street };
}

function buildPropertySeoTitle(p) {
  const deal = (p.deal_type || "Аренда").trim();
  const typeLabel = typeSeoLabel(getPrimaryPropertyType(p));
  const { location, street } = parseAddress(p.address, p.district);
  const price = formatPriceShort(p.price, p.deal_type);
  const parts = [deal, typeLabel];
  if (location) parts.push(location);
  if (street) parts.push(street);
  parts.push(price);
  return parts.join(" — ");
}

function buildPropertySeoDescription(p) {
  const typeLabel = typeSeoLabel(getPrimaryPropertyType(p));
  const area = Number(p.area) > 0 ? `${p.area} м²` : "";
  const price = formatPriceShort(p.price, p.deal_type);
  const district = p.district?.trim() ? `, ${p.district.trim()}` : "";
  const desc = String(p.description || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
  const base = [typeLabel, area, price, district.replace(/^, /, "")]
    .filter(Boolean)
    .join(" · ");
  return desc ? `${base}. ${desc}` : base;
}

function absoluteUrl(path) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function fetchAll(table, select, filters = "") {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];

  const rows = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const qs = new URLSearchParams();
    for (const part of filters.split("&").filter(Boolean)) {
      const [k, v] = part.split("=");
      qs.set(k, v);
    }
    qs.set("select", select);
    qs.set("limit", String(limit));
    qs.set("offset", String(offset));

    const url = `${SUPABASE_URL}/rest/v1/${table}?${qs.toString()}`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn(
        `[generate-seo] ${table} fetch failed (${res.status}): ${body.slice(0, 200)}`,
      );
      break;
    }

    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    rows.push(...batch);
    if (batch.length < limit) break;
    offset += limit;
  }

  return rows;
}

function writeRobotsTxt() {
  const content = `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: Yandex
Allow: /

User-agent: *
Allow: /
Disallow: /auth
Disallow: /dashboard
Disallow: /account
Disallow: /reset-password
Disallow: /tasks

Host: dadatut.ru
Sitemap: ${SITE_URL}/sitemap.xml
`;
  writeFileSync(join(publicDir, "robots.txt"), content, "utf8");
  console.log("✓ public/robots.txt");
}

function writeSitemap(properties, newsPosts) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [];

  for (const path of STATIC_PATHS) {
    urls.push({
      loc: absoluteUrl(path),
      lastmod: today,
      changefreq: "weekly",
      priority: path === "/" ? "1.0" : "0.8",
    });
  }

  for (const p of properties) {
    urls.push({
      loc: absoluteUrl(`/property/${p.id}`),
      lastmod: formatW3CDate(p.updated_at),
      changefreq: "weekly",
      priority: "0.7",
    });
  }

  for (const post of newsPosts) {
    if (!post.slug) continue;
    urls.push({
      loc: absoluteUrl(`/news/${post.slug}`),
      lastmod: formatW3CDate(post.updated_at || post.published_at),
      changefreq: "monthly",
      priority: "0.6",
    });
  }

  const body = urls
    .map(
      (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
  writeFileSync(join(publicDir, "sitemap.xml"), xml, "utf8");
  console.log(`✓ public/sitemap.xml (${urls.length} URLs)`);
}

function writeFeed(properties, newsPosts) {
  const feedProperties = [...properties]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 50);

  const items = feedProperties.map((p) => {
    const title = buildPropertySeoTitle(p);
    const link = absoluteUrl(`/property/${p.id}`);
    const description = escapeXml(buildPropertySeoDescription(p));
    const pubDate = formatRssDate(p.created_at);
    const enclosure =
      p.cover_photo &&
      (p.cover_photo.startsWith("http://") ||
        p.cover_photo.startsWith("https://"))
        ? `\n      <enclosure url="${escapeXml(p.cover_photo)}" type="image/jpeg" />`
        : "";

    return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>${enclosure}
    </item>`;
  });

  // Optional news items (latest 10)
  const feedNews = [...newsPosts]
    .filter((n) => n.slug && n.status === "published")
    .sort(
      (a, b) =>
        new Date(b.published_at || b.created_at).getTime() -
        new Date(a.published_at || a.created_at).getTime(),
    )
    .slice(0, 10);

  for (const post of feedNews) {
    const link = absoluteUrl(`/news/${post.slug}`);
    items.push(`    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(post.excerpt || post.title)}</description>
      <pubDate>${formatRssDate(post.published_at || post.created_at)}</pubDate>
    </item>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${SITE_NAME} — новые объекты</title>
    <link>${SITE_URL}</link>
    <description>Новые объявления коммерческой недвижимости в Иркутске и области</description>
    <language>ru</language>
    <lastBuildDate>${formatRssDate(new Date())}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>
`;
  writeFileSync(join(publicDir, "feed.xml"), xml, "utf8");
  console.log(
    `✓ public/feed.xml (${feedProperties.length} properties, ${feedNews.length} news)`,
  );
}

function writePropertyOgPages(properties) {
  const ogDir = join(publicDir, "og", "property");
  try {
    rmSync(join(publicDir, "og"), { recursive: true, force: true });
  } catch {
    // ignore
  }
  mkdirSync(ogDir, { recursive: true });

  for (const p of properties) {
    const title = buildPropertySeoTitle(p);
    const description = buildPropertySeoDescription(p);
    const url = absoluteUrl(`/property/${p.id}`);
    const catalogUrl = absoluteUrl("/catalog");
    const image =
      p.cover_photo &&
      (p.cover_photo.startsWith("http://") ||
        p.cover_photo.startsWith("https://"))
        ? p.cover_photo
        : absoluteUrl("/og-default.jpg");
    const typeLabel = typeSeoLabel(getPrimaryPropertyType(p));
    const area = Number(p.area) > 0 ? `${p.area} м²` : "";
    const price = formatPriceShort(p.price, p.deal_type);
    const deal = (p.deal_type || "Аренда").trim();
    const address = String(p.address || "").trim();
    const district = String(p.district || "").trim();
    const descText = String(p.description || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 1200);
    const priceNum = Number(p.price) || 0;

    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "RealEstateListing",
          name: title,
          description,
          url,
          image,
          address: {
            "@type": "PostalAddress",
            streetAddress: address,
            addressLocality: district || "Иркутск",
            addressRegion: "Иркутская область",
            addressCountry: "RU",
          },
          ...(Number(p.area) > 0
            ? {
                floorSize: {
                  "@type": "QuantitativeValue",
                  value: Number(p.area),
                  unitCode: "MTK",
                },
              }
            : {}),
          ...(priceNum > 0
            ? {
                offers: {
                  "@type": "Offer",
                  price: priceNum,
                  priceCurrency: "RUB",
                  availability: "https://schema.org/InStock",
                },
              }
            : {}),
          category: p.type || typeLabel,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Главная",
              item: SITE_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Каталог",
              item: catalogUrl,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: title,
              item: url,
            },
          ],
        },
      ],
    };

    const facts = [
      ["Тип сделки", deal],
      ["Тип объекта", typeLabel],
      area ? ["Площадь", area] : null,
      ["Цена", price],
      district ? ["Район", district] : null,
      address ? ["Адрес", address] : null,
    ].filter(Boolean);

    const factsHtml = facts
      .map(
        ([label, value]) =>
          `    <div><dt>${escapeXml(label)}</dt><dd>${escapeXml(value)}</dd></div>`,
      )
      .join("\n");

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeXml(title)} — ${SITE_NAME}</title>
  <meta name="description" content="${escapeXml(description.slice(0, 300))}" />
  <link rel="canonical" href="${escapeXml(url)}" />
  <meta property="og:title" content="${escapeXml(title)}" />
  <meta property="og:description" content="${escapeXml(description.slice(0, 300))}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeXml(url)}" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:locale" content="ru_RU" />
  <meta property="og:image" content="${escapeXml(image)}" />
  <meta property="og:image:secure_url" content="${escapeXml(image)}" />
  <meta property="og:image:alt" content="${escapeXml(title)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeXml(title)}" />
  <meta name="twitter:description" content="${escapeXml(description.slice(0, 300))}" />
  <meta name="twitter:image" content="${escapeXml(image)}" />
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
  <style>
    body{font-family:system-ui,sans-serif;max-width:720px;margin:24px auto;padding:0 16px;line-height:1.5;color:#111}
    a{color:#0b57d0} nav{font-size:14px;color:#555;margin-bottom:16px}
    h1{font-size:1.5rem;margin:0 0 12px} dl{margin:16px 0} dl div{display:flex;gap:12px;padding:6px 0;border-bottom:1px solid #eee}
    dt{min-width:110px;color:#666;font-size:13px} dd{margin:0;font-weight:600}
  </style>
</head>
<body>
  <nav>
    <a href="${escapeXml(SITE_URL)}">Главная</a> /
    <a href="${escapeXml(catalogUrl)}">Каталог</a> /
    <span>Объект</span>
  </nav>
  <h1>${escapeXml(title)}</h1>
  <p>${escapeXml(description)}</p>
  <dl>
${factsHtml}
  </dl>
  ${descText ? `<section><h2>Описание</h2><p>${escapeXml(descText)}</p></section>` : ""}
  <p><a href="${escapeXml(url)}">Открыть объявление на ${SITE_NAME}</a> · <a href="${escapeXml(catalogUrl)}">Все объекты</a></p>
</body>
</html>
`;
    writeFileSync(join(ogDir, `${p.id}.html`), html, "utf8");
  }

  console.log(`✓ public/og/property (${properties.length} SEO pages)`);
}

console.log("[generate-seo] Starting…");

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    "[generate-seo] VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY not set — static pages only.",
  );
}

const properties = await fetchAll(
  "properties",
  "id,created_at,updated_at,deal_type,type,extras,address,district,price,area,description,cover_photo",
  "is_active=eq.true&order=updated_at.desc",
);

const newsPosts = await fetchAll(
  "news_posts",
  "slug,title,excerpt,status,published_at,created_at,updated_at",
  "status=eq.published&order=published_at.desc",
);

writeRobotsTxt();
writeSitemap(properties, newsPosts);
writeFeed(properties, newsPosts);
writePropertyOgPages(properties);

console.log("[generate-seo] Done.");
