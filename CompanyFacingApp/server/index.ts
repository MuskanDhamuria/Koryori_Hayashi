import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Response } from 'express';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSessionResponse, loginUser, logoutUser, registerFirstUser, requireAuth } from './auth.js';
import { config } from './config.js';
import { readAppState, resetDashboardState, writeAppState } from './db.js';
import { attachStream, broadcast } from './sse.js';
import { SpreadsheetSyncManager } from './spreadsheetSync.js';
import type { AppState, InventoryItem, MenuItem, OpsSettings, RecipeLine, SaleRecord, SpreadsheetSyncConfig } from '../src/types.js';

const app = express();
const spreadsheetSync = new SpreadsheetSyncManager((message) => broadcast(message));

void spreadsheetSync.resumeFromDatabase();

app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

function sendError(response: Response, statusCode: number, error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected server error.';
  response.status(statusCode).json({ ok: false, message, data: null });
}

function asObject(value: unknown) {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function toText(value: unknown, fallback = '') {
  if (value === undefined || value === null) {
    return fallback;
  }
  const text = String(value).trim();
  return text || fallback;
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeMenuItems(value: unknown): MenuItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry, index) => {
    const row = asObject(entry);
    return {
      id: toText(row.id, `menu-${index + 1}-${randomUUID()}`),
      name: toText(row.name, `Menu Item ${index + 1}`),
      category: toText(row.category, 'Uncategorized'),
      price: toNumber(row.price),
      unitCost: toNumber(row.unitCost),
      prepMinutes: toNumber(row.prepMinutes),
    } satisfies MenuItem;
  });
}

function normalizeSalesRecords(value: unknown): SaleRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry, index) => {
      const row = asObject(entry);
      const timestamp = new Date(toText(row.timestamp, new Date().toISOString()));
      return {
        id: toText(row.id, `sale-${index + 1}-${randomUUID()}`),
        menuItemId: toText(row.menuItemId),
        timestamp: Number.isNaN(timestamp.getTime()) ? new Date().toISOString() : timestamp.toISOString(),
        quantity: Math.max(1, toNumber(row.quantity, 1)),
        note: toText(row.note, 'Manual input'),
      } satisfies SaleRecord;
    })
    .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());
}

function normalizeInventoryItems(value: unknown): InventoryItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry, index) => {
    const row = asObject(entry);
    return {
      id: toText(row.id, `inventory-${index + 1}-${randomUUID()}`),
      name: toText(row.name, `Inventory Item ${index + 1}`),
      unit: toText(row.unit, 'unit'),
      onHand: toNumber(row.onHand),
      unitCost: toNumber(row.unitCost),
      safetyStock: toNumber(row.safetyStock),
      leadTimeDays: toNumber(row.leadTimeDays, 1),
      packSize: toNumber(row.packSize, 1),
      shelfLifeDays: toNumber(row.shelfLifeDays, 7),
    } satisfies InventoryItem;
  });
}

function normalizeRecipes(value: unknown): RecipeLine[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry, index) => {
    const row = asObject(entry);
    return {
      id: toText(row.id, `recipe-${index + 1}-${randomUUID()}`),
      menuItemId: toText(row.menuItemId),
      inventoryItemId: toText(row.inventoryItemId),
      quantityPerItem: toNumber(row.quantityPerItem),
    } satisfies RecipeLine;
  });
}

function normalizeSettings(value: unknown, fallback: OpsSettings): OpsSettings {
  const row = asObject(value);
  return {
    currencyCode: toText(row.currencyCode, fallback.currencyCode).toUpperCase(),
    ordersPerStaffHour: Math.max(1, toNumber(row.ordersPerStaffHour, fallback.ordersPerStaffHour)),
    targetMargin: Math.max(0, Math.min(0.95, toNumber(row.targetMargin, fallback.targetMargin))),
    forecastHorizonDays: Math.max(1, Math.round(toNumber(row.forecastHorizonDays, fallback.forecastHorizonDays))),
    wasteCoverThresholdDays: Math.max(1, Math.round(toNumber(row.wasteCoverThresholdDays, fallback.wasteCoverThresholdDays))),
    regressionBlend: Math.max(0, Math.min(1, toNumber(row.regressionBlend, fallback.regressionBlend))),
  };
}

