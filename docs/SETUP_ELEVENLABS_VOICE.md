# Голосовой звонок ElevenLabs в ИИ-чате

Кнопка **«Позвонить»** в `PropertyAIChat` запускает WebRTC-сессию с вашим
агентом ElevenLabs. При старте подгружается актуальный каталог объектов.

## Что уже в коде

| Часть | Назначение |
|--------|------------|
| `src/hooks/useElevenLabsVoice.ts` | старт/стоп звонка, каталог, client tool |
| `src/components/PropertyAIChat.tsx` | кнопка «Позвонить» |
| `supabase/functions/elevenlabs-conversation-token` | token + каталог + search |

Фронт вызывает **cloud** URL (не `api.arendacity.com`):

`https://xbdwapunrlnxcuxjhaca.supabase.co/functions/v1/elevenlabs-conversation-token`

Agent ID по умолчанию: `agent_7301kmyt4jxxf8etgj0av5x43qb4`  
Переопределение: `VITE_ELEVENLABS_AGENT_ID` / `VITE_ELEVENLABS_TOKEN_URL` в `.env`

## Секреты Supabase (ARENA CITY)

| Secret | Описание |
|--------|----------|
| `ELEVENLABS_API_KEY` | API key ElevenLabs |
| `ELEVENLABS_AGENT_ID` | (опционально) default agent id |
| `CATALOG_URL` | `https://api.arendacity.com` |
| `CATALOG_ANON_KEY` | anon key каталога |
| `SITE_URL` | `https://arendacity.com` |

## Деплой функции

```bash
npx supabase functions deploy elevenlabs-conversation-token \
  --project-ref xbdwapunrlnxcuxjhaca --no-verify-jwt
```

## Настройка агента в ElevenLabs (рекомендуется)

1. В system prompt добавьте блок:

```
У тебя есть актуальный каталог объектов АрендаСити (приходит в контексте звонка
и в переменной {{catalog_summary}}). Не выдумывай объекты и цены.
Если нужен точный подбор — вызови tool search_properties.
Ссылки вида https://arendacity.com/property/<id>.
```

2. **Client tool** (Tools → Add client tool):

- Name: `search_properties`
- Description: Поиск объектов в каталоге АрендаСити
- Parameters (JSON schema):

```json
{
  "type": "object",
  "properties": {
    "query": { "type": "string", "description": "Свободный поиск (район, улица)" },
    "type": { "type": "string", "description": "Офис / Склад / Торговое" },
    "district": { "type": "string" },
    "max_price": { "type": "number" },
    "min_area": { "type": "number" },
    "max_area": { "type": "number" }
  }
}
```

3. В Security агента: если включена authentication — оставляем как есть
   (сайт берёт token через наш edge с `ELEVENLABS_API_KEY`).

## Как работает знание объектов

1. При нажатии «Позвонить» edge отдаёт `token` + `catalog.summary` + `catalog.text`.
2. Клиент вызывает `sendContextualUpdate` с каталогом — агент сразу «знает» объекты.
3. При детальном запросе агент может вызвать `search_properties` → живой поиск по API.

Без шага «Client tool» в UI ElevenLabs звонок всё равно работает: каталог уже
в контексте. Tool нужен для более точных фильтров в длинном разговоре.
