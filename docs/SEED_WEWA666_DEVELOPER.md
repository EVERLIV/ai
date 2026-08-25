# Seed: застройщик wewa666@mail.ru

Демо-данные: застройщик ЖК «Байкальский берег» + 6 квартир разной площади.

## Порядок на VPS

1. `supabase/self_hosted_developers.sql`
2. `supabase/self_hosted_signup_roles.sql`
3. Зарегистрируйте аккаунт **wewa666@mail.ru** на сайте (если ещё нет в `auth.users`)
4. `sql/seed_wewa666_developer.sql`

```bash
psql "$DATABASE_URL" -f supabase/self_hosted_developers.sql
psql "$DATABASE_URL" -f supabase/self_hosted_signup_roles.sql
psql "$DATABASE_URL" -f sql/seed_wewa666_developer.sql
```

Или вставьте содержимое `sql/seed_wewa666_developer.sql` в SQL Editor.

## Что создаётся

| Сущность | Значение |
|----------|----------|
| Email | `wewa666@mail.ru` |
| Компания | БайкалСтройИнвест |
| Subtype | `apartment_developer` |
| Проект | ЖК «Байкальский берег», ул. Байкальская 280к1 |
| Квартиры | 6 шт: 29.5 / 41 / 62 / 75 / 92 / 108 м², продажа, новостройка |

Фиксированные UUID — повторный запуск обновляет те же строки (идемпотентно).

## Проверка в UI

1. Войти как `wewa666@mail.ru` → `/account#projects`
2. `/zastroyshchiki` → карточка БайкалСтройИнвест
3. `/proekt/d0000000-0000-4000-8000-000000000010`
4. Каталог жилого: `?seller=developer` или `/zhilaya/catalog`
