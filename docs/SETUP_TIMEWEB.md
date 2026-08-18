# Деплой фронта на Timeweb App Platform

Сборка типа **Frontend / React** в Timeweb всегда выполняет:

```bash
DEBIAN_FRONTEND=noninteractive apt-get update && apt-get install -y --no-install-recommends \
  curl \
  && rm -rf /var/lib/apt/lists/*
```

Эта команда ходит на `deb.debian.org`. Если зеркало недоступно (IPv6 `Network is unreachable`, IPv4 timeout), деплой падает с `Unable to locate package curl` ещё до `npm install`.

Повторный пустой коммит это не чинит.

## Что делать

В корне репозитория есть `Dockerfile`, который **не вызывает apt-get**: Node 20 Alpine собирает Vite, nginx Alpine отдаёт `dist` на порту **8080**.

1. Timeweb Cloud → App Platform → приложение сайта.
2. Создайте **новое** приложение с типом **Dockerfile** (сменить тип у уже созданного Frontend-приложения обычно нельзя) и подключите тот же репозиторий / ветку `main`.
3. Путь к директории проекта оставьте пустым.
4. Переменные `VITE_*` задавать не обязательно: публичные значения уже в `.env.production` и попадают в бандл на этапе `npm run build`.
5. Привяжите домен к новому приложению и выключите автодеплой у старого Frontend-приложения.

Порт контейнера — `8080` (`EXPOSE 8080`). Так ожидает App Platform, если в Dockerfile не указан другой `EXPOSE`.
