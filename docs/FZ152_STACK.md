# Стек и 152-ФЗ

Кратко: где данные граждан РФ и что ещё открыто.

## Локализация баз (ч. 5 ст. 18 152-ФЗ)

| Компонент | Где | Статус |
|-----------|-----|--------|
| Каталог, профили, заявки, Auth (GoTrue) | Self-hosted Supabase на VPS Timeweb (ЦОД РФ), `api.arendacity.com` | Локализация БД закрыта этим контуром |
| Фронт | Timeweb App Platform, `dadatut.ru` | РФ |
| Почта Auth | `smtp.timeweb.ru` | РФ |
| Объектное хранилище фото | Storage на том же VPS | РФ |

Cloudflare **не используется** как прокси/DNS. Cutover: [SETUP_DNS_TIMEWEB.md](SETUP_DNS_TIMEWEB.md).

## Технические меры

| Мера | Есть | Как |
|------|------|-----|
| TLS 1.2/1.3 к API | скрипт | [`scripts/nginx-api-acme.conf`](../scripts/nginx-api-acme.conf), применить на VPS |
| ГОСТ / КриптоПро | нет | только УЗ-1/УЗ-2 |
| LUKS на диске | runbook | новая VDS, [SETUP_VPS_SECURITY.md](SETUP_VPS_SECURITY.md) |
| Бэкапы Postgres, шифрование до S3 в РФ | скрипт | [SETUP_BACKUPS_S3.md](SETUP_BACKUPS_S3.md) |
| RLS PostgreSQL | да | политики в `supabase/migrations` и `self_hosted_*.sql` |
| SSH только по ключу | скрипт | [`scripts/harden-ssh.sh`](../scripts/harden-ssh.sh), `APPLY=1` на VPS |
| 2FA кабинета сайта | нет | 2FA в панели Timeweb; MFA в приложении — отдельно |
| Журналы ≥ 6 мес. | runbook | journald; ClickHouse на 2-й VDS — следующий этап |

## Остаточный риск (не закрываем в этом заходе)

Трансграничная обработка, если функции включены:

- Anthropic, fal.ai / Gemini — ИИ-чат и листинги
- ElevenLabs — голос
- Google reCAPTCHA v3 и Google Fonts
- Telegram — уведомления о заявках

Хостинг и основная БД остаются в РФ. Вырезать эти интеграции можно отдельным решением продукта.

## Связанные документы

- [SETUP_TIMEWEB.md](SETUP_TIMEWEB.md) — фронт App Platform
- [SETUP_DNS_TIMEWEB.md](SETUP_DNS_TIMEWEB.md) — NS и SSL без Cloudflare
- [SETUP_VPS_SECURITY.md](SETUP_VPS_SECURITY.md) — SSH, LUKS, логи, TLS
- [SETUP_BACKUPS_S3.md](SETUP_BACKUPS_S3.md) — pg_dump → Timeweb S3
- [SETUP_RECAPTCHA.md](SETUP_RECAPTCHA.md) — защита форм
- [SETUP_VPS_SMTP.md](SETUP_VPS_SMTP.md) — почта
