# SMTP Timeweb на VPS (self-hosted Auth)

Письма шлёт контейнер **GoTrue / auth** на сервере, не cloud Dashboard.
Нужен почтовый ящик Timeweb: `noreply@dadatut.ru` и его пароль.

## 0. На Timeweb

Панель Timeweb → Почта → ящик `noreply@dadatut.ru` существует, пароль известен.
Исходящая почта: `smtp.timeweb.ru`, порт **587** (STARTTLS) или **465** (SSL).

В панели Timeweb Cloud у VPS исходящие порты **587 и 465 не должны быть закрыты**.

## 1. Зайти на VPS

```bash
ssh root@ВАШ_СЕРВЕР
```

## 2. Найти .env и контейнер Auth

```bash
ls /opt/supabase/.env
docker ps --format '{{.Names}}' | grep -iE 'auth|gotrue|supabase'
```

Если `.env` в другом месте:

```bash
find /opt /home -name '.env' 2>/dev/null | head
```

## 3. Запустить скрипт

Скопируйте `scripts/setup-gottrue-smtp.sh` на сервер (или вставьте содержимое в `/root/setup-gottrue-smtp.sh`).

```bash
chmod +x /root/setup-gottrue-smtp.sh

# подставьте пароль ящика Timeweb
SMTP_PASS='ПАРОЛЬ_ЯЩИКА' bash /root/setup-gottrue-smtp.sh
```

Если compose лежит не в `/opt/supabase`:

```bash
SMTP_PASS='ПАРОЛЬ' ENV_FILE=/путь/.env COMPOSE_DIR=/путь bash /root/setup-gottrue-smtp.sh
```

Порт 465, если 587 не проходит:

```bash
SMTP_PORT=465 SMTP_PASS='ПАРОЛЬ' bash /root/setup-gottrue-smtp.sh
```

Скрипт:

- делает бэкап `.env`
- прописывает `GOTRUE_SMTP_*` и русские темы писем
- указывает шаблоны `https://dadatut.ru/email/*.html` (после деплоя фронта)
- перезапускает контейнер auth/gotrue

## 4. Руками (если без скрипта)

В `/opt/supabase/.env` добавьте или замените строки:

```
GOTRUE_SMTP_HOST=smtp.timeweb.ru
GOTRUE_SMTP_PORT=587
GOTRUE_SMTP_USER=noreply@arendacity.com
GOTRUE_SMTP_PASS=ПАРОЛЬ_ЯЩИКА
GOTRUE_SMTP_ADMIN_EMAIL=noreply@arendacity.com
GOTRUE_SMTP_SENDER_NAME=АрендаСити
GOTRUE_MAILER_AUTOCONFIRM=false
```

Затем:

```bash
cd /opt/supabase
docker compose restart auth
# или
docker restart $(docker ps --format '{{.Names}}' | grep -iE 'auth|gotrue' | head -1)
```

## 5. Проверка

```bash
docker logs --tail 80 $(docker ps --format '{{.Names}}' | grep -iE 'auth|gotrue' | head -1)
```

Регистрация: https://arendacity.com/auth?tab=register  

Письмо должно прийти с `noreply@arendacity.com`. Проверьте «Спам».

## Если снова тишина

1. `telnet smtp.timeweb.ru 587` — если не коннектится, откройте исходящий 587 в файрволе Timeweb.
2. Неверный пароль ящика — GoTrue пишет `535` / `authentication failed` в логах.
3. Шаблоны 404 — темы всё равно уйдут, тело может быть дефолтным, пока не задеплоен `public/email/`.
4. Gmail иногда режет письма без SPF. В DNS домена `arendacity.com` добавьте SPF Timeweb (из панели почты).
