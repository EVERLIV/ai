# Бэкенд ИИ-чата

Обычный Node-сервис. Не зависит от рантайма edge-функций Supabase —
именно поэтому он и появился: функции на VPS не запускались, а отладка
чужого рантайма занимала больше времени, чем свой сервис на 300 строк.

```
Браузер → Caddy (arendacity.com/api/chat) → node chat-server.mjs → Anthropic API
                                                    ↓
                                          каталог из Supabase REST
```

Ответ отдаётся построчно в формате NDJSON (`{"text":"..."}` на строку) —
фронтенду не нужен разбор SSE.

## Установка на сервере

### 1. Клонируем репозиторий

```bash
cd /opt
git clone <адрес-репозитория> arendacity
cd arendacity
```

Обновление в дальнейшем: `git pull` и `systemctl restart arendacity-chat`.

### 2. Файл с настройками

```bash
cat > /etc/arendacity-chat.env <<'ENVFILE'
ANTHROPIC_API_KEY=sk-ant-api03-<ваш-ключ>
SUPABASE_URL=https://api.arendacity.com
SUPABASE_ANON_KEY=<anon-ключ Supabase>
PORT=8787
ENVFILE
chmod 600 /etc/arendacity-chat.env
```

### 3. Служба systemd

```bash
cp server/arendacity-chat.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now arendacity-chat
systemctl status arendacity-chat
```

Логи: `journalctl -u arendacity-chat -f`

### 4. Проксирование в Caddy

В блок сайта `arendacity.com` добавьте:

```caddy
handle /api/chat* {
    reverse_proxy 127.0.0.1:8787 {
        flush_interval -1   # без буферизации, иначе ответ придёт целиком в конце
    }
}
```

Перезагрузить: `systemctl reload caddy`

### 5. Проверка

```bash
curl -s localhost:8787/health
curl -s -N -X POST https://arendacity.com/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"привет"}]}'
```

Ожидаем строки вида `{"text":"..."}` и в конце `{"done":true}`.

## Локальная разработка

```bash
ANTHROPIC_API_KEY=sk-ant-... SUPABASE_ANON_KEY=<anon> node server/chat-server.mjs
npm run dev
```

Vite проксирует `/api/chat` на `127.0.0.1:8787` (см. `vite.config.ts`).
Другой адрес бэкенда — переменная `CHAT_BACKEND_URL`.

## Что внутри

| Возможность | Детали |
|---|---|
| Модель | `claude-haiku-4-5` — самая дешёвая текстовая |
| Каталог | Только аренда, активные объекты; кэш на 5 минут |
| Защита от ботов | Honeypot, 20 запросов/мин с IP, пауза 700 мс, лимиты длины |
| Ошибки | Возвращает JSON с полем `error`; чат показывает телефон |

## Если что-то не работает

| Симптом | Что делать |
|---|---|
| `502` от Caddy | Служба не запущена: `systemctl status arendacity-chat` |
| `ANTHROPIC_API_KEY не задан` | Проверьте `/etc/arendacity-chat.env` и перезапустите службу |
| Ответ приходит целиком, а не по словам | В Caddy не задан `flush_interval -1` |
| `Каталог временно недоступен` | Неверный `SUPABASE_ANON_KEY` или недоступен `SUPABASE_URL` |
