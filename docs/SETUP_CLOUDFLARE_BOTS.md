# Cloudflare — защита при первом заходе на сайт

Защита «на входе» настраивается в **Cloudflare Dashboard**, не в React-формах.

Заявки с сайта защищаются отдельно: **Google reCAPTCHA v3** + honeypot — см. [SETUP_RECAPTCHA.md](./SETUP_RECAPTCHA.md).

---

## Схема

1. Посетитель открывает `dadatut.ru`
2. Cloudflare (прокси) при подозрении на бота показывает Managed Challenge / JS Challenge
3. После прохождения cookie сессии — обычный просмотр сайта
4. Отправка заявки → honeypot + reCAPTCHA v3 → `submit-lead`

---

## 1. DNS: оранжевое облако

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → ваш домен
2. **DNS** → записи `dadatut.ru` и `www`:
   - Proxy status: **Proxied** (оранжевое облако)
3. Дождитесь распространения DNS

Без прокси Bot Fight / WAF на сайт не работают.

---

## 2. Bot Fight Mode

1. **Security** → **Bots**
2. Включите **Bot Fight Mode** (бесплатный план)  
   или **Super Bot Fight Mode** (Pro+)
3. Рекомендации:
   - Definitely automated → Block или Managed Challenge
   - Likely automated → Managed Challenge
   - Не включайте постоянный **Under Attack Mode** — только при DDoS

---

## 3. Managed Challenge (WAF)

1. **Security** → **WAF** → **Custom rules** (или Security Rules)
2. Пример: для подозрительных ботов / пустого UA — действие **Managed Challenge**
3. Не блокируйте легитимных пользователей жёстким Block без причины

---

## 4. API (`api.*`)

Edge functions (`submit-lead` и др.) часто на `api.arendacity.com` / отдельном хосте:

- Если API тоже за Cloudflare — можно rate-limit + Bot Fight
- Если API вне Cloudflare — обязательно оставляйте server-side reCAPTCHA на `submit-lead` (см. SETUP_RECAPTCHA.md)

Прямые POST в API минуют challenge на главной странице.

---

## 5. Проверка

1. Incognito / другое устройство → первый заход на `https://dadatut.ru`
2. При агрессивных настройках может появиться challenge Cloudflare
3. После прохождения сайт открывается без галочек на формах
4. Отправьте тестовую заявку — должна пройти reCAPTCHA v3 без видимого виджета

---

## Связанные документы

- [SETUP_RECAPTCHA.md](./SETUP_RECAPTCHA.md) — Google reCAPTCHA v3 на заявках
- Cloudflare Bots: https://developers.cloudflare.com/bots/
