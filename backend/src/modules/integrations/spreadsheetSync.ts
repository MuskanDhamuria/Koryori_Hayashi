import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { existsSync, watch, type FSWatcher } from "node:fs";
import { dirname, resolve } from "node:path";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { broadcastIntegrationEvent } from "./events.js";

export type SpreadsheetEntity = "menuItems" | "inventoryItems";

export interface SpreadsheetSyncStatus {
  enabled: boolean;
  status: "idle" | "syncing" | "watching" | "stopped" | "error";
  filePath: string | null;
  csvTarget: SpreadsheetEntity | null;
  lastSyncAt: string | null;
  lastError: string | null;
  supportedTargets: SpreadsheetEntity[];
}

interface SpreadsheetSyncRecord extends SpreadsheetSyncStatus {}

interface MenuRow {
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  description: string;
  imageUrl: string | null;
  isAvailable: boolean;
  isHighMargin: boolean;
  isNew: boolean;
  spicyLevel: number | null;
}

interface InventoryRow {
  menuLookup: {
    sku: string | null;
    id: string | null;
    name: string | null;
  };
  ingredientName: string;
  stockOnHand: number;
  reorderPoint: number;
  unit: string;
  expiresInHours: number | null;
}

const SUPPORTED_TARGETS: SpreadsheetEntity[] = ["menuItems", "inventoryItems"];

function defaultStatus(): SpreadsheetSyncStatus {
  return {
    enabled: false,
    status: "idle",
    filePath: null,
    csvTarget: null,
    lastSyncAt: null,
    lastError: null,
    supportedTargets: SUPPORTED_TARGETS,
  };
}

function asErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected sync error";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "uncategorized";
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function coerceString(value: string | undefined, fallback = "") {
  const next = value?.trim();
  return next ? next : fallback;
}

function coerceNumber(value: string | undefined, fallback = 0) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function coerceBoolean(value: string | undefined, fallback = false) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function parseCsv(content: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
  }

  if (rows.length === 0) {
    return [];
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((header) => normalizeKey(header));

  return dataRows.map((dataRow) =>
    headers.reduce<Record<string, string>>((record, header, columnIndex) => {
      record[header] = dataRow[columnIndex] ?? "";
      return record;
    }, {}),
  );
}

function parseMenuRows(records: Array<Record<string, string>>) {
  return records.reduce<MenuRow[]>((rows, record, index) => {
    const name = coerceString(record.name ?? record.menuitemname, `Menu Item ${index + 1}`);
    const sku = coerceString(record.sku ?? record.id, slugify(name));
    if (!name || !sku) {
      return rows;
    }

    rows.push({
      sku,
      name,
      category: coerceString(record.category, "Uncategorized"),
      price: coerceNumber(record.price, 0),
      cost: coerceNumber(record.cost ?? record.unitcost, 0),
      description: coerceString(record.description),
      imageUrl: coerceString(record.imageurl) || null,
      isAvailable: coerceBoolean(record.isavailable, true),
      isHighMargin: coerceBoolean(record.ishighmargin, false),
      isNew: coerceBoolean(record.isnew, false),
      spicyLevel: record.spicylevel ? Math.round(coerceNumber(record.spicylevel)) : null,
    });

    return rows;
  }, []);
}

function parseInventoryRows(records: Array<Record<string, string>>) {
  return records.reduce<InventoryRow[]>((rows, record) => {
    const menuSku = coerceString(record.menuitemsku ?? record.sku);
    const menuId = coerceString(record.menuitemid) || null;
    const menuName = coerceString(record.menuitemname ?? record.name) || null;
    const ingredientName = coerceString(record.ingredientname ?? record.name, "");

    if (!menuSku && !menuId && !menuName) {
      return rows;
    }

    rows.push({
      menuLookup: {
        sku: menuSku || null,
        id: menuId,
        name: menuName,
      },
      ingredientName: ingredientName || menuName || "Unknown Ingredient",
      stockOnHand: Math.max(0, Math.round(coerceNumber(record.stockonhand ?? record.onhand, 0))),
      reorderPoint: Math.max(0, Math.round(coerceNumber(record.reorderpoint, 0))),
      unit: coerceString(record.unit, "portion"),
      expiresInHours: record.expiresinhours
        ? Math.max(0, Math.round(coerceNumber(record.expiresinhours)))
        : null,
    });

    return rows;
  }, []);
}

