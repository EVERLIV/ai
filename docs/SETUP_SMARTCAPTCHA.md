# Яндекс SmartCaptcha — защита заявок и Auth (РФ)

Публичные формы и вход/регистрация защищены так:

1. **Honeypot** — скрытое поле (боты заполняют, люди нет)
2. **Яндекс SmartCaptcha Invisible** — при отправке формы; челлендж только если сервис заподозрит бота

Замена Google reCAPTCHA для локализации / 152-ФЗ.

Документация: https://yandex.cloud/docs/smartcaptcha/

---

## UX (как у большинства сервисов)

- В форме **нет** чекбокса «Я не робот» и лишних пояснений про капчу.
- Пользователь нажимает «Войти» / «Отправить» → виджет отрабатывает тихо.
- При подозрении на бота Яндекс показывает модальный челлендж.

Пакет: `@yandex/smart-captcha` → `InvisibleSmartCaptcha` в `useFormBotGuard`.

---

## 1. Создать ключи в Yandex Cloud

1. [Yandex Cloud Console](https://console.yandex.cloud) → **SmartCaptcha** → создать капчу
2. Домены: `dadatut.ru`, `www.dadatut.ru`, `localhost`
3. Режим / вариант по умолчанию: **Invisible** (невидимая)
4. Сохраните:
   - **Client key** → `VITE_SMARTCAPTCHA_SITE_KEY`
   - **Server key** → `SMARTCAPTCHA_SERVER_KEY`

Если в консоли оставить Checkbox по умолчанию, UX снова может показывать чужой виджет.

---

## 2. Фронтенд (`.env` / `.env.production`)

```env
VITE_SMARTCAPTCHA_SITE_KEY=<client key>
```

Без ключа captcha на клиенте не запрашивается (удобно для локальной разработки).

Пересборка: `npm run build` (Timeweb читает `.env.production`).

---

## 3. Сервер (edge functions)

```env
SMARTCAPTCHA_SERVER_KEY=<server key>
```

Алиас для миграции: `RECAPTCHA_SECRET_KEY` ещё читается.

Если server key **не задан** — на сервере проверяется только honeypot.

```bash
bash scripts/set-smartcaptcha-secret.sh
# или
SMARTCAPTCHA_SERVER_KEY='...' bash scripts/set-smartcaptcha-secret.sh
```

Затем: `bash scripts/deploy-functions.sh`.

---

## 4. Как это работает

- При submit: `InvisibleSmartCaptcha` `visible=true` → token
- Заявки: token → `submit-lead` → `validate`
- Auth: token → edge **`verify-captcha`** → затем `signIn` / `signUp` / `resetPasswordForEmail`
- Сервер: `POST https://smartcaptcha.yandexcloud.net/validate`
- HTTP ≠ 200 от Яндекса → пользователь **не блокируется** (рекомендация Yandex)

---

## Troubleshooting

| Симптом | Что проверить |
|---------|----------------|
| «Не удалось пройти проверку» | Client key; домен в консоли; вариант Invisible |
| Captcha failed на сервере | Server key; токен не старше 5 мин; одноразовость |
| Снова виден чекбокс | В консоли SmartCaptcha смените default на Invisible |
| Локально без captcha | Нормально, если ключи не заданы |
