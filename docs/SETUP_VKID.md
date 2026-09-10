# VK ID — вход через VK / OK / Mail.ru

Виджет [VK ID SDK](https://id.vk.ru/about/business/go/docs/en) на странице `/auth`.
Пакет: `@vkid/sdk` (^2.6). Edge function: **`auth-vkid`**.

---

## 1. Кабинет VK ID

1. [id.vk.ru — бизнес](https://id.vk.ru/about/business/go)
2. Приложение (App ID, например `54763350`)
3. **Trusted redirect URL:**
   - `https://dadatut.ru/auth`
   - `http://localhost:8080/auth` (локально)
4. **Базовый домен:** `https://dadatut.ru`
5. Сохраните **защищённый ключ** (client secret) — только на сервер

---

## 2. Фронтенд (`.env`)

```env
VITE_VK_ID_APP_ID=54763350
# опционально:
# VITE_AUTH_VKID_URL=https://api.arendacity.com/functions/v1/auth-vkid
```

Без `VITE_VK_ID_APP_ID` кнопки VK на `/auth` не показываются.

Пересборка:

```bash
npm run build
```

---

## 3. Сервер (self-hosted VPS)

API живёт на **api.arendacity.com** (не cloud Dashboard).  
`supabase functions deploy` в облако **не** кладёт код на VPS.

### Секреты

В `/opt/supabase/.env` и/или `/opt/supabase/volumes/functions/.env`:

```env
VK_ID_APP_ID=54763350
VK_ID_CLIENT_SECRET=<защищённый ключ>
SUPABASE_URL=https://api.arendacity.com
SUPABASE_SERVICE_ROLE_KEY=<service role>
```

`VK_ID_CLIENT_SECRET` пока **не обязателен** для user_info; service role — обязателен.

### Деплой кода функции

```bash
# на VPS, из клона репо:
bash /opt/arendacity-ai/scripts/deploy-auth-vkid.sh

# или все функции сразу:
SRC_DIR=/opt/arendacity-ai/supabase/functions bash /opt/arendacity-ai/scripts/deploy-functions.sh
```

Если видите:

```text
InvalidWorkerCreation ... could not find an appropriate entrypoint
```

— каталог `auth-vkid` пустой / нет `index.ts`. Скрипт выше это чинит.

Проверка после деплоя (ожидаем **400** `Нужен access_token`, не 500 entrypoint):

```bash
curl -sS -X POST https://api.arendacity.com/functions/v1/auth-vkid \
  -H 'Content-Type: application/json' -d '{}'
```

В `supabase/config.toml` уже есть `[functions.auth-vkid] verify_jwt = false`.

---

## 4. Поток

1. Пользователь жмёт VK / OK / Mail на `/auth`
2. SDK (`OAuthList` + `exchangeCode`) → `access_token`
3. `POST /functions/v1/auth-vkid` → проверка user_info → find/create user → `token_hash`
4. Клиент: `supabase.auth.verifyOtp({ type: 'email', token_hash })` → сессия

Новые пользователи без email в VK получают `vk{id}@users.dadatut.ru`.
При регистрации через соцсеть передаётся выбранный `account_type` (на входе — `seeker`).

---

## 5. Чеклист

- [ ] `VITE_VK_ID_APP_ID` в `.env` фронта + **rebuild/deploy** сайта
- [ ] Redirect URL в кабинете VK ID
- [ ] На VPS: `bash scripts/deploy-auth-vkid.sh` (есть `index.ts`)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` + `VK_ID_APP_ID` в env функций
- [ ] Smoke: POST без токена → 400, не entrypoint 500
- [ ] Проверка входа на `https://dadatut.ru/auth`
