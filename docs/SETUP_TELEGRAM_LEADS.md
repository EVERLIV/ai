# Уведомления о заявках в Telegram (Cloud Supabase)

Все формы сайта сохраняют заявку в `crm_leads` (админка → вкладка **Заявки**)
и параллельно вызывают edge-функцию `notify-lead` в облачном проекте Supabase.

## 1. Секреты Cloud Supabase

Dashboard → Project Settings → Edge Functions → Secrets:

| Secret | Значение |
|--------|----------|
| `TELEGRAM_BOT_TOKEN` | токен бота от @BotFather |
| `TELEGRAM_CHAT_ID` | id приватной группы (обычно `-100…`) |

> Токен **не коммитьте** в git. Если токен уже светился в чате/тикетах — перевыпустите его у @BotFather.

## 2. Как узнать `TELEGRAM_CHAT_ID`

1. Добавьте бота в приватную группу.
2. Сделайте бота **администратором** группы (иначе `sendMessage` в группу не пройдёт).
3. Напишите в группу любое сообщение (например «тест»).
4. Откройте в браузере:

```
https://api.telegram.org/bot<TOKEN>/getUpdates
```

5. Найдите `"chat":{"id":-100…,"title":"…"}` — это и есть `TELEGRAM_CHAT_ID`.

## 3. Деплой функции

```bash
supabase functions deploy notify-lead \
  --project-ref xbdwapunrlnxcuxjhaca \
  --no-verify-jwt
```

Или через GitHub Actions (уже добавлено в `.github/workflows/deploy.yml`
при `DEPLOY_FUNCTIONS=true`).

## 4. Проверка

```bash
curl -s -X POST \
  "https://xbdwapunrlnxcuxjhaca.supabase.co/functions/v1/notify-lead" \
  -H "Content-Type: application/json" \
  -d '{"name":"Тест","phone":"+79001234567","source":"website","message":"Проверка бота"}'
```

Ожидаем `{"ok":true}` и сообщение в группе.

## 5. Формы, которые подключены

- Контакты
- Предложить цену
- Задать вопрос (объект)
- Форма на странице объекта
- Виджет «Перезвоните мне»
- Категорийные формы (офис / склад / торговля)
- Management request из модерации