async function ensureStateDirectory() {
  await mkdir(dirname(env.SYNC_STATE_PATH), { recursive: true });
}

async function readStoredStatus() {
  try {
    const raw = await readFile(env.SYNC_STATE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<SpreadsheetSyncRecord>;
    return {
      ...defaultStatus(),
      ...parsed,
      supportedTargets: SUPPORTED_TARGETS,
    } satisfies SpreadsheetSyncStatus;
  } catch {
    return defaultStatus();
  }
}

async function writeStoredStatus(status: Partial<SpreadsheetSyncStatus>) {
  await ensureStateDirectory();
  const next = {
    ...(await readStoredStatus()),
    ...status,
    supportedTargets: SUPPORTED_TARGETS,
  } satisfies SpreadsheetSyncStatus;
  await writeFile(env.SYNC_STATE_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

async function resolveFilePath(inputPath: string) {
  const candidate = resolve(process.cwd(), inputPath);
  if (!existsSync(candidate)) {
    throw new Error(`CSV file not found: ${candidate}`);
  }

  const metadata = await stat(candidate);
  if (!metadata.isFile()) {
    throw new Error(`Expected a file path, got: ${candidate}`);
  }

  if (!candidate.toLowerCase().endsWith(".csv")) {
    throw new Error("Only CSV spreadsheet sync is supported in the current backend.");
  }

  return candidate;
}

async function syncMenuItems(rows: MenuRow[]) {
  for (const row of rows) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(row.category) },
      update: { name: row.category },
      create: {
        slug: slugify(row.category),
        name: row.category,
        description: `${row.category} items`,
      },
    });

    await prisma.menuItem.upsert({
      where: { sku: row.sku },
      update: {
        name: row.name,
        description: row.description,
        imageUrl: row.imageUrl,
        price: row.price,
        cost: row.cost,
        categoryId: category.id,
        isAvailable: row.isAvailable,
        isHighMargin: row.isHighMargin,
        isNew: row.isNew,
        spicyLevel: row.spicyLevel,
      },
      create: {
        sku: row.sku,
        name: row.name,
        description: row.description,
        imageUrl: row.imageUrl,
        price: row.price,
        cost: row.cost,
        categoryId: category.id,
        isAvailable: row.isAvailable,
        isHighMargin: row.isHighMargin,
        isNew: row.isNew,
        spicyLevel: row.spicyLevel,
        weatherTags: [],
      },
    });
  }
}

async function syncInventoryItems(rows: InventoryRow[]) {
  for (const row of rows) {
    const menuItem = row.menuLookup.id
      ? await prisma.menuItem.findUnique({ where: { id: row.menuLookup.id } })
      : row.menuLookup.sku
        ? await prisma.menuItem.findUnique({ where: { sku: row.menuLookup.sku } })
        : row.menuLookup.name
          ? await prisma.menuItem.findFirst({
              where: {
                name: {
                  equals: row.menuLookup.name,
                  mode: "insensitive",
                },
              },
            })
          : null;

    if (!menuItem) {
      throw new Error(
        `Unable to match inventory row to a menu item: ${row.menuLookup.sku ?? row.menuLookup.id ?? row.menuLookup.name ?? "unknown"}`,
      );
    }

    await prisma.inventoryItem.upsert({
      where: { menuItemId: menuItem.id },
      update: {
        ingredientName: row.ingredientName,
        stockOnHand: row.stockOnHand,
        reorderPoint: row.reorderPoint,
        unit: row.unit,
        expiresInHours: row.expiresInHours,
      },
      create: {
        menuItemId: menuItem.id,
        ingredientName: row.ingredientName,
        stockOnHand: row.stockOnHand,
        reorderPoint: row.reorderPoint,
        unit: row.unit,
        expiresInHours: row.expiresInHours,
      },
    });
  }
}

