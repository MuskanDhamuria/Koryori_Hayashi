import { mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';
import { createDefaultAppState } from '../src/data/defaultData.js';
import {
  AppState,
  AuthUser,
  InventoryItem,
  MenuItem,
  OpsSettings,
  RecipeLine,
  SaleRecord,
  SpreadsheetEntity,
  SpreadsheetSyncConfig,
  SpreadsheetSyncStatus,
} from '../src/types.js';

interface StoredUser extends AuthUser {
  passwordHash: string;
}

interface SyncRow {
  enabled: number;
  status: SpreadsheetSyncStatus['status'];
  file_path: string | null;
  file_type: SpreadsheetSyncConfig['fileType'] | null;
  csv_target: SpreadsheetEntity | null;
  last_sync_at: string | null;
  last_error: string | null;
}

const SUPPORTED_SHEETS: SpreadsheetEntity[] = ['menuItems', 'inventoryItems', 'salesRecords', 'recipes', 'settings'];

mkdirSync(config.dataDirectory, { recursive: true });

const database = new DatabaseSync(config.databasePath);
database.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;
`);

function transaction<T>(callback: () => T): T {
  database.exec('BEGIN IMMEDIATE');
  try {
    const result = callback();
    database.exec('COMMIT');
    return result;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

function createTables() {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    ) STRICT;
    CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS menu_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      unit_cost REAL NOT NULL,
      prep_minutes REAL NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS sales_records (
      id TEXT PRIMARY KEY,
      menu_item_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      quantity REAL NOT NULL,
      note TEXT NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      on_hand REAL NOT NULL,
      unit_cost REAL NOT NULL,
      safety_stock REAL NOT NULL,
      lead_time_days REAL NOT NULL,
      pack_size REAL NOT NULL,
      shelf_life_days REAL NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      menu_item_id TEXT NOT NULL,
      inventory_item_id TEXT NOT NULL,
      quantity_per_item REAL NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      currency_code TEXT NOT NULL,
      orders_per_staff_hour REAL NOT NULL,
      target_margin REAL NOT NULL,
      forecast_horizon_days INTEGER NOT NULL,
      waste_cover_threshold_days INTEGER NOT NULL,
      regression_blend REAL NOT NULL
    ) STRICT;

    CREATE TABLE IF NOT EXISTS sync_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      enabled INTEGER NOT NULL,
      status TEXT NOT NULL,
      file_path TEXT,
      file_type TEXT,
      csv_target TEXT,
      last_sync_at TEXT,
      last_error TEXT,
      updated_at TEXT NOT NULL
    ) STRICT;
  `);
}

function seedDashboardIfEmpty() {
  const countRow = database.prepare('SELECT COUNT(*) AS count FROM menu_items').get() as { count: number };
  if (countRow.count > 0) {
    return;
  }

  writeAppState(createDefaultAppState());
}

createTables();
seedDashboardIfEmpty();

function clearDashboardTables() {
  database.exec(`
    DELETE FROM sales_records;
    DELETE FROM recipes;
    DELETE FROM inventory_items;
    DELETE FROM menu_items;
  `);
}

function readMenuItems(): MenuItem[] {
  const rows = database.prepare('SELECT * FROM menu_items ORDER BY name').all() as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
    price: Number(row.price),
    unitCost: Number(row.unit_cost),
    prepMinutes: Number(row.prep_minutes),
  }));
}

function readSalesRecords(): SaleRecord[] {
  const rows = database.prepare('SELECT * FROM sales_records ORDER BY timestamp').all() as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: String(row.id),
    menuItemId: String(row.menu_item_id),
    timestamp: String(row.timestamp),
    quantity: Number(row.quantity),
    note: String(row.note),
  }));
}

function readInventoryItems(): InventoryItem[] {
  const rows = database.prepare('SELECT * FROM inventory_items ORDER BY name').all() as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    unit: String(row.unit),
    onHand: Number(row.on_hand),
    unitCost: Number(row.unit_cost),
    safetyStock: Number(row.safety_stock),
    leadTimeDays: Number(row.lead_time_days),
    packSize: Number(row.pack_size),
    shelfLifeDays: Number(row.shelf_life_days),
  }));
}

