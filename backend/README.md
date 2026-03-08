# Backend

Fastify + Prisma backend for the Koryori Hayashi apps.

## Setup
1. Install dependencies:

```powershell
cd backend
npm install
```

2. Copy [backend/.env.example](/c:/Users/Naren/Documents/SMU/y2s2/DBTT/project/Koryori_Hayashi/backend/.env.example) to [backend/.env](/c:/Users/Naren/Documents/SMU/y2s2/DBTT/project/Koryori_Hayashi/backend/.env) and fill the Supabase connection values.

3. If the team should share the same data, everyone must use the same Supabase `DATABASE_URL` and `DIRECT_URL`.

## Initialize Database

```powershell
cd backend
npm run prisma:push
npm run prisma:seed
```

## Run

```powershell
npm run dev
```

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