export class SpreadsheetSyncManager {
  private watcher: FSWatcher | null = null;
  private activeFilePath: string | null = null;
  private activeTarget: SpreadsheetEntity | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  async getStatus() {
    return readStoredStatus();
  }

  async startWatching(filePath: string, csvTarget: SpreadsheetEntity) {
    const resolvedPath = await resolveFilePath(filePath);

    await this.stopWatching(false);
    this.activeFilePath = resolvedPath;
    this.activeTarget = csvTarget;

    await writeStoredStatus({
      enabled: true,
      status: "syncing",
      filePath: resolvedPath,
      csvTarget,
      lastError: null,
    });

    await this.syncNow("Initial spreadsheet sync completed.");

    this.watcher = watch(resolvedPath, () => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(() => {
        void this.syncNow("Spreadsheet changes detected and imported.");
      }, 500);
    });

    return writeStoredStatus({
      enabled: true,
      status: "watching",
      filePath: resolvedPath,
      csvTarget,
      lastError: null,
    });
  }

  async stopWatching(markStopped = true) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.activeFilePath = null;
    this.activeTarget = null;

    if (markStopped) {
      return writeStoredStatus({
        enabled: false,
        status: "stopped",
        filePath: null,
        csvTarget: null,
      });
    }

    return this.getStatus();
  }

  async resumeFromState() {
    const status = await this.getStatus();
    if (!status.enabled || !status.filePath || !status.csvTarget) {
      return;
    }

    try {
      await this.startWatching(status.filePath, status.csvTarget);
    } catch (error) {
      const message = asErrorMessage(error);
      await writeStoredStatus({
        enabled: true,
        status: "error",
        lastError: message,
      });
      broadcastIntegrationEvent({
        type: "spreadsheet.error",
        timestamp: new Date().toISOString(),
        message,
      });
    }
  }

  async syncNow(successMessage = "Spreadsheet imported.") {
    if (!this.activeFilePath || !this.activeTarget) {
      throw new Error("Spreadsheet watcher is not active.");
    }

    try {
      await writeStoredStatus({
        enabled: true,
        status: "syncing",
        filePath: this.activeFilePath,
        csvTarget: this.activeTarget,
        lastError: null,
      });

      const content = await readFile(this.activeFilePath, "utf8");
      const records = parseCsv(content);

      if (this.activeTarget === "menuItems") {
        await syncMenuItems(parseMenuRows(records));
      } else {
        await syncInventoryItems(parseInventoryRows(records));
      }

      const syncedAt = new Date().toISOString();
      const nextStatus = await writeStoredStatus({
        enabled: true,
        status: "watching",
        filePath: this.activeFilePath,
        csvTarget: this.activeTarget,
        lastError: null,
        lastSyncAt: syncedAt,
      });

      broadcastIntegrationEvent({
        type: "spreadsheet.synced",
        timestamp: syncedAt,
        message: `${successMessage} Imported ${this.activeTarget} from ${this.activeFilePath}.`,
        data: nextStatus,
      });

      return nextStatus;
    } catch (error) {
      const message = asErrorMessage(error);
      const nextStatus = await writeStoredStatus({
        enabled: true,
        status: "error",
        filePath: this.activeFilePath,
        csvTarget: this.activeTarget,
        lastError: message,
      });

      broadcastIntegrationEvent({
        type: "spreadsheet.error",
        timestamp: new Date().toISOString(),
        message,
        data: nextStatus,
      });

      throw error;
    }
  }
}

export const spreadsheetSyncManager = new SpreadsheetSyncManager();
