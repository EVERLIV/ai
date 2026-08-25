# Застройщики (Developers)

Отдельная org-сущность рядом с агентствами: `developers` + `account_type = developer`, subtype в колонке `developers.subtype`.

## Apply SQL (VPS / self-hosted)

Порядок:

1. `supabase/self_hosted_developers.sql` — enums, таблицы, RLS, analytics partition stub, webhooks
2. `supabase/self_hosted_signup_roles.sql` — ветка signup `developer` (создаёт org + owner membership)

Зеркала миграций: `supabase/migrations/20260825_developers.sql`, `20260825_signup_roles_developer.sql`.

```bash
# пример
psql "$DATABASE_URL" -f supabase/self_hosted_developers.sql
psql "$DATABASE_URL" -f supabase/self_hosted_signup_roles.sql
```

Демо-seed застройщика ЖК (`wewa666@mail.ru`): [SEED_WEWA666_DEVELOPER.md](SEED_WEWA666_DEVELOPER.md) → `sql/seed_wewa666_developer.sql`.

## Роли

| Слой | Значение |
|------|----------|
| `profile_account_type` | `developer` |
| `developers.subtype` | `apartment_developer` \| `frame_house_builder` |
| `developer_member_role` | `owner` \| `admin` \| `member` |

Signup meta: `account_type=developer`, `developer_name`, `developer_subtype`, опционально `developer_city` / `developer_about`.

## Таблицы (ядро)

- `developers`, `developer_members`
- `developer_projects` (+ `search_vector` для будущего FTS)
- `project_phases`, `project_unit_types`, `construction_stages`, `project_media`
- `developer_documents`
- `properties.developer_id` / `developer_project_id` / `developer_unit_type_id`
- `developer_analytics_events` (append-only, партиции по месяцу)
- `outbound_webhooks`, `webhook_deliveries` (схема; воркер позже)

## Публичные маршруты

| URL | Страница |
|-----|----------|
| `/zastroyshchiki` | каталог |
| `/zastroyshchik/:id` | карточка |
| `/proekt/:id` | проект |
| `/zastroyshchikam` | B2B лендинг |

Каталог объявлений: `?seller=developer` (`listingSource.isDeveloperListing`).

## API (клиент)

`src/lib/developerApi.ts` + hooks `src/hooks/useDeveloper.ts` — REST через service role (как agencyApi).

Кабинет: вкладки проекты / заявки / статистика / документы / webhooks / компания.

Админка: Dashboard → Верификация → блок «Застройщики».

## Analytics

INSERT в `developer_analytics_events` с `event_type`: `view_developer`, `view_project`, `click_layout`, `lead_submit`. UI статистики — агрегация последних событий в кабинете.
