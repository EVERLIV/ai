# SEO: sitemap, RSS, OpenGraph, Вебмастер

Настройка индексации сайта [arendacity.com](https://arendacity.com): карта сайта, лента новых объектов, OpenGraph и подключение к Google / Яндекс.

## Что генерируется при сборке

Скрипт `scripts/generate-seo.mjs` (запускается через `prebuild`) создаёт в `public/`:

| Файл | Назначение |
|------|------------|
| `sitemap.xml` | Карта сайта для Google и Яндекс |
| `feed.xml` | RSS-лента последних 50 объектов (+ до 10 новостей) |
| `robots.txt` | Правила обхода + ссылка на sitemap |

После `npm run build` файлы попадают в `dist/` и публикуются на Timeweb вместе с сайтом.

### Переменные окружения

Для заполнения sitemap и ленты из каталога нужны:

```env
VITE_SUPABASE_URL=https://api.arendacity.com
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Локально — из `.env`. В GitHub Actions — секреты репозитория (см. `.github/workflows/deploy.yml`).

Если переменных нет, скрипт всё равно создаст `robots.txt` и sitemap со **статическими** страницами (без карточек объектов).

## После публикации нового объекта

Лента и sitemap обновляются **только при деплое фронта**. После добавления объекта в каталог:

1. Запустите сборку (`npm run build` или push в `main` → GitHub Actions).
2. Загрузите новый `dist/` на хостинг.

Для мгновенного обновления ленты без деплоя позже можно вынести `feed.xml` на edge-функцию — сейчас выбрана статическая генерация.

## Google Search Console

1. [search.google.com/search-console](https://search.google.com/search-console) → добавить ресурс `https://arendacity.com`.
2. Подтверждение: meta-тег в `index.html` (раскомментируйте блок `google-site-verification` и вставьте код).
3. **Sitemap:** `https://arendacity.com/sitemap.xml` → «Добавить файл Sitemap».

## Яндекс Вебмастер

1. [webmaster.yandex.ru](https://webmaster.yandex.ru) → добавить сайт.
2. Подтверждение: meta `yandex-verification` в `index.html`.
3. **Индексирование → Файлы Sitemap:** `https://arendacity.com/sitemap.xml`.
4. **Фиды и ошибки → RSS:** `https://arendacity.com/feed.xml`.

## Яндекс Дзен (опционально)

Дзен → настройки канала → RSS-источник:

```
https://arendacity.com/feed.xml
```

В ленте — заголовки объектов по шаблону «Аренда — офис — район — цена» и ссылки на карточки.

## OpenGraph и превью в соцсетях

- Дефолтная картинка: `https://arendacity.com/og-default.jpg` (1200×630).
- На карточках объекта meta выставляется клиентским `SeoHead` (после загрузки JS).
- Проверка:
  - [Telegram](https://t.me) — отправить ссылку в «Избранное»;
  - [Яндекс Валидатор](https://webmaster.yandex.ru/tools/microtest/);
  - [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) (подходит и для многих мессенджеров).

Для 100% превью каждой карточки без JS позже можно добавить prerender/SSR — не входит в текущий этап.

## Favicon и OG-картинки

- `public/favicon.png` — иконка сайта.
- `public/apple-touch-icon.png` — 180×180 для iOS.
- `public/og-default.jpg` — брендовая OG-картинка.

Пересоздать OG и apple-touch-icon:

```bash
node scripts/generate-og-images.mjs
```

## Title карточек объекта

Единый шаблон в `src/lib/seo/propertySeoTitle.ts`:

```
Аренда — помещение для торговли — Ангарск, 11 мкр — 45 тыс ₽/мес
```

Используется в `<title>`, OpenGraph, RSS и скрытом `<h1>` на странице объекта.

## Страницы с noindex

Не индексируются (robots + `SeoHead noindex`):

- `/auth`, `/dashboard`, `/account`, `/reset-password`, `/tasks`

## Локальная проверка

```bash
npm run build
npx vite preview
```

Откройте:

- http://localhost:4173/sitemap.xml
- http://localhost:4173/feed.xml
- http://localhost:4173/robots.txt
