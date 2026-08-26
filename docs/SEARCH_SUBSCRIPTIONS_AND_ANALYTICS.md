# Подписки на поиск и admin-аналитика

## SQL

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f sql/search_subscriptions_and_analytics.sql \
  -f sql/fix_search_subscriptions_postgrest.sql
```

Второй файл добавляет UNIQUE CONSTRAINT для upsert и делает `NOTIFY pgrst, 'reload schema'`.

Зеркало миграции: `supabase/migrations/20260826_search_subscriptions_and_analytics.sql`.

Таблицы:

| Таблица | Назначение |
|--------|------------|
| `search_subscriptions` | Одна активная подписка на пользователя (email, типы, filters jsonb) |
| `site_analytics_events` | Append-only: `page_view`, `property_view`, `section_view` |
| `site_presence` | Heartbeat по `session_id`; онлайн = `last_seen_at > now() - 2 min` |

## RLS

- **Подписки:** пользователь CRUD свои; admin/manager SELECT all.
- **Events:** INSERT для anon+authenticated; SELECT только admin/manager.
- **Presence:** INSERT/UPDATE публичные; SELECT/DELETE staff.

Клиентский трекер (`AnalyticsBeacon`) пишет события всем посетителям; виджеты статистики в Dashboard — только staff.

## Подписка UI

Каталог → «Уведомить о новых» → auth-only диалог (`CatalogSearchAlertDialog`): email из профиля, чекбоксы типов, согласие `/privacy`. API: `upsertSearchSubscriptionApi`.

При одобрении free listing в модерации: `notifyMatchingSubscriptions` → SMTP event `subscription_match` (нужен задеплоенный `notify-property-email`).

## Админка

- CRM → **Ищут недвижимость** (`SeekersCatalogTab`)
- Система → **Аналитика** (`AdminSiteAnalyticsTab`)
