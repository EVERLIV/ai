# Google reCAPTCHA v3 — защита заявок

Публичные формы заявок идут через edge function **`submit-lead`**:

1. **Honeypot** — скрытое поле (боты заполняют, люди нет)
2. **reCAPTCHA v3** — невидимая оценка Google (если задан secret key)

Вход на сайт — отдельно через Cloudflare Bot Fight: [SETUP_CLOUDFLARE_BOTS.md](./SETUP_CLOUDFLARE_BOTS.md).

---

## 1. Создать ключи в Google

1. Откройте [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. **Create** → тип **reCAPTCHA v3**
3. Domains: `dadatut.ru`, `www.dadatut.ru`, `localhost` (для разработки)
4. Сохраните:
   - **Site Key** — для фронтенда (`VITE_RECAPTCHA_SITE_KEY`)
   - **Secret Key** — только для сервера (`RECAPTCHA_SECRET_KEY`)

Документация: https://developers.google.com/recaptcha/docs/v3

---

## 2. Ключи на фронтенде (`.env`)

```env
# Публичный site key — попадает в JS-бандл, это нормально
VITE_RECAPTCHA_SITE_KEY=6L...

# URL edge function (если self-hosted на VPS)
VITE_SUBMIT_LEAD_URL=https://api.arendacity.com/functions/v1/submit-lead
```

Если `VITE_RECAPTCHA_SITE_KEY` **не задан**, captcha на клиенте не запрашивается (удобно для локальной разработки).

Пересоберите фронт после изменения `.env`:

```bash
npm run build
```

---

## 3. Секреты на сервере (Supabase Edge / VPS)

В **Edge Functions → Secrets** или `.env` Docker на VPS:

```env
RECAPTCHA_SECRET_KEY=6L...

# Уже должны быть для записи заявок:
SUPABASE_URL=https://api.arendacity.com
SUPABASE_SERVICE_ROLE_KEY=...
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

Если `RECAPTCHA_SECRET_KEY` **не задан**, captcha на сервере не проверяется (только honeypot).

Порог score v3 по умолчанию: **0.5** (см. `supabase/functions/_shared/recaptcha.ts`).

---

## 4. Деплой secret + функции

```bash
# На VPS — записать secret:
bash scripts/set-recaptcha-secret.sh

# Или из .env проекта:
bash scripts/set-recaptcha-secret.sh --from-env

# Затем задеплоить функцию:
bash scripts/deploy-functions.sh
```

---

## 5. Как это работает во фронте

Через `submitLead()` + `useFormBotGuard()`:

- Виджет не показывается (v3)
- При отправке вызывается `grecaptcha.execute(..., { action: 'submit_lead' })`
- Токен уходит в `captcha_token` → сервер проверяет через Google siteverify

---

## Troubleshooting

| Симптом | Что проверить |
|---------|----------------|
| «Подтвердите, что вы не робот» | Site key в сборке; домен в Google Admin; script загрузился |
| Captcha failed на сервере | Secret key; score &lt; 0.5; action `submit_lead` |
| Локально без captcha | Нормально, если ключи не заданы |

Тестовые ключи Google: https://developers.google.com/recaptcha/docs/faq#id-like-to-run-automated-tests-with-recaptcha.-what-should-i-do
