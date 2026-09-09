# Безопасность VPS (152-ФЗ / Приказ ФСТЭК № 21 — операторский минимум)

Живой сервер из репозитория **не трогаем**. Скрипты копируете на VPS и запускаете сами.

Связанные документы: [SETUP_DNS_TIMEWEB.md](SETUP_DNS_TIMEWEB.md), [SETUP_BACKUPS_S3.md](SETUP_BACKUPS_S3.md), [FZ152_STACK.md](FZ152_STACK.md).

## TLS

API: [`scripts/nginx-api-acme.conf`](../scripts/nginx-api-acme.conf) — TLS 1.2/1.3 и HSTS.

На VPS:

```bash
sudo cp scripts/nginx-api-acme.conf /etc/nginx/sites-available/api.arendacity.com
sudo nginx -t && sudo systemctl reload nginx
```

КриптоПро / ГОСТ — только при требованиях УЗ-1/УЗ-2 и госорганов. Сейчас не ставим.

Фронт `dadatut.ru`: TLS Let's Encrypt в Timeweb App Platform.

## Закрыть Kong на :8000 (обязательно)

Сейчас Docker часто публикует Kong как `0.0.0.0:8000` — с интернета открыто `http://72.56.247.221:8000` в обход TLS.

**Нельзя** спрятать `https://api.arendacity.com`: фронт ходит туда за каталогом и Auth. Прячем только «голый» Kong и доступ по IP.

Скрипт: [`scripts/lock-kong-localhost.sh`](../scripts/lock-kong-localhost.sh)

```bash
bash scripts/lock-kong-localhost.sh
APPLY=1 bash scripts/lock-kong-localhost.sh
```

После этого:

- `https://api.arendacity.com` — да (nginx → 127.0.0.1:8000)
- `http://72.56.247.221:8000` — нет
- `http://72.56.247.221` без имени хоста — nginx `return 444` (см. `nginx-api-acme.conf`)

В панели Timeweb Cloud → Firewall VPS: запретить входящие **8000, 8443, 8001**; оставить **22, 80, 443**.

## SSH только по ключу

Скрипт: [`scripts/harden-ssh.sh`](../scripts/harden-ssh.sh).

1. Положите свой pubkey в `/root/.ssh/authorized_keys` (или пользователя с sudo).
2. Dry-run: `bash scripts/harden-ssh.sh`
3. На VPS: `APPLY=1 bash scripts/harden-ssh.sh`
4. Проверьте вход **новой** сессией, не закрывая текущую.

Панель Timeweb Cloud: включите 2FA (TOTP) на аккаунт. MFA в React-кабинете сайта в этом заходе не делаем.

## LUKS (шифрованный диск)

Включайте **при создании новой VDS**, на этапе установки ОС (Timeweb: шифрование диска / LUKS).

На уже работающем корневом диске LUKS без миграции на новый том — риск потери данных. В этот заход **не** перешифровываем текущий VPS.

Чувствительные поля в Postgres (`pgcrypto`) — опциональное усиление поверх диска; бэкапы всё равно шифруйте перед S3.

## Журналы не менее 6 месяцев

Минимум на этой же VDS (отдельный том желателен):

`/etc/systemd/journald.conf.d/retention.conf`:

```
[Journal]
Storage=persistent
MaxRetentionSec=6month
SystemMaxUse=4G
```

Затем `systemctl restart systemd-journald`.

Дополнительно ротация nginx (`/var/log/nginx`) и docker:

```bash
docker compose -f /opt/supabase/docker-compose.yml logs --no-color auth db 2>/dev/null | gzip
```

Целевая схема (следующий этап, не деплоим сейчас): Vector или Fluent Bit → ClickHouse на **второй** VDS в РФ, изоляция от каталога.

## Проверка

- `nmap --script ssl-enum-ciphers -p 443 api.arendacity.com` — только TLS 1.2/1.3
- `ssh -o PreferredAuthentications=password` — отказ
- объект `.enc` в бакете Timeweb S3 после тестового бэкапа
