# Агентство АрендаСити — запуск на self-hosted

## SQL (по порядку)

1. `supabase/self_hosted_agencies.sql` — если схема агентств ещё не применена
2. `supabase/self_hosted_agency_reviews.sql` — отзывы + `avg_rating` / `reviews_count`
3. `supabase/self_hosted_agency_reviews_auth.sql` — отзывы только от авторизованных, статус `pending`
4. `supabase/self_hosted_agency_reviews_reply.sql` — ответы агентства на отзывы
5. `supabase/self_hosted_signup_roles.sql` — роли регистрации: seeker / owner / realtor / agency
6. `sql/seed_arendacity_agency.sql` — агентство, Анастасия, membership `hoaandrey@gmail.com`, бэкфилл объектов, демо-отзывы

Фиксированные ID (совпадают с `src/config/defaultAgent.ts`):

- agency: `a0000000-0000-4000-8000-000000000001`
- manager: `a0000000-0000-4000-8000-000000000002`

Фото: `public/consultant-anastasia.jpg` → URL `/consultant-anastasia.jpg`.

## Проверка в UI

1. `/rieltory` — вкладки «Риелторы» и «Агентства»: АрендаСити / Анастасия Романова, рейтинг
2. `/agentstvo/...` / `/rieltor/...` — отзывы только после входа, уходят на модерацию
3. Dashboard → Модерация → блок «Отзывы» — опубликовать / отклонить
4. Личный кабинет агентства → «Мои отзывы» — статусы модерации, ответ на отзыв
5. `/auth?tab=register` — select: Хочу найти / Хочу сдать / Агентство / Риелтор
6. Карточки объектов — ссылки на агентство и менеджера
