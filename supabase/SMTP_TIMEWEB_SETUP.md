# Настройка SMTP через Timeweb для Supabase

## Где настраивать

Self-hosted VPS: `/opt/supabase/.env` (GoTrue) и секреты Edge Functions.

## Данные SMTP от Timeweb

Timeweb → Почта → ящик **`noreply@dadatut.ru`**

| Параметр         | Значение                 |
|------------------|--------------------------|
| **Host**         | `smtp.timeweb.ru`        |
| **Port**         | `465` (SSL) или `587`    |
| **Username**     | `noreply@dadatut.ru`     |
| **Password**     | пароль ящика             |
| **Sender name**  | `ДАДАТУТ`                |
| **Sender email** | `noreply@dadatut.ru`     |

## VPS (GoTrue)

```bash
SMTP_PASS='пароль' bash scripts/setup-gotrue-smtp.sh
```

Шаблоны: `https://dadatut.ru/email/*.html` (папка `public/email/` после деплоя).

## Edge Functions

Секреты для `send-agency-invite` и `notify-property-email`:

- `SMTP_HOST=smtp.timeweb.ru`
- `SMTP_PORT=587`
- `SMTP_USER=noreply@dadatut.ru`
- `SMTP_PASS=…`
- `SMTP_FROM=noreply@dadatut.ru`
- `SMTP_FROM_NAME=ДАДАТУТ`
- `SITE_URL=https://dadatut.ru` (ссылки в письмах)

## Шаблоны

HTML в `public/email/` и `supabase/email-templates/`. Обновление:

```bash
node scripts/sync-email-templates.mjs
```

Палитра: бордовый `#8B0015`, фон `#FBFAF7` — как на сайте ДАДАТУТ.
