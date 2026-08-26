# Seed: застройщик деревянных домов vanandrey.smi@mail.ru

Демо: компания **ТайгаДом** (`frame_house_builder`) + **4 серии домов** с AI-обложками и объявлениями в каталоге.

## Порядок на VPS

1. `supabase/self_hosted_developers.sql`
2. `supabase/self_hosted_signup_roles.sql`
3. Зарегистрируйте **vanandrey.smi@mail.ru** на сайте (если ещё нет в `auth.users`)
4. Задеплойте static-файлы из `public/mock/wooden-houses/` (обложки)
5. `sql/seed_vanandrey_wooden_developer.sql`

```bash
psql "$DATABASE_URL" -f sql/seed_vanandrey_wooden_developer.sql
```

## Что создаётся

| Сущность | Значение |
|----------|----------|
| Email | `vanandrey.smi@mail.ru` |
| Компания | ТайгаДом |
| Subtype | `frame_house_builder` |
| Проекты | Байкал-120 (каркас), Кедр-150 (клееный брус), Ангара-сруб (бревно), Модуль-90 (SIP) |
| Объявления | 4 дома в жилом каталоге, продажа |

Обложки: `public/mock/wooden-houses/01…04.jpg` → URL `https://arendacity.com/mock/wooden-houses/…`

## Проверка в UI

1. Войти как `vanandrey.smi@mail.ru` → `/account#projects`
2. `/zastroyshchiki` → фильтр деревянных / карточка ТайгаДом
3. `/zastroyshchik/e0000000-0000-4000-8000-000000000001`
4. Каталог: `/zhilaya/catalog?seller=developer` или типы Дом
