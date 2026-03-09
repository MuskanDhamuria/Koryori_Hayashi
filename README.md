# Koryori Hayashi

This repository contains:
- `CustomerFacingApp/` - customer ordering app
- `CompanyFacingApp/` - staff dashboard
- `backend/` - Fastify + Prisma backend

## Architecture

- `CustomerFacingApp` consumes public customer-facing backend APIs for menu browsing, ordering, loyalty, and game rewards.
- `CompanyFacingApp` consumes staff-only backend APIs for dashboard analytics, order visibility, inventory alerts, and AI assistance.
- `backend` is the system of record for auth, orders, analytics, inventory, loyalty, and games.

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

Important:
- `backend/.env` should stay local and should not contain committed secrets.
- Everyone only sees the same data if they use the same Supabase project in `backend/.env`.

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
SYNC_STATE_PATH=.data/spreadsheet-sync.json
```

Notes:
- `DATABASE_URL` should be the Supabase pooled connection.
- `DIRECT_URL` should be the direct database connection.
- Do not commit real secrets.
- `SYNC_STATE_PATH` stores local spreadsheet watcher state for the backend integration feature.

### 3. Create schema and seed data

```powershell
cd backend
npm run prisma:push
npm run prisma:seed
```

If Prisma client generation is missing locally, run:

```powershell
cd backend
npm run prisma:generate
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
- Backend staff integrations: `http://localhost:4000/api/integrations/*`
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
- Company dashboard analytics and inventory alerts are backend-driven.
- The backend includes optional CSV spreadsheet sync for `menuItems` and `inventoryItems` through staff-only integration endpoints.

## Integration Endpoints

The backend exposes staff-only spreadsheet integration endpoints:

- `GET /api/integrations/spreadsheet/status`
- `POST /api/integrations/spreadsheet/watch`
- `POST /api/integrations/spreadsheet/sync-now`
- `DELETE /api/integrations/spreadsheet/watch`
- `GET /api/integrations/stream`

Notes:
- Only CSV imports are supported in the current backend.
- Supported `csvTarget` values are `menuItems` and `inventoryItems`.
- Stream access requires a staff JWT token.
