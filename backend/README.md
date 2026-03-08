# Backend

Fastify + Prisma backend for the Koryori Hayashi apps.

## Setup
1. Install dependencies:

```powershell
cd backend
npm install
```

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