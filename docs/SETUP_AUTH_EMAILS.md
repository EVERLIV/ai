# Регистрация, письма и подтверждение аккаунта

Auth идёт через **self-hosted Supabase** (`https://api.arendacity.com`) — не через cloud ARENA CITY.

Письма всегда инициирует контейнер **GoTrue (Auth)** на VPS. Это не «облачный SMTP Dashboard».
Дальше два варианта транспорта:

1. **Настроен SMTP** в `/opt/supabase/.env` (`GOTRUE_SMTP_HOST=smtp.timeweb.ru` и т.д.) → GoTrue отдаёт письмо Timeweb → ящик клиента.
2. **SMTP не задан** → self-hosted шлёт во встроенный Inbucket / письмо не уходит (часто таймаут 504 при регистрации).

Cloud Dashboard → Custom SMTP влияет только на проект `xbdwapunrlnxcuxjhaca`, **не** на `api.arendacity.com`.

Пошаговая настройка SMTP на VPS: [SETUP_VPS_SMTP.md](./SETUP_VPS_SMTP.md), скрипт `scripts/setup-gottrue-smtp.sh`.

Проверка на VPS:

```bash
grep -E 'GOTRUE_SMTP_|GOTRUE_MAILER_' /opt/supabase/.env
```

Если письмо не пришло (пример: `followtherabbit1080@gmail.com`): чаще всего SMTP на VPS не настроен или Auth зависает на отправке. Фронт раньше показывал «письмо отправлено» даже при ошибке 504 — так больше не делаем.

## Как это работает сейчас

```
Регистрация (/auth?tab=register)
  → supabase.auth.signUp({ email, password, data: { full_name, phone, account_type… } })
  → emailRedirectTo = https://arendacity.com/auth
  → GoTrue создаёт пользователя (email_confirmed_at = null)
  → GoTrue пытается отправить Confirm signup (SMTP, если задан)
  → экран «Почти готово! Проверьте почту»

Клик по ссылке в письме
  → {{ .ConfirmationURL }} → /auth#type=signup
  → email_confirmed_at заполняется
  → тост «Email подтверждён»

Вход
  → signInWithPassword
  → если email не подтверждён и confirmations=true — вход может быть запрещён

Сброс пароля (/reset-password)
  → resetPasswordForEmail(redirectTo=/reset-password)
  → письмо Recovery
  → /reset-password#type=recovery → updateUser({ password })

Суперадмин (/super-admin)
  → может вручную «Подтвердить email» (email_confirm: true)
  → или отправить письмо сброса / задать пароль
```

В `supabase/config.toml`:

- `enable_signup = true`
- `enable_confirmations = true` — без письма кабинет не активируется
- `double_confirm_changes = true` — смена email подтверждается на старый и новый адрес

## Шаблоны (русский)

Файлы в `supabase/email-templates/`:

| Файл | Шаблон в Dashboard / GoTrue | Тема письма |
|------|-----------------------------|-------------|
| `confirm.html` | Confirm signup | Подтвердите аккаунт — АрендаСити |
| `recovery.html` | Reset password | Сброс пароля — АрендаСити |
| `magic_link.html` | Magic Link | Вход в кабинет — АрендаСити |
| `invite.html` | Invite user | Приглашение в АрендаСити |
| `email_change.html` | Change email address | Подтвердите новый email — АрендаСити |
| `reauthentication.html` | Reauthentication | Код подтверждения — АрендаСити |

Переменные GoTrue: `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .Token }}`.

## Куда вставить

### Вариант A — Cloud Dashboard (если письма идут из ARENA CITY)

Authentication → Email Templates → вставить HTML и тему из таблицы.

SMTP: Settings → Auth → Custom SMTP (см. `supabase/SMTP_TIMEWEB_SETUP.md`).

### Вариант B — self-hosted VPS (`/opt/supabase/.env`)

Темы:

```
GOTRUE_MAILER_SUBJECTS_CONFIRMATION=Подтвердите аккаунт — АрендаСити
GOTRUE_MAILER_SUBJECTS_RECOVERY=Сброс пароля — АрендаСити
GOTRUE_MAILER_SUBJECTS_MAGIC_LINK=Вход в кабинет — АрендаСити
GOTRUE_MAILER_SUBJECTS_INVITE=Приглашение в АрендаСити
GOTRUE_MAILER_SUBJECTS_EMAIL_CHANGE=Подтвердите новый email — АрендаСити
GOTRUE_MAILER_SUBJECTS_REAUTHENTICATION=Код подтверждения — АрендаСити
```

Шаблоны — URL на HTML (или путь, если GoTrue отдаёт файлы). Проще положить файлы на сайт и указать:

```
GOTRUE_MAILER_TEMPLATES_CONFIRMATION=https://arendacity.com/email/confirm.html
GOTRUE_MAILER_TEMPLATES_RECOVERY=https://arendacity.com/email/recovery.html
GOTRUE_MAILER_TEMPLATES_MAGIC_LINK=https://arendacity.com/email/magic_link.html
GOTRUE_MAILER_TEMPLATES_INVITE=https://arendacity.com/email/invite.html
GOTRUE_MAILER_TEMPLATES_EMAIL_CHANGE=https://arendacity.com/email/email_change.html
GOTRUE_MAILER_TEMPLATES_REAUTHENTICATION=https://arendacity.com/email/reauthentication.html
```

После правок `.env` перезапустить контейнер `auth` / `gotrue`.

## Проверка

1. Зарегистрировать тестовый ящик → письмо «Подтвердите аккаунт».
2. Клик → `/auth`, вход работает.
3. «Сброс пароля» → письмо → новый пароль.
4. В суперадмине у пользователя `confirmed = да`.
