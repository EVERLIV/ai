# Яндекс SmartCaptcha — защита заявок и Auth (РФ)

Публичные формы и вход/регистрация защищены так:

1. **Honeypot** — скрытое поле (боты заполняют, люди нет)
2. **Яндекс SmartCaptcha Invisible** — при отправке формы; челлендж только если сервис заподозрит бота

Замена Google reCAPTCHA для локализации / 152-ФЗ.

Документация: https://yandex.cloud/docs/smartcaptcha/

---

## UX

- Пользователь нажимает «Войти» / «Отправить» → небольшой попап **«Я не робот»**.
- В попапе Checkbox SmartCaptcha (`smartCaptcha.render` / `@yandex/smart-captcha`).
- После успешной проверки попап закрывается, форма продолжает отправку.

Документация: [React-компонент](https://yandex.cloud/docs/smartcaptcha/concepts/react), [проверка домена](https://yandex.cloud/docs/smartcaptcha/concepts/domain-validation).

---

## 1. Создать ключи в Yandex Cloud

1. [Yandex Cloud Console](https://console.yandex.cloud) → **SmartCaptcha** → создать капчу
2. **Разрешённые домены (allowed-sites)** — без них виджет пустой:
   - `dadatut.ru`
   - `www.dadatut.ru`
   - `localhost` **и/или** `localhost:8080` (для Vite)
3. Тип базовой проверки: **Checkbox** («Я не робот»)
4. Сохраните:
   - **Client key** → `VITE_SMARTCAPTCHA_SITE_KEY`
   - **Server key** → `SMARTCAPTCHA_SERVER_KEY`

Ошибка в консоли браузера  
`Widget with this key cannot be used in the host: localhost:8080`  
= хост не добавлен в allowed-sites.

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

- При submit: попап → `smartCaptcha.render` (checkbox) → token
- Заявки: token → `submit-lead` → `validate`
- Auth: token → edge **`verify-captcha`** → затем `signIn` / `signUp` / `resetPasswordForEmail`
- Сервер: `POST https://smartcaptcha.yandexcloud.net/validate`
- HTTP ≠ 200 от Яндекса → пользователь **не блокируется** (рекомендация Yandex)

---

## Troubleshooting

| Симптом | Что проверить |
|---------|----------------|
| Попап пустой / нет галочки | Хост в allowed-sites (`localhost:8080`); тип Checkbox |
| `cannot be used in the host` | Добавьте точный host:port в консоли SmartCaptcha |
| «Не удалось пройти проверку» | Client key; домен; сеть |
| Captcha failed на сервере | Server key; токен не старше 5 мин; одноразовость |
| Локально без captcha | Нормально, если ключи не заданы |
