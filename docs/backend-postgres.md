# Backend + PostgreSQL

This project now includes a first-party backend foundation with PostgreSQL.

## Why PostgreSQL

- Strong transactional guarantees for game/account/archive records
- Mature indexing/query performance for leaderboard and game history workloads
- Easy horizontal scaling path (read replicas, partitioning, managed services)

## Local setup

1. Start Postgres:

```bash
docker compose up -d postgres
```

2. Configure env (copy `backend.env.example` into your environment).
   - Preferred: `cp .env.example .env` (or run `npm run env:init`).
   - Legacy backend-only template: `backend.env.example`.
   - Set `API_PUBLIC_BASE` to the browser-visible backend URL used for JWT issuer.

3. Run migrations:

```bash
bun run db:migrate
```

4. Start backend server:

```bash
bun run backend:dev
```

## Health endpoints

- `GET /api/health`
- `GET /api/health/db`

## Implemented backend API surface

- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/revoke`
- `POST /auth/magic-link`
- `GET /users/@me`
- `GET /users/@me/preferences`
- `PUT /users/@me/preferences`
- `GET /leaderboard/ranked?page=<n>`
- `GET /public/clans/leaderboard`
- `GET /game/:id`
- `POST /game/:id` (requires `x-api-key`)
- `GET /api/game/:id/exists`
- `GET /w<worker>/api/game/:id/exists`
- `GET /api/lobbies`
- `POST /api/lobbies` (requires `x-api-key`)
- `DELETE /api/lobbies/:id` (requires `x-api-key`)
- `GET /api/instance`
