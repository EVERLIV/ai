# AI Listing — cloud (stateless)

ИИ крутится в **Supabase Cloud** `xbdwapunrlnxcuxjhaca` (есть egress к Anthropic).  
Черновик и история чата живут **только на клиенте**.  
Создание объекта — кнопка «Создать черновик» через обычный JWT пользователя на `api.arendacity.com`.

## Secrets (только Anthropic)

| Secret | Значение |
|--------|----------|
| `ANTHROPIC_API_KEY` | `sk-ant-…` |

`CATALOG_*` / `JWT_SECRET` **не нужны** — функция не пишет в каталог.

## Deploy

```bash
npx supabase functions deploy ai-listing-create --project-ref xbdwapunrlnxcuxjhaca --no-verify-jwt
```

В Dashboard у функции: **Verify JWT = OFF**.

## Frontend

- URL: `https://xbdwapunrlnxcuxjhaca.supabase.co/functions/v1/ai-listing-create`
- или `VITE_LISTING_AI_URL`
- Приветствие локальное; в API уходят `messages` + `clientDraft`
- Публикация: `insertMyPropertyApi` / upload фото — self-hosted под `user.id`
