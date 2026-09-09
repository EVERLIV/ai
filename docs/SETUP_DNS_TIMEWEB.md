# DNS и TLS без Cloudflare (Timeweb)

Cloudflare в РФ часто **не открывается**: посетитель резолвит домен в IP Cloudflare и не доходит до Timeweb. Origin при этом жив.

Серое облако **недостаточно**: пока NS у `*.ns.cloudflare.com`, резолв идёт через их инфраструктуру.

Этот документ — только инструкция. DNS из репозитория не меняется.

## Целевая схема

| Имя | Куда | TLS |
|-----|------|-----|
| `dadatut.ru`, `www.dadatut.ru` | Timeweb App Platform (контейнер nginx `:8080`) | Let's Encrypt в панели Timeweb |
| `api.arendacity.com` | VPS nginx → Kong `:8000` | Let's Encrypt на VPS, см. [`scripts/nginx-api-acme.conf`](../scripts/nginx-api-acme.conf) |
| Почта `noreply@…` | `smtp.timeweb.ru` | SPF/DKIM/MX в Timeweb DNS |

Привязка домена к App Platform: [`scripts/timeweb-add-domain.mjs`](../scripts/timeweb-add-domain.mjs), деплой фронта: [SETUP_TIMEWEB.md](SETUP_TIMEWEB.md).

## 1. NS у регистратора → Timeweb

1. Timeweb Cloud → **Домены** → DNS: скопируйте NS Timeweb (обычно `ns1.timeweb.ru`, `ns2.timeweb.ru`, `ns3.timeweb.ru`, `ns4.timeweb.ru` — сверьте в панели).
2. У регистратора `dadatut.ru` (и при необходимости `arendacity.com`) замените NS. **Не оставляйте** `*.ns.cloudflare.com`.
3. Дождитесь смены NS: `dig NS dadatut.ru +short`.

Пока NS Cloudflare — сайт в РФ может не открываться даже при выключенном прокси.

## 2. A / CNAME на App Platform

После NS Timeweb:

1. Timeweb App Platform → приложение сайта (тип **Dockerfile**, порт **8080**).
2. Привяжите `dadatut.ru` и `www` (скрипт `timeweb-add-domain.mjs` или вручную в панели). SSL Let's Encrypt Timeweb выдаёт сам.
3. A/CNAME должны указывать на **IP/алиас приложения Timeweb**, не на Cloudflare.

`api.arendacity.com` — A на публичный IP VPS. Не проксируйте API через Cloudflare.

## 3. Почта: SPF, DKIM, MX

Письма Auth идут через Timeweb SMTP: [SETUP_VPS_SMTP.md](SETUP_VPS_SMTP.md).

В DNS того же домена, что в `From` (`dadatut.ru` / `arendacity.com`):

- **MX** — как в панели почты Timeweb
- **SPF** — запись из панели почты (обычно `include:_spf.timeweb.ru`)
- **DKIM** — TXT из панели почты

Без этого Gmail часто кладёт письма в спам.

## 4. Cloudflare Dashboard (после cutover)

1. Выключите proxy (если ещё включён) и удалите A/CNAME на Cloudflare, чтобы не путать.
2. Bot Fight / WAF больше не используются. Заявки защищает reCAPTCHA: [SETUP_RECAPTCHA.md](SETUP_RECAPTCHA.md).

## 5. Проверка из РФ

```bash
dig NS dadatut.ru +short
dig A dadatut.ru +short
dig A www.dadatut.ru +short
dig A api.arendacity.com +short
```

- NS не содержат `cloudflare`.
- A сайта — Timeweb, не диапазоны Cloudflare.
- Сайт открывается по `https://dadatut.ru` **без** challenge Cloudflare.
- `https://api.arendacity.com` отвечает (Kong / REST).
- Тестовая регистрация: письмо с `noreply@…`.

TLS API 1.2/1.3: см. комментарий в `scripts/nginx-api-acme.conf`. Применять на VPS вручную (`nginx -t && reload`), не с рабочей станции разработки.
