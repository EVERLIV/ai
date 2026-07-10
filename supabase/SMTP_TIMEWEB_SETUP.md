# Настройка SMTP через Timeweb для Supabase

## Где настраивать

Supabase Dashboard → Project Settings → Auth → **SMTP Settings**

## Данные SMTP от Timeweb

Войдите в панель Timeweb → Почта → Создайте почтовый ящик (например: noreply@arendacity.com)

Затем используйте следующие настройки:

| Параметр         | Значение                        |
|------------------|---------------------------------|
| **Host**         | `smtp.timeweb.ru`               |
| **Port**         | `465` (SSL) или `587` (TLS)     |
| **Username**     | `noreply@arendacity.com`        |
| **Password**     | пароль от почтового ящика       |
| **Sender name**  | `АрендаСити`                    |
| **Sender email** | `noreply@arendacity.com`        |

## Шаги

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите проект arendacity
3. Перейдите: **Settings → Auth**
4. Прокрутите до раздела **SMTP Settings**
5. Включите тумблер **Enable Custom SMTP**
6. Заполните поля согласно таблице выше
7. Нажмите **Save**

## Проверка

После сохранения нажмите **Test SMTP** — Supabase отправит тестовое письмо.

## Шаблоны писем

Supabase Dashboard → Auth → **Email Templates**:
- **Confirm signup** — письмо при регистрации
- **Reset password** — ссылка сброса пароля (используется в /reset-password)
- **Magic Link** — вход по ссылке

Пример шаблона для сброса пароля (уже работает с `/reset-password`):
```html
<h2>Сброс пароля — АрендаСити</h2>
<p>Нажмите на кнопку ниже, чтобы задать новый пароль:</p>
<a href="{{ .ConfirmationURL }}">Сбросить пароль</a>
<p>Ссылка действует 1 час.</p>
```

## Для сброса пароля через суперадмин панель

В `/super-admin` кнопка "Сбросить пароль" вызывает `supabase.auth.resetPasswordForEmail(email)`.
Письмо отправляется через настроенный SMTP на указанный email пользователя.
Пользователь переходит по ссылке → попадает на `/reset-password` → вводит новый пароль.