function normalizeAppState(input: unknown, fallback: AppState): AppState {
  const state = asObject(input);
  return {
    menuItems: normalizeMenuItems(state.menuItems),
    salesRecords: normalizeSalesRecords(state.salesRecords),
    inventoryItems: normalizeInventoryItems(state.inventoryItems),
    recipes: normalizeRecipes(state.recipes),
    settings: normalizeSettings(state.settings, fallback.settings),
  };
}

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, message: 'API healthy.', data: { status: 'ok' } });
});

app.get('/api/auth/session', (request, response) => {
  response.json({ ok: true, message: 'Session read.', data: buildSessionResponse(request) });
});

app.post('/api/auth/register', (request, response) => {
  try {
    const body = asObject(request.body);
    const name = toText(body.name);
    const email = toText(body.email).toLowerCase();
    const password = toText(body.password);

    if (!name || !email || !password) {
      sendError(response, 400, new Error('Name, email, and password are required.'));
      return;
    }

    const user = registerFirstUser({ name, email, password }, response);
    response.status(201).json({
      ok: true,
      message: 'Admin account created.',
      data: {
        authenticated: true,
        setupRequired: false,
        user,
      },
    });
  } catch (error) {
    sendError(response, 400, error);
  }
});

app.post('/api/auth/login', (request, response) => {
  try {
    const body = asObject(request.body);
    const email = toText(body.email).toLowerCase();
    const password = toText(body.password);

    if (!email || !password) {
      sendError(response, 400, new Error('Email and password are required.'));
      return;
    }

    const user = loginUser({ email, password }, response);
    response.json({
      ok: true,
      message: 'Logged in successfully.',
      data: {
        authenticated: true,
        setupRequired: false,
        user,
      },
    });
  } catch (error) {
    sendError(response, 401, error);
  }
});

app.post('/api/auth/logout', (request, response) => {
  logoutUser(request, response);
  response.json({ ok: true, message: 'Logged out.', data: true });
});

app.get('/api/dashboard', requireAuth, (_request, response) => {
  response.json({ ok: true, message: 'Dashboard loaded.', data: readAppState() });
});

app.put('/api/dashboard', requireAuth, (request, response) => {
  try {
    const current = readAppState();
    const next = normalizeAppState(request.body?.state ?? request.body, current);
    const saved = writeAppState(next);
    response.json({ ok: true, message: 'Dashboard saved to SQLite.', data: saved });
  } catch (error) {
    sendError(response, 400, error);
  }
});

app.post('/api/dashboard/reset', requireAuth, (_request, response) => {
  try {
    const data = resetDashboardState();
    broadcast({
      type: 'system.notice',
      timestamp: new Date().toISOString(),
      message: 'Dashboard reset to the seeded dataset.',
    });
    response.json({ ok: true, message: 'Dashboard reset.', data });
  } catch (error) {
    sendError(response, 500, error);
  }
});

app.get('/api/integrations/spreadsheet/status', requireAuth, (_request, response) => {
  response.json({ ok: true, message: 'Spreadsheet sync status loaded.', data: spreadsheetSync.getStatus() });
});

app.post('/api/integrations/spreadsheet/watch', requireAuth, async (request, response) => {
  try {
    const body = asObject(request.body);
    const payload: SpreadsheetSyncConfig = {
      filePath: toText(body.filePath),
      fileType: ['csv', 'excel'].includes(toText(body.fileType)) ? (toText(body.fileType) as SpreadsheetSyncConfig['fileType']) : undefined,
      csvTarget: toText(body.csvTarget) ? (toText(body.csvTarget) as SpreadsheetSyncConfig['csvTarget']) : undefined,
    } as SpreadsheetSyncConfig;

    const status = await spreadsheetSync.startWatching(payload);
    response.json({ ok: true, message: 'Spreadsheet watcher started.', data: status });
  } catch (error) {
    sendError(response, 400, error);
  }
});

app.delete('/api/integrations/spreadsheet/watch', requireAuth, async (_request, response) => {
  try {
    const status = await spreadsheetSync.stopWatching();
    response.json({ ok: true, message: 'Spreadsheet watcher stopped.', data: status });
  } catch (error) {
    sendError(response, 500, error);
  }
});

app.get('/api/stream', requireAuth, (request, response) => {
  attachStream(request, response);
});

if (config.isProduction) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const clientDist = resolve(__dirname, '..', '..', 'dist');

  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^\/(?!api).*/, (_request, response) => {
      response.sendFile(resolve(clientDist, 'index.html'));
    });
  }
}

app.listen(config.port, () => {
  console.log(`CompanyFacingApp API listening on http://localhost:${config.port}`);
});
