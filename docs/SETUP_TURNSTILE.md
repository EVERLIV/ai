# Cloudflare Turnstile — защита форм от ботов

Все публичные формы заявок отправляются через edge function **`submit-lead`**, которая проверяет:

1. **Honeypot** — скрытое поле `website` (боты заполняют, люди нет)
2. **Turnstile** — captcha Cloudflare (если задан secret key)

После проверки заявка пишется в `crm_leads` и уходит в Telegram.

---

## 1. Создать Turnstile в Cloudflare

1. Войдите в [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **Turnstile** → **Add widget**
3. Укажите домены: `arendacity.com`, `localhost` (для разработки)
4. Режим виджета: **Managed** (рекомендуется)
5. Сохраните:
   - **Site Key** — для фронтенда
   - **Secret Key** — только для сервера

Документация: https://developers.cloudflare.com/turnstile/

---

## 2. Ключи на фронтенде (`.env`)

```env
# Публичный site key — попадает в JS-бандл, это нормально
VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA...

# URL edge function (если self-hosted на VPS)
VITE_SUBMIT_LEAD_URL=https://api.arendacity.com/functions/v1/submit-lead
```

Если `VITE_TURNSTILE_SITE_KEY` **не задан**, виджет не показывается (удобно для локальной разработки).

Пересоберите фронт после изменения `.env`:

```bash
npm run build
```

---

## 3. Секреты на сервере (Supabase Edge / VPS)

Задайте в **Edge Functions → Secrets** (cloud) или в `.env` Docker на VPS:

```env
TURNSTILE_SECRET_KEY=0x4AAAAAAA...

# Уже должны быть для записи заявок:
SUPABASE_URL=https://api.arendacity.com
SUPABASE_SERVICE_ROLE_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

Если `TURNSTILE_SECRET_KEY` **не задан**, captcha на сервере не проверяется (только honeypot).

---

## 4. Деплой edge function

```bash
# На VPS — интерактивно вставить secret key:
bash scripts/set-turnstile-secret.sh

# Или взять TURNSTILE_SECRET_KEY из .env проекта на сервере:
bash scripts/set-turnstile-secret.sh --from-env

# Затем задеплоить функцию:
bash scripts/deploy-functions.sh
```

Или вручную в secrets:

```bash
supabase functions deploy submit-lead --project-ref xbdwapunrlnxcuxjhaca
```

Проверка:

```bash
curl -X POST "https://api.arendacity.com/functions/v1/submit-lead" \
  -H "Content-Type: application/json" \
  -d '{"name":"Тест","phone":"+79001234567","source":"website","captcha_token":"..."}'
```

---

## 5. Какие формы защищены

Через `submitLead()` + `FormBotGuard`:

- Контакты, вакансии, главная «Сдать объект»
- Объект: «Написать», «Предложить цену», форма на странице
- Виджет консультации, каталог, категории
- Специалисты, квиз, отчёт о баге в справочнике
- ИИ-чат (форма «Представьтесь»)

**Не через submit-lead:** авторизация Supabase, жалобы на объявление (требуют login), подписка на поиск в каталоге (authenticated).

---

## 6. Отладка

| Симптом | Решение |
|---------|---------|
| Нет виджета captcha | Проверьте `VITE_TURNSTILE_SITE_KEY`, пересоберите фронт |
| «Подтвердите, что вы не робот» | Пройдите captcha; проверьте domain в настройках Turnstile |
| 400 Captcha failed | Secret key не совпадает с site key или token просрочен |
| Заявка не в Telegram | Проверьте `TELEGRAM_*`; заявка всё равно в админке → CRM |

Test keys Cloudflare (только dev):  
https://developers.cloudflare.com/turnstile/troubleshooting/testing/
