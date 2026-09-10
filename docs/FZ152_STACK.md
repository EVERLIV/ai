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
| Kong `:8000` с интернета | закрыто на VPS | firewall (пункт приоритета 2) |
| Журналы ≥ 6 мес. | на VPS | journald retention (пункт приоритета 3) |
| ГОСТ / КриптоПро | нет | только УЗ-1/УЗ-2 |
| LUKS на диске | runbook | новая VDS, [SETUP_VPS_SECURITY.md](SETUP_VPS_SECURITY.md) |
| Бэкапы Postgres, шифрование до S3 в РФ | скрипт | [SETUP_BACKUPS_S3.md](SETUP_BACKUPS_S3.md) |
| RLS PostgreSQL | да | политики в `supabase/migrations` и `self_hosted_*.sql` |
| SSH только по ключу | на VPS | [`scripts/harden-ssh.sh`](../scripts/harden-ssh.sh) |
| 2FA кабинета сайта | нет | 2FA в панели Timeweb; MFA в приложении — отдельно |
| Защита форм (captcha) | Яндекс SmartCaptcha | [SETUP_SMARTCAPTCHA.md](SETUP_SMARTCAPTCHA.md) |

## Организационные меры (ПДн)

| Мера | Статус | Документ |
|------|--------|----------|
| Локальные акты + ответственный | шаблоны | [PDN_ACTS.md](PDN_ACTS.md) — подписать и вести журнал |
| Политика на сайте | да | `/privacy` |
| Уведомление в реестр операторов РКН | открыто | сделать в кабинете РКН отдельно |

## Остаточный риск (трансграничка / внешние сервисы)

Трансграничная или внешняя обработка, если функции включены:

- Anthropic, fal.ai / Gemini — ИИ-чат и листинги
- ElevenLabs — голос
- Google Fonts (если подключены с CDN Google)
- Telegram — уведомления о заявках

**Защита форм:** Google reCAPTCHA **заменена** на Яндекс SmartCaptcha (РФ) — см. [SETUP_SMARTCAPTCHA.md](SETUP_SMARTCAPTCHA.md).

Хостинг и основная БД остаются в РФ. Вырезать оставшиеся иностранные интеграции можно отдельным решением продукта.

## Связанные документы

- [SETUP_TIMEWEB.md](SETUP_TIMEWEB.md) — фронт App Platform
- [SETUP_DNS_TIMEWEB.md](SETUP_DNS_TIMEWEB.md) — NS и SSL без Cloudflare
- [SETUP_VPS_SECURITY.md](SETUP_VPS_SECURITY.md) — SSH, LUKS, логи, TLS
- [SETUP_BACKUPS_S3.md](SETUP_BACKUPS_S3.md) — pg_dump → Timeweb S3
- [SETUP_SMARTCAPTCHA.md](SETUP_SMARTCAPTCHA.md) — Яндекс SmartCaptcha на заявках
- [PDN_ACTS.md](PDN_ACTS.md) — акты и ответственный по ПДн
- [SETUP_VPS_SMTP.md](SETUP_VPS_SMTP.md) — почта
