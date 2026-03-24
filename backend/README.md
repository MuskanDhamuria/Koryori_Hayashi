# Backend

Fastify + Prisma backend for the Koryori Hayashi apps.

## Setup

1. Install dependencies:

```powershell
cd backend
npm install
```

2. Copy `.env.example` to `.env` and fill in your local values.

3. Initialize the database:

```powershell
cd backend
npm run prisma:push
npm run prisma:generate
npm run prisma:seed 
```

## Run

```powershell
npm run dev
```

## Environment Notes

- `DATABASE_URL` should be the pooled transactional database URL.
- `DIRECT_URL` should be the direct database URL for Prisma schema operations.
- `SYNC_STATE_PATH` stores local spreadsheet watcher state and defaults to `.data/spreadsheet-sync.json`.

## URLs

- Health: `http://localhost:4000/health`
- Swagger: `http://localhost:4000/docs`

## Current Features

- staff login
- menu API
- orders API
- loyalty points
- customer taste preference persistence
- analytics and inventory endpoints for the company app
- games leaderboard and score endpoints
- AI assistant endpoint for the company app
- staff-only spreadsheet sync and live integration event stream
- digital twin simulation endpoint (`POST /api/digital-twin/simulate`)

## Staff Integration Endpoints

- `GET /api/integrations/spreadsheet/status`
- `POST /api/integrations/spreadsheet/watch`
- `POST /api/integrations/spreadsheet/sync-now`
- `DELETE /api/integrations/spreadsheet/watch`
- `GET /api/integrations/stream`

CSV sync notes:
- Supported targets: `menuItems`, `inventoryItems`
- Watch state is stored locally at `SYNC_STATE_PATH`
- These endpoints require a staff/admin JWT

## Digital Twin: mock ML training CSV

Generate a mock training CSV (use `npm.cmd` instead of `npm` if PowerShell blocks scripts):

```powershell
cd backend
node scripts/generate-digital-twin-training-csv.mjs --out data/digital-twin-mock-training.csv --rows 500 --seed 42
```

To make the ML simulator train from this CSV, set this in `backend/.env`:

```env
DIGITAL_TWIN_TRAINING_CSV_PATH=data/digital-twin-mock-training.csv
```

Training uses **CSV samples + previous stored simulations** (when available).
