# Telegram-бот для агентств — деплой

Отдельный бот шлёт уведомления **только в группу привязанного агентства**:

- **Заявки** — формы на объектах с `properties.agency_id`
- **Просмотры** — открытие карточки объекта на сайте

Модерацию выполняет администратор сайта — агентствам об этом **не** уведомляем.

Ops-бот (`TELEGRAM_CHAT_ID` в `notify-lead`) по-прежнему получает **все** заявки для внутренней команды.

---

## Что входит в деплой

| Компонент | Файлы |
|-----------|--------|
| **SQL** | `supabase/migrations/20260822_agency_telegram.sql` (cloud) или `supabase/self_hosted_agency_telegram.sql` (VPS) |
| **Edge functions** | `agency-telegram-bot`, `agency-notify`, `track-property-view`, `notify-lead` (обновлён) |
| **Shared-модуль** | `supabase/functions/_shared/agencyTelegram.ts` — **обязателен** на self-hosted |

---

## 1. Создать бота в Telegram

1. Откройте [@BotFather](https://t.me/BotFather) → `/newbot`
2. Имя, например: `АрендаСити Агентства`
3. Username, например: `ArendaCityAgencyBot`
4. Сохраните **токен** (`AGENCY_TELEGRAM_BOT_TOKEN`)

Это **отдельный** бот, не путать с ops-ботом заявок (`TELEGRAM_BOT_TOKEN`).

---

## 2. Секреты (переменные окружения)

Сгенерируйте две случайные строки (32+ символа), например:

```bash
openssl rand -hex 24   # AGENCY_TELEGRAM_WEBHOOK_SECRET
openssl rand -hex 24   # AGENCY_NOTIFY_INTERNAL_SECRET
```

| Переменная | Где нужна | Описание |
|------------|-----------|----------|
| `AGENCY_TELEGRAM_BOT_TOKEN` | Edge functions | Токен бота агентств |
| `AGENCY_TELEGRAM_WEBHOOK_SECRET` | Edge functions | Защита webhook (`?secret=...`) |
| `AGENCY_NOTIFY_INTERNAL_SECRET` | Edge functions | Вызов `agency-notify` из `notify-lead` / `track-property-view` |
| `SUPABASE_URL` | Edge functions | URL API БД, на VPS: `https://api.arendacity.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge functions | Service role (только на сервере!) |
| `SITE_URL` | Edge functions | Публичный сайт, напр. `https://arendacity.com` |
| `TELEGRAM_BOT_TOKEN` | `notify-lead` | Ops-бот (все заявки) — уже должен быть |
| `TELEGRAM_CHAT_ID` | `notify-lead` | Группа ops-команды — уже должна быть |

Для **ops-бота** см. [SETUP_TELEGRAM_LEADS.md](./SETUP_TELEGRAM_LEADS.md).

---

# Вариант A: Cloud Supabase

## A.1. Миграция БД

```bash
supabase db push
```

Или в Dashboard → SQL → выполнить содержимое `supabase/migrations/20260822_agency_telegram.sql`.

**Предусловие:** таблица `public.agencies` уже существует.

## A.2. Секреты

Dashboard → **Project Settings → Edge Functions → Secrets** — добавить переменные из таблицы выше.

## A.3. Деплой функций

```bash
supabase functions deploy agency-telegram-bot --project-ref <PROJECT_REF> --no-verify-jwt
supabase functions deploy agency-notify --project-ref <PROJECT_REF> --no-verify-jwt
supabase functions deploy track-property-view --project-ref <PROJECT_REF> --no-verify-jwt
supabase functions deploy notify-lead --project-ref <PROJECT_REF> --no-verify-jwt
```

`verify_jwt = false` уже прописан в `supabase/config.toml` для этих функций.

## A.4. Webhook Telegram

```bash
curl -G "https://api.telegram.org/bot<AGENCY_TELEGRAM_BOT_TOKEN>/setWebhook" \
  --data-urlencode "url=https://<PROJECT_REF>.supabase.co/functions/v1/agency-telegram-bot?secret=<AGENCY_TELEGRAM_WEBHOOK_SECRET>"
```

Проверка:

```bash
curl "https://api.telegram.org/bot<AGENCY_TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

---

# Вариант B: Self-hosted (VPS, api.arendacity.com)

> **Важно:** сайт и каталог работают с БД **`https://api.arendacity.com`**, не с cloud-проектом `xbdwapunrlnxcuxjhaca`.  
> Все SQL, секреты и edge functions для бота агентств настраиваются **на VPS**.

---

## Self-hosted: подробная инструкция

### Шаг 0. Что должно быть уже готово

| # | Проверка | Как убедиться |
|---|----------|----------------|
| 1 | Self-hosted Supabase запущен | `docker ps` на VPS — контейнеры `supabase-db`, `supabase-edge-functions`, `supabase-kong` |
| 2 | API открывается | `curl -s https://api.arendacity.com/rest/v1/ -H "apikey: <anon>"` — не 502 |
| 3 | Таблица `agencies` есть | Studio → Table Editor → `agencies` (или SQL ниже) |
| 4 | Ops-бот заявок (опционально) | [SETUP_TELEGRAM_LEADS.md](./SETUP_TELEGRAM_LEADS.md) — `TELEGRAM_BOT_TOKEN` в `.env` |

Если `agencies` нет — сначала выполните **`supabase/self_hosted_agencies.sql`** в SQL Editor.

```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'agencies'
);
```

---

### Шаг 1. Бот в Telegram (@BotFather)

1. Telegram → [@BotFather](https://t.me/BotFather)
2. `/newbot` → имя «АрендаСити Агентства» → username `ArendaCityAgencyBot` (или свой)
3. Скопируйте **HTTP API Token** — это `AGENCY_TELEGRAM_BOT_TOKEN`
4. На локальной машине или VPS сгенерируйте секреты:

```bash
openssl rand -hex 24   # → AGENCY_TELEGRAM_WEBHOOK_SECRET
openssl rand -hex 24   # → AGENCY_NOTIFY_INTERNAL_SECRET
```

Запишите все три значения в блокнот (понадобятся в шагах 3 и 7).

---

### Шаг 2. SQL в Supabase Studio (консоль БД)

#### 2.1. Открыть Studio

Self-hosted Studio — веб-интерфейс к вашей Postgres. Обычно:

- URL вроде `https://studio.arendacity.com`, или
- порт на VPS (смотрите `docker compose ps` / nginx), или
- SSH-туннель: `ssh -L 3000:127.0.0.1:3000 user@vps` → `http://localhost:3000`

Войдите под паролем Studio (задаётся при установке Supabase на VPS).

#### 2.2. Выполнить миграцию Telegram

1. Слева: **SQL Editor** (иконка `</>`)
2. **New query**
3. Откройте в репозитории файл [`supabase/self_hosted_agency_telegram.sql`](../supabase/self_hosted_agency_telegram.sql)
4. **Скопируйте весь текст** → вставьте в редактор
5. **Run** (или Ctrl+Enter)
6. Внизу должно быть **Success** / без красных ошибок

Скрипт идempotentный (`IF NOT EXISTS`) — повторный запуск безопасен.

**Альтернатива — с VPS через psql:**

```bash
ssh user@your-vps
cd /path/to/ai
docker exec -i supabase-db psql -U postgres -d postgres \
  < supabase/self_hosted_agency_telegram.sql
```

(имя контейнера БД может отличаться — проверьте `docker ps | grep db`)

#### 2.3. Проверка в SQL Editor

Выполните отдельным запросом:

```sql
-- Колонки Telegram в agencies
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agencies'
  AND column_name LIKE 'telegram%'
ORDER BY column_name;

-- Таблица просмотров
SELECT COUNT(*) AS crm_events_exists
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'crm_events';
```

Ожидаем **9 колонок** `telegram_*` и **1 строку** для `crm_events`.

#### 2.4. Table Editor (визуально)

1. **Table Editor** → таблица **`agencies`**
2. Прокрутите колонки вправо — должны появиться:
   - `telegram_enabled`, `telegram_chat_id`, `telegram_connect_code`, …
3. Таблица **`crm_events`** — пустая, это нормально

---

### Шаг 3. Ключи API (anon / service_role)

Edge functions читают объекты через **service role**. Ключи лежат на VPS, **не** в cloud Dashboard.

```bash
ssh user@your-vps
grep -E '^(ANON_KEY|SERVICE_ROLE_KEY|JWT_SECRET)=' /opt/supabase/.env
```

Или в вашем docker `.env`:

| Переменная в `.env` VPS | Для чего |
|-------------------------|----------|
| `ANON_KEY` | Фронт (`VITE_SUPABASE_PUBLISHABLE_KEY`) |
| `SERVICE_ROLE_KEY` | Edge functions (`SUPABASE_SERVICE_ROLE_KEY`) |

**Service role никому не отдавайте** — только в `/opt/supabase/.env` на сервере.

---

### Шаг 4. Секреты edge functions (`/opt/supabase/.env`)

```bash
ssh user@your-vps
sudo nano /opt/supabase/.env
```

Добавьте или обновите блок (подставьте свои значения):

```env
# === Бот агентств ===
AGENCY_TELEGRAM_BOT_TOKEN=7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AGENCY_TELEGRAM_WEBHOOK_SECRET=a1b2c3d4e5f6...   # из openssl rand -hex 24
AGENCY_NOTIFY_INTERNAL_SECRET=f6e5d4c3b2a1...   # другая строка

# === Уже должны быть (проверьте) ===
SUPABASE_URL=https://api.arendacity.com
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
SITE_URL=https://arendacity.com

# Ops-бот (все заявки в команду)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=-1001234567890
```

Сохраните (`Ctrl+O`, Enter, `Ctrl+X`).

```bash
chmod 600 /opt/supabase/.env
```

Проверка, что строки на месте:

```bash
grep -E '^AGENCY_|^SUPABASE_URL=|^SITE_URL=|^TELEGRAM_' /opt/supabase/.env
```

---

### Шаг 5. Залить edge functions на VPS

Functions — это **файлы на диске**, не кнопка в Studio. Cloud `supabase functions deploy` на self-hosted **не используется**.

#### 5.1. Обновить код на сервере

```bash
ssh user@your-vps
cd /path/to/ai          # каталог git-клона проекта
git pull                # или scp/rsync папки supabase/functions
```

#### 5.2. Запустить скрипт деплоя

```bash
bash scripts/deploy-functions.sh
```

Скрипт копирует в `/opt/supabase/volumes/functions/`:

| Каталог | Назначение |
|---------|------------|
| `agency-telegram-bot/` | Webhook: `/connect`, `/status` |
| `agency-notify/` | Отправка в Telegram-группу агентства |
| `track-property-view/` | Просмотры карточки + уведомление |
| `notify-lead/` | Заявки → ops + маршрутизация агентству |
| `_shared/` | Общий модуль `agencyTelegram.ts` — **обязателен** |

Если каталог functions другой:

```bash
docker inspect supabase-edge-functions \
  --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{println}}{{end}}'
SUPABASE_FUNCTIONS_DIR=/найденный/путь bash scripts/deploy-functions.sh
```

#### 5.3. Перезапустить контейнер functions

Скрипт делает `docker compose restart functions`. Или вручную:

```bash
cd /opt/supabase
docker compose up -d functions
sleep 3
docker compose logs --tail=30 functions
```

#### 5.4. Проверка файлов внутри контейнера

```bash
docker exec supabase-edge-functions ls -1 /home/deno/functions/
docker exec supabase-edge-functions test -f /home/deno/functions/_shared/agencyTelegram.ts \
  && echo "OK: _shared на месте" || echo "ОШИБКА: нет _shared"
```

Должны быть: `agency-telegram-bot`, `agency-notify`, `track-property-view`, `notify-lead`, `_shared`.

---

### Шаг 6. Проверка functions через curl (до Telegram)

Подставьте реальный UUID объекта **с** `agency_id`:

```sql
-- в Studio SQL Editor: найти тестовый объект агентства
SELECT id, address, agency_id
FROM public.properties
WHERE agency_id IS NOT NULL AND moderation_status = 'published'
LIMIT 1;
```

**track-property-view:**

```bash
curl -s -X POST "https://api.arendacity.com/functions/v1/track-property-view" \
  -H "Content-Type: application/json" \
  -d '{"property_id":"<UUID>"}'
```

Ожидаем: `{"ok":true,"views_count":...,"notified":false}` — `notified:true` только после `/connect` в группе.

**notify-lead:**

```bash
curl -s -X POST "https://api.arendacity.com/functions/v1/notify-lead" \
  -H "Content-Type: application/json" \
  -d '{"name":"Тест","phone":"+79001234567","source":"property_contact","object_id":"<UUID>"}'
```

Ожидаем: `{"ok":true}` и сообщение в ops-группе.

Если **404** на `/functions/v1/...` — nginx не проксирует на edge functions (настройте как для `ai-chat`, см. [SETUP_ANTHROPIC_KEY.md](./SETUP_ANTHROPIC_KEY.md)).

---

### Шаг 7. Webhook Telegram → ваш VPS

С локальной машины (подставьте token и secret из шага 1):

```bash
curl -G "https://api.telegram.org/bot<AGENCY_TELEGRAM_BOT_TOKEN>/setWebhook" \
  --data-urlencode "url=https://api.arendacity.com/functions/v1/agency-telegram-bot?secret=<AGENCY_TELEGRAM_WEBHOOK_SECRET>"
```

Ответ: `{"ok":true,"result":true,...}`

Проверка:

```bash
curl -s "https://api.telegram.org/bot<TOKEN>/getWebhookInfo" | python -m json.tool
```

В `url` должен быть `api.arendacity.com/.../agency-telegram-bot?secret=...`, `last_error_message` — пусто.

---

### Шаг 8. Фронтенд (чтобы формы били в VPS, не в cloud)

В CI / `.env.production` / секретах сборки:

```env
VITE_SUPABASE_URL=https://api.arendacity.com
VITE_SUPABASE_PUBLISHABLE_KEY=<ANON_KEY с VPS>

VITE_NOTIFY_LEAD_URL=https://api.arendacity.com/functions/v1/notify-lead
VITE_TRACK_PROPERTY_VIEW_URL=https://api.arendacity.com/functions/v1/track-property-view

VITE_AGENCY_BOT_USERNAME=ArendaCityAgencyBot
```

Локально для проверки — скопируйте в `.env`, перезапустите `npm run dev`.

Сборка и деплой:

```bash
npm run build
# выложить dist/ на arendacity.com
```

Без `VITE_NOTIFY_LEAD_URL` заявки по умолчанию уходят в **cloud** URL — бот на VPS их не увидит.

---

### Шаг 9. Подключить агентство (сайт + Telegram)

1. **Сайт** → кабинет агентства → **Telegram**
2. Узнать **ID группы** (бот @getmyid_bot в группе или getUpdates)
3. Вставить ID → **Сохранить ID чата**
4. Добавить `@ArendaCityAgencyBot` в группу, сделать **администратором**
5. Включить «Вкл.» и переключатели **Заявки** / **Просмотры**

#### Проверка в Studio

```sql
SELECT id, name, telegram_enabled, telegram_chat_id, telegram_chat_title
FROM public.agencies
WHERE telegram_chat_id IS NOT NULL;
```

#### Финальный тест

1. Открыть объект агентства на сайте → «👁 Просмотр» в группе
2. Отправить заявку с карточки → «📩 Новая заявка» в группе + ops-группа

> Webhook Telegram **не обязателен** для уведомлений — они уходят через Bot API. Webhook нужен только для `/status` и `/help` в группе.

---

### Шаг 10. Частые ошибки (self-hosted)

| Симптом | Решение |
|---------|---------|
| SQL: `relation "agencies" does not exist` | Сначала `self_hosted_agencies.sql` |
| SQL: `function has_role does not exist` | Выполнить миграции ролей админки |
| `/functions/v1/...` → 404 | nginx → контейнер `functions` |
| `worker boot error` | Нет `_shared/` — `bash scripts/deploy-functions.sh` |
| `/connect` — тишина | `getWebhookInfo`, secret в URL, бот админ |
| Заявки только в ops, не в агентстве | У объекта `agency_id`; группа подключена |
| Просмотры не идут | `VITE_TRACK_PROPERTY_VIEW_URL` на VPS + rebuild |
| Переменные не подхватились | `docker compose up -d functions` после правки `.env` |

Логи:

```bash
cd /opt/supabase && docker compose logs -f functions
```

---

## B.1–B.6 (краткая шпаргалка)

<details>
<summary>Развернуть краткий чеклист</summary>

**B.1** — `self_hosted_agencies.sql` уже выполнен  
**B.2** — `self_hosted_agency_telegram.sql` в SQL Editor  
**B.3** — секреты в `/opt/supabase/.env` + `docker compose up -d functions`  
**B.4** — `bash scripts/deploy-functions.sh`  
**B.5** — `setWebhook` на `api.arendacity.com/functions/v1/agency-telegram-bot?secret=...`  
**B.6** — фронт с `VITE_NOTIFY_LEAD_URL` и `VITE_TRACK_PROPERTY_VIEW_URL` на VPS

</details>

---
## 3. Подключение агентства

1. Кабинет → **Telegram** → вписать **ID группы/канала** → **Сохранить ID чата**
2. Добавить `@ArendaCityAgencyBot` в группу, сделать **администратором**
3. Включить «Вкл.», **Новые заявки**, **Просмотры**
4. Тест: открыть объект агентства / заявка с карточки

### Команды бота (опционально, нужен webhook)

| Команда | Действие |
|---------|----------|
| `/status` | Статус уведомлений |
| `/help` | Справка |

---

## 4. Проверка API (curl)

### track-property-view

```bash
curl -s -X POST "https://api.arendacity.com/functions/v1/track-property-view" \
  -H "Content-Type: application/json" \
  -d '{"property_id":"<UUID объекта с agency_id>"}'
```

Ожидаем: `{"ok":true,"views_count":...,"notified":true}` (если бот подключён и объект агентства).

### notify-lead (заявка)

```bash
curl -s -X POST "https://api.arendacity.com/functions/v1/notify-lead" \
  -H "Content-Type: application/json" \
  -d '{"name":"Тест","phone":"+79001234567","source":"property_contact","object_id":"<UUID>"}'
```

Ожидаем: `{"ok":true}` + сообщение в ops-группе; в группе агентства — только если у объекта есть `agency_id`.

### agency-telegram-bot (webhook)

Telegram шлёт POST сам. Ручная проверка — через `/connect` в группе после настройки webhook.

---

## 5. Изоляция и маршрутизация

```
Форма на сайте
    → notify-lead → ops Telegram (все заявки)
                 → agency-notify (только если properties.agency_id задан)

Открытие карточки
    → track-property-view → crm_events + счётчик views_count
                         → agency-notify (только agency_id)

/connect в группе
    → agency-telegram-bot → agencies.telegram_chat_id
```

- Одна Telegram-группа = одно агентство (`UNIQUE(telegram_chat_id)`)
- Частные объявления (без `agency_id`) в бот агентства **не попадают**

---

## 6. Troubleshooting

| Симптом | Что проверить |
|---------|----------------|
| `/connect` молчит | Webhook: `getWebhookInfo`, URL с `?secret=`, бот админ группы |
| Заявки не в группе агентства | `properties.agency_id` у объекта; `telegram_enabled=true`; toggles в кабинете |
| Просмотры не считаются | `VITE_TRACK_PROPERTY_VIEW_URL` на self-hosted URL; функция задеплоена |
| `worker boot error` в логах | Нет каталога функции или `_shared` — `bash scripts/deploy-functions.sh` |
| Заявки уходят в cloud | На фронте не задан `VITE_NOTIFY_LEAD_URL` — пересобрать с VPS URL |
| `403` на agency-notify | `AGENCY_NOTIFY_INTERNAL_SECRET` не совпадает между функциями |
| Ошибка RLS / crm_events | Повторно выполнить `self_hosted_agency_telegram.sql` |

Логи функций на VPS:

```bash
cd /opt/supabase && docker compose logs -f functions
```

---

## 7. Cloud vs Self-hosted — кратко

| Шаг | Cloud | Self-hosted |
|-----|-------|-------------|
| SQL | `supabase db push` | `self_hosted_agency_telegram.sql` в SQL Editor |
| Секреты | Dashboard → Edge Functions | `/opt/supabase/.env` + restart functions |
| Functions | `supabase functions deploy ...` | `bash scripts/deploy-functions.sh` |
| Webhook URL | `*.supabase.co/functions/v1/...` | `api.arendacity.com/functions/v1/...` |
| Фронт | Cloud URL по умолчанию | `VITE_NOTIFY_LEAD_URL`, `VITE_TRACK_PROPERTY_VIEW_URL` |
