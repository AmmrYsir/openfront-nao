# OpenFront NAO (Bun + Vite + Classic UI)

This repo runs the migrated OpenFront stack with:
- Bun-first tooling
- New backend (Node/Bun runtime) with PostgreSQL
- Classic game UI as the active frontend experience

## Prerequisites

- Bun 1.3+
- Node.js 20+ (some legacy scripts still rely on Node tooling)
- Docker Desktop

## 1) Install dependencies

```bash
bun install
```

## 2) Configure environment

Copy env template:

```bash
cp .env.example .env
```

Update at least these values in `.env`:

```env
API_HOST=0.0.0.0
API_PORT=8787
API_PUBLIC_BASE=http://localhost:8787
API_KEY=dev-api-key

DATABASE_URL=postgres://postgres:<your_password>@localhost:<your_port>/openfront_nao
DATABASE_SSL=false
```

Notes:
- If your Docker Postgres exposes `5450`, use `localhost:5450`.
- If your Docker Postgres exposes `5432`, use `localhost:5432`.

## 3) Start PostgreSQL (Docker)

Use your own running Postgres container, or start the repo one:

```bash
docker compose up -d postgres
```

Default repo compose values:
- user: `postgres`
- password: `postgres`
- db: `openfront_nao`
- host port: `5432`

## 4) Run database migrations

```bash
bun run db:migrate
```

## 5) Start backend

```bash
bun run backend:dev
```

Health checks:
- `http://localhost:8787/api/health`
- `http://localhost:8787/api/health/db`

Both should return `ok: true`.

## 6) Start frontend

In another terminal:

```bash
bun run dev
```

Open:
- `http://localhost:5173`

The app redirects directly to classic UI:
- `/classic/index.html`

## 7) Run tests

```bash
bun run test
bun run test:all
```

## 8) Build

```bash
bun run build
bun run build:all
```

## Useful scripts

- `bun run dev` - Vite dev server
- `bun run backend:dev` - backend server
- `bun run db:migrate` - apply SQL migrations
- `bun run test` - new code tests
- `bun run test:all` - new + classic suite
- `bun run build` - new frontend build
- `bun run build:all` - new + classic compatibility bundle

## Classic env override (optional)

Classic runtime auto-detects env:
- localhost -> `dev`
- non-localhost -> `prod`

You can force it via query param:

- `?classic_env=dev`
- `?classic_env=staging`
- `?classic_env=prod`

Example:

`http://localhost:5173/classic/index.html?classic_env=dev`

