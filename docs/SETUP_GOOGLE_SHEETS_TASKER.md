# Tasker ↔ Google Sheets (облачный Excel)

Бот читает и правит Google Таблицу по командам `#tasker …`.

## 1. Создайте Service Account в Google Cloud

1. [Google Cloud Console](https://console.cloud.google.com/) → проект  
2. **APIs & Services → Enable APIs** → включите **Google Sheets API**  
3. **IAM & Admin → Service Accounts → Create**  
4. Keys → Add key → JSON → скачайте файл  

## 2. Откройте доступ к таблице

1. Откройте вашу Google Sheet (`team_kanban_planner_v3` или другая)  
2. **Share** → добавьте email service account:  
   `project-1285666415996898989@appspot.gserviceaccount.com`  
3. Права: **Editor**  

ID таблицы — из URL:
`https://docs.google.com/spreadsheets/d/`**`SHEET_ID`**`/edit`

Также включите **Google Sheets API** в Cloud Console проекта (Drive API не обязателен).

## 3. Формат листа (1-я строка — заголовки)

Рекомендуемые колонки (имена можно на русском):

| title / название | status / статус | priority / приоритет | assignee / ответственный | due / срок | notes / заметка |
|------------------|-----------------|----------------------|--------------------------|------------|-----------------|

Пример имени листа: `Tasker`  
Тогда range: `Tasker!A:F`

## 4. Секреты в Supabase (ARENA CITY)

Текущая таблица: **team_kanban_planner_v3**

| Secret | Значение |
|--------|----------|
| `GOOGLE_SHEETS_ID` | `1fLGq4pyyc_PwtdsCdXw3lM9Ky9p7EQVqLe3QwYCqT9g` |
| `GOOGLE_SHEETS_RANGE` | `Задачи!A4:S` (заголовки на строке 4) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | весь JSON ключа **одной строкой** |

PowerShell (пример):

```powershell
$json = Get-Content .\service-account.json -Raw
# В Dashboard удобнее вставить JSON вручную в Secret.
npx supabase secrets set GOOGLE_SHEETS_ID="1fLGq4pyyc_PwtdsCdXw3lM9Ky9p7EQVqLe3QwYCqT9g" GOOGLE_SHEETS_RANGE="Задачи!A4:S" --project-ref xbdwapunrlnxcuxjhaca
```

`GOOGLE_SERVICE_ACCOUNT_JSON` лучше вставить в Dashboard → Edge Functions → Secrets  
(многострочный private_key).

## 5. Команды в Telegram

```
#tasker list
#tasker csv
#tasker done Офис Кировский
#tasker set B2 done
#tasker add Новая задача | todo | high | Иван
#tasker note Офис | клиент перезвонит завтра
```

## 6. Деплой после правок кода

```bash
supabase functions deploy telegram-bot --project-ref xbdwapunrlnxcuxjhaca --no-verify-jwt
```