function readRecipes(): RecipeLine[] {
  const rows = database.prepare('SELECT * FROM recipes ORDER BY id').all() as Array<Record<string, unknown>>;
  return rows.map((row) => ({
    id: String(row.id),
    menuItemId: String(row.menu_item_id),
    inventoryItemId: String(row.inventory_item_id),
    quantityPerItem: Number(row.quantity_per_item),
  }));
}

function readSettings(): OpsSettings {
  const row = database.prepare('SELECT * FROM settings WHERE id = 1').get() as Record<string, unknown> | undefined;

  if (!row) {
    return createDefaultAppState().settings;
  }

  return {
    currencyCode: String(row.currency_code),
    ordersPerStaffHour: Number(row.orders_per_staff_hour),
    targetMargin: Number(row.target_margin),
    forecastHorizonDays: Number(row.forecast_horizon_days),
    wasteCoverThresholdDays: Number(row.waste_cover_threshold_days),
    regressionBlend: Number(row.regression_blend),
  };
}

export function readAppState(): AppState {
  return {
    menuItems: readMenuItems(),
    salesRecords: readSalesRecords(),
    inventoryItems: readInventoryItems(),
    recipes: readRecipes(),
    settings: readSettings(),
  };
}

export function writeAppState(state: AppState) {
  transaction(() => {
    clearDashboardTables();

    const insertMenu = database.prepare(`
      INSERT INTO menu_items (id, name, category, price, unit_cost, prep_minutes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    state.menuItems.forEach((item) => {
      insertMenu.run(item.id, item.name, item.category, Number(item.price), Number(item.unitCost), Number(item.prepMinutes));
    });

    const insertSales = database.prepare(`
      INSERT INTO sales_records (id, menu_item_id, timestamp, quantity, note)
      VALUES (?, ?, ?, ?, ?)
    `);
    state.salesRecords.forEach((sale) => {
      insertSales.run(sale.id, sale.menuItemId, sale.timestamp, Number(sale.quantity), sale.note);
    });

    const insertInventory = database.prepare(`
      INSERT INTO inventory_items (id, name, unit, on_hand, unit_cost, safety_stock, lead_time_days, pack_size, shelf_life_days)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    state.inventoryItems.forEach((item) => {
      insertInventory.run(
        item.id,
        item.name,
        item.unit,
        Number(item.onHand),
        Number(item.unitCost),
        Number(item.safetyStock),
        Number(item.leadTimeDays),
        Number(item.packSize),
        Number(item.shelfLifeDays),
      );
    });

    const insertRecipe = database.prepare(`
      INSERT INTO recipes (id, menu_item_id, inventory_item_id, quantity_per_item)
      VALUES (?, ?, ?, ?)
    `);
    state.recipes.forEach((recipe) => {
      insertRecipe.run(recipe.id, recipe.menuItemId, recipe.inventoryItemId, Number(recipe.quantityPerItem));
    });

    database.prepare(`
      INSERT INTO settings (
        id,
        currency_code,
        orders_per_staff_hour,
        target_margin,
        forecast_horizon_days,
        waste_cover_threshold_days,
        regression_blend
      ) VALUES (1, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        currency_code = excluded.currency_code,
        orders_per_staff_hour = excluded.orders_per_staff_hour,
        target_margin = excluded.target_margin,
        forecast_horizon_days = excluded.forecast_horizon_days,
        waste_cover_threshold_days = excluded.waste_cover_threshold_days,
        regression_blend = excluded.regression_blend
    `).run(
      state.settings.currencyCode,
      Number(state.settings.ordersPerStaffHour),
      Number(state.settings.targetMargin),
      Number(state.settings.forecastHorizonDays),
      Number(state.settings.wasteCoverThresholdDays),
      Number(state.settings.regressionBlend),
    );
  });

  return readAppState();
}

export function applyPartialAppState(partial: Partial<AppState>) {
  const current = readAppState();
  return writeAppState({
    menuItems: partial.menuItems ?? current.menuItems,
    salesRecords: partial.salesRecords ?? current.salesRecords,
    inventoryItems: partial.inventoryItems ?? current.inventoryItems,
    recipes: partial.recipes ?? current.recipes,
    settings: partial.settings ?? current.settings,
  });
}

function mapStoredUser(row?: Record<string, unknown> | null): StoredUser | null {
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: 'admin',
    passwordHash: String(row.password_hash),
  };
}

