# Яндекс SmartCaptcha — защита заявок (РФ)

Публичные формы заявок идут через edge function **`submit-lead`**:

1. **Honeypot** — скрытое поле (боты заполняют, люди нет)
2. **Яндекс SmartCaptcha** (invisible) — проверка в Yandex Cloud (данные в РФ)

Замена Google reCAPTCHA v3 для локализации / 152-ФЗ.

Документация: https://yandex.cloud/docs/smartcaptcha/

---

## 1. Создать ключи в Yandex Cloud

1. [Yandex Cloud Console](https://console.yandex.cloud) → **SmartCaptcha** → создать капчу
2. Домены: `dadatut.ru`, `www.dadatut.ru`, `localhost`
3. Режим: **Invisible** (невидимая)
4. Сохраните:
   - **Client key** → `VITE_SMARTCAPTCHA_SITE_KEY`
   - **Server key** → `SMARTCAPTCHA_SERVER_KEY`

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
# на VPS
bash scripts/set-smartcaptcha-secret.sh
# или
SMARTCAPTCHA_SERVER_KEY='...' bash scripts/set-smartcaptcha-secret.sh
```

Затем: `bash scripts/deploy-functions.sh` (чтобы подтянуть `_shared/recaptcha.ts`).

---

## 4. Как это работает

- Пакет: `@yandex/smart-captcha` → компонент `InvisibleSmartCaptcha`
- При отправке формы / Auth: `visible` → token → `captcha_token` / `verify-captcha`
- Сервер: `POST https://smartcaptcha.yandexcloud.net/validate`
- HTTP ≠ 200 от Яндекса → заявка **не блокируется** (рекомендация Yandex)

### Auth (вход / регистрация / сброс пароля)

Перед `signIn` / `signUp` / `resetPasswordForEmail` клиент:
1. получает token SmartCaptcha;
2. вызывает edge function **`verify-captcha`**;
3. только при `ok` продолжает Auth.

Деплой функции: `bash scripts/deploy-functions.sh` (нужен каталог `verify-captcha` на VPS).

---

## Troubleshooting

| Симптом | Что проверить |
|---------|----------------|
| «Подтвердите, что вы не робот» | Client key в сборке; домен в консоли SmartCaptcha |
| Captcha failed на сервере | Server key; токен не старше 5 мин; одноразовость |
| Локально без captcha | Нормально, если ключи не заданы |
