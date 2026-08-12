# Telegram-бот: консультант по объектам + Tasker

Edge-функция: `supabase/functions/telegram-bot`

## Возможности

### 1. Консультант «Катя» по каталогу

В группе пишите свободно, начиная с имени:

- `Катя какие объекты есть в Ангарске, напишите кол-во только` → ответит числом  
- `Катя офис до 80 м² в Кировском`  
- `Катя КП на склад от 200 м²`  
- `Катя покажите задачи` / `Катя аналитика по задачам` → список и сводка из Google Sheets  
- `Катя запишите в задачи — согласовать вывеску до 14.05 задача Марии` → строка в Google Sheets  

Общается на **Вы**.

В личке можно без «Катя». Также отвечает на reply на своё сообщение.

### 2. Tasker (аналитика задач / Google Sheets)

Команды в группе / личке:

| Команда | Действие |
|---------|----------|
| `#tasker help` | справка |
| `#tasker list` | сводка из Google Sheets (или БД) |
| `#tasker csv` | таблица CSV |
| `#tasker done название` | статус done |
| `#tasker todo название` | статус todo |
| `#tasker note название \| текст` | заметка |
| `#tasker set A2 значение` | правка ячейки Sheets |
| `#tasker add A \| B \| C` | новая строка |

Подключение таблицы: см. [SETUP_GOOGLE_SHEETS_TASKER.md](./SETUP_GOOGLE_SHEETS_TASKER.md)

## Секреты Cloud Supabase

| Secret | Описание |
|--------|----------|
| `TELEGRAM_BOT_TOKEN` | токен бота |
| `TELEGRAM_CHAT_ID` | id рабочей группы |
| `ANTHROPIC_API_KEY` | ключ Claude |
| `CATALOG_URL` | `https://api.arendacity.com` |
| `CATALOG_ANON_KEY` | anon-ключ каталога |
| `SITE_URL` | `https://arendacity.com` |
| `TELEGRAM_WEBHOOK_SECRET` | произвольная строка защиты webhook |

## Деплой

```bash
supabase functions deploy telegram-bot \
  --project-ref xbdwapunrlnxcuxjhaca \
  --no-verify-jwt
```

## Webhook

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://xbdwapunrlnxcuxjhaca.supabase.co/functions/v1/telegram-bot?secret=<SECRET>"
```

Проверка:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```
