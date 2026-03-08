# Koryori Hayashi

This branch contains:
- `CustomerFacingApp/` - customer ordering app
- `CompanyFacingApp/` - staff dashboard
- `backend/` - Fastify + Prisma backend

## Quick Start

### 1. Install dependencies

In three terminals:

```powershell
cd backend
npm install
```

```powershell
cd CustomerFacingApp
npm install
```

```powershell
cd CompanyFacingApp
npm install
```

### 2. Configure backend env

Copy [backend/.env.example](/c:/Users/Naren/Documents/SMU/y2s2/DBTT/project/Koryori_Hayashi/backend/.env.example) to [backend/.env](/c:/Users/Naren/Documents/SMU/y2s2/DBTT/project/Koryori_Hayashi/backend/.env).

For Supabase, fill:

```env
NODE_ENV=development
PORT=4000
HOST=0.0.0.0
LOG_LEVEL=info

DATABASE_URL=your-supabase-transaction-pooler-url-with-pgbouncer
DIRECT_URL=your-supabase-direct-db-url

JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_IN=7d

CUSTOMER_APP_ORIGIN=http://localhost:5173
COMPANY_APP_ORIGIN=http://localhost:5174

SEED_STAFF_EMAIL=admin@gmail.com
SEED_STAFF_PASSWORD=change-this
```

Notes:
- `DATABASE_URL` should be the Supabase pooled connection.
- `DIRECT_URL` should be the direct database connection.
- Do not commit real secrets.

### 3. Create schema and seed data

```powershell
cd backend
npm run prisma:push
npm run prisma:seed
```

### 4. Start the apps

Backend:

```powershell
cd backend
npm run dev
```

Customer app:

```powershell
cd CustomerFacingApp
npm run dev
```

Company app:

```powershell
cd CompanyFacingApp
npm run dev
```

## URLs

- Backend health: `http://localhost:4000/health`
- Backend Swagger: `http://localhost:4000/docs`
- Customer app: `http://localhost:5173`
- Company app: `http://localhost:5174`

## Seeded Login

Staff dashboard:
- Email: whatever you set in `SEED_STAFF_EMAIL`
- Password: whatever you set in `SEED_STAFF_PASSWORD`

Customer quick access numbers:
- `+1 (555) 123-4567`
- `+1 (555) 987-6543`
- `+1 (555) 555-5555`

## Current Behavior

- Customer loyalty points, orders, and taste preferences are stored in the backend database.
- Customer quick-access cards on the login screen load from backend data.
- If a customer already has saved taste preferences, the quiz is skipped automatically.
- Customers can update taste preferences later from the ordering flow.

## Local Postgres Option

If you do not want Supabase for local development, you can use the Docker Postgres service in [docker-compose.yml](/c:/Users/Naren/Documents/SMU/y2s2/DBTT/project/Koryori_Hayashi/docker-compose.yml) and switch `DATABASE_URL` / `DIRECT_URL` in [backend/.env](/c:/Users/Naren/Documents/SMU/y2s2/DBTT/project/Koryori_Hayashi/backend/.env) back to local Postgres values.
