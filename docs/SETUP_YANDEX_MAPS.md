# Яндекс.Карты — ключ JS API

Карты на сайте грузятся через **JavaScript API 3.0**.  
Если ключ невалиден (Yandex отвечает `403 Invalid api key`), сайт
автоматически показывает **виджет** `yandex.ru/map-widget` (карта видна,
без интерактивных пинов JS API).

## Выпустить новый ключ

1. https://developer.tech.yandex.ru/ → сервис **JavaScript API и HTTP Геокодер**
2. Ограничения HTTP Referer:
   - `https://dadatut.ru/*`
   - `https://www.dadatut.ru/*`
   - `http://localhost:8080/*`
   - при необходимости `https://arendacity.com/*`
3. Вставить ключ в `.env` и `.env.production`:

```
VITE_YANDEX_MAPS_API_KEY=<новый_ключ>
```

4. Commit + push (Timeweb пересоберёт фронт).
5. В браузере: Application → Session Storage → удалить `ymaps3_js_unavailable`, обновить страницу.

Текущий ключ в репозитории (`2dc2b4a9-…`) Яндекс отклоняет как Invalid — его нужно заменить.
