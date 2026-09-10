# Google reCAPTCHA — устарело

Заявки защищаются **Яндекс SmartCaptcha** (РФ).

Актуальная инструкция: **[SETUP_SMARTCAPTCHA.md](./SETUP_SMARTCAPTCHA.md)**

Старые переменные `VITE_RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` ещё читаются как алиасы при миграции; лучше перейти на `VITE_SMARTCAPTCHA_SITE_KEY` / `SMARTCAPTCHA_SERVER_KEY`.
