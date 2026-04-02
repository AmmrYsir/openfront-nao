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
