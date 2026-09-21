# Очередь рассылок + cron каждые 5 минут

## Как работает

1. В админке **Рассылки** собираете письмо, выбираете шаблон.
2. **«В очередь»** — создаёт кампанию и строки `newsletter_sends` со статусом `pending` (ещё не шлёт).
3. Тумблер **«Автоотправка очереди»** — `newsletter_settings.sending_enabled`. Пока выключен, cron ничего не шлёт.
4. Cron каждые 5 минут вызывает `send-newsletter` с `mode: process_queue` и отправляет пачку (по умолчанию 25 писем).

## Миграция на VPS

```bash
cd /opt/arendacity-ai   # или ваш путь к репо
git pull
bash scripts/apply-newsletter.sh supabase/self_hosted_newsletter_queue.sql
# задеплоить обновлённый send-newsletter
SRC_DIR=/opt/arendacity-ai/supabase/functions bash scripts/deploy-functions.sh
```

## Cron

```bash
chmod +x /opt/arendacity-ai/scripts/newsletter-queue-cron.sh

# опционально /root/newsletter-cron.env:
# NOTIFY_EMAIL_SECRET=...
# NEWSLETTER_FUNCTION_URL=https://api.arendacity.com/functions/v1/send-newsletter

crontab -e
# добавить:
*/5 * * * * /opt/arendacity-ai/scripts/newsletter-queue-cron.sh >> /var/log/newsletter-queue.log 2>&1
```

Проверка вручную:

```bash
bash /opt/arendacity-ai/scripts/newsletter-queue-cron.sh
tail -20 /var/log/newsletter-queue.log
```

Ответ при выключенном тумблере: `{"skipped":"disabled",...}`.

## API modes (`send-newsletter`)

| mode | Назначение |
|------|------------|
| `enqueue` | Поставить кампанию в очередь |
| `process_queue` | Забрать pending и отправить (cron) |
| `queue_status` | pending / processing / enabled |
| `settings_get` / `settings_set` | Тумблер и batch_size |
| `preview` / `test` / `campaign` | Как раньше |

Заголовок: `x-notify-secret: $NOTIFY_EMAIL_SECRET`.
