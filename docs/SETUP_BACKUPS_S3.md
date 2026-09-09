# Зашифрованные бэкапы Postgres → Timeweb S3

База self-hosted Supabase на VPS в РФ. Архив шифруется **до** отправки в объектное хранилище Timeweb (ЦОД РФ).

Скрипт: [`scripts/backup-postgres-s3.sh`](../scripts/backup-postgres-s3.sh). Не коммитьте ключи и пароль.

## 1. Бакет

Timeweb Cloud → S3 → бакет в регионе РФ. Access key / secret — только на сервере.

## 2. Файл секретов на VPS

`/root/backup-s3.env` (права `600`):

```bash
export BACKUP_PASSPHRASE='длинная-фраза'
export S3_ENDPOINT='https://s3.timeweb.cloud'
export S3_BUCKET='arendacity-pg-backups'
export S3_ACCESS_KEY='...'
export S3_SECRET_KEY='...'
# export CONTAINER=supabase-db
# export PG_DUMP_URI='postgresql://postgres:...@127.0.0.1:5432/postgres'
# export RETAIN_DAYS=30
```

Расшифровка архива (на доверенной машине):

```bash
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -in pgdump-....sql.gz.enc -out pgdump.sql.gz -pass env:BACKUP_PASSPHRASE
```

## 3. Прогон вручную

```bash
chmod +x /opt/arendacity/scripts/backup-postgres-s3.sh
. /root/backup-s3.env
bash /opt/arendacity/scripts/backup-postgres-s3.sh
```

Нужен `aws` CLI (`aws s3 cp --endpoint-url`) или `s3cmd`. Контейнер Postgres по умолчанию `supabase-db`.

## 4. Cron (ежедневно)

```cron
15 3 * * * . /root/backup-s3.env && /opt/arendacity/scripts/backup-postgres-s3.sh >> /var/log/pg-backup.log 2>&1
```

`RETAIN_DAYS=30` удаляет старые объекты в префиксе (если установлен `aws`). Срок хранения логов — отдельно, см. [SETUP_VPS_SECURITY.md](SETUP_VPS_SECURITY.md).