export function hasAnyUser() {
  const row = database.prepare('SELECT COUNT(*) AS count FROM users').get() as { count: number };
  return row.count > 0;
}

export function findStoredUserByEmail(email: string) {
  const row = database.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').get(email) as Record<string, unknown> | undefined;
  return mapStoredUser(row);
}

export function createStoredUser(input: { id: string; name: string; email: string; passwordHash: string; createdAt: string }) {
  database.prepare(`
    INSERT INTO users (id, name, email, password_hash, role, created_at)
    VALUES (?, ?, ?, ?, 'admin', ?)
  `).run(input.id, input.name, input.email, input.passwordHash, input.createdAt);

  return {
    id: input.id,
    name: input.name,
    email: input.email,
    role: 'admin' as const,
  } satisfies AuthUser;
}

export function createSessionRecord(input: { id: string; userId: string; tokenHash: string; createdAt: string; expiresAt: string }) {
  database.prepare(`
    INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(input.id, input.userId, input.tokenHash, input.createdAt, input.expiresAt);
}

export function deleteSessionByTokenHash(tokenHash: string) {
  database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
}

export function cleanupExpiredSessions() {
  database.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date().toISOString());
}

export function findUserByTokenHash(tokenHash: string): AuthUser | null {
  cleanupExpiredSessions();

  const row = database
    .prepare(`
      SELECT users.id, users.name, users.email, users.role
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
        AND sessions.expires_at > ?
      LIMIT 1
    `)
    .get(tokenHash, new Date().toISOString()) as Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: 'admin',
  };
}

export function readSpreadsheetSyncStatus(): SpreadsheetSyncStatus {
  const row = database.prepare('SELECT * FROM sync_config WHERE id = 1').get() as SyncRow | undefined;

  return {
    enabled: Boolean(row?.enabled ?? 0),
    status: row?.status ?? 'idle',
    filePath: row?.file_path ?? null,
    fileType: row?.file_type ?? null,
    csvTarget: row?.csv_target ?? null,
    lastSyncAt: row?.last_sync_at ?? null,
    lastError: row?.last_error ?? null,
    supportedSheets: SUPPORTED_SHEETS,
  };
}

export function writeSpreadsheetSyncStatus(patch: Partial<SpreadsheetSyncStatus>) {
  const current = readSpreadsheetSyncStatus();
  const next: SpreadsheetSyncStatus = {
    ...current,
    ...patch,
    supportedSheets: SUPPORTED_SHEETS,
  };

  database.prepare(`
    INSERT INTO sync_config (
      id,
      enabled,
      status,
      file_path,
      file_type,
      csv_target,
      last_sync_at,
      last_error,
      updated_at
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      enabled = excluded.enabled,
      status = excluded.status,
      file_path = excluded.file_path,
      file_type = excluded.file_type,
      csv_target = excluded.csv_target,
      last_sync_at = excluded.last_sync_at,
      last_error = excluded.last_error,
      updated_at = excluded.updated_at
  `).run(
    next.enabled ? 1 : 0,
    next.status,
    next.filePath,
    next.fileType,
    next.csvTarget,
    next.lastSyncAt,
    next.lastError,
    new Date().toISOString(),
  );

  return next;
}

export function resetDashboardState() {
  return writeAppState(createDefaultAppState());
}

export { database, SUPPORTED_SHEETS };
