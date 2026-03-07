# Backend

## Local setup

1. Copy `.env.example` to `.env`.
2. Run `npm install` inside `backend/`.
3. Run `npm run prisma:generate`.
4. Run `npm run prisma:push`.
5. Run `npm run prisma:seed`.
6. Run `npm run dev`.

Swagger UI will be available at `http://localhost:4000/docs`.

For Supabase, set `DATABASE_URL` to the pooled connection string and `DIRECT_URL` to the direct Postgres connection string.

## Docker

From the repo root:

`docker compose up --build`
