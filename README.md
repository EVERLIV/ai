# АрендаСити

Аренда и продажа коммерческой недвижимости в Иркутске.

## Stack

- Vite + React + TypeScript
- shadcn/ui + Tailwind CSS
- Supabase (optional, for backend features)

## Development

```sh
npm install
npm run dev
```

App runs on http://localhost:8080

## Build

```sh
npm run build
npm run preview
```

## Test

```sh
npm test
```

## Застройщики

Схема, RLS и порядок apply SQL: [docs/DEVELOPERS.md](docs/DEVELOPERS.md). Signup: `account_type=developer` + `developer_subtype` (`apartment_developer` \| `frame_house_builder`).

## Timeweb App Platform

Do not use the **Frontend / React** app type. Timeweb's generated image runs `apt-get install curl` from `deb.debian.org`, which their builders often cannot reach.

Use the repo `Dockerfile` (type **Dockerfile**, port 8080). Details: [docs/SETUP_TIMEWEB.md](docs/SETUP_TIMEWEB.md).
