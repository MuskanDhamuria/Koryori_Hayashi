import chokidar, { type FSWatcher } from 'chokidar';
import { basename, extname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import XLSX from 'xlsx';
import { config as appConfig } from './config.js';
import {
  applyPartialAppState,
  readAppState,
  readSpreadsheetSyncStatus,
  writeSpreadsheetSyncStatus,
} from './db.js';
import type {
  AppState,
  InventoryItem,
  MenuItem,
  OpsSettings,
  RecipeLine,
  SaleRecord,
  SpreadsheetEntity,
  SpreadsheetSyncConfig,
  SpreadsheetSyncStatus,
  StreamMessage,
} from '../src/types.js';

const SHEET_NAME_ALIASES: Record<SpreadsheetEntity, string[]> = {
  menuItems: ['menuitems', 'menuitem', 'menu', 'items'],
  inventoryItems: ['inventoryitems', 'inventoryitem', 'inventory', 'ingredients'],
  salesRecords: ['salesrecords', 'salesrecord', 'sales', 'orders'],
  recipes: ['recipes', 'recipe'],
  settings: ['settings', 'config', 'configuration'],
};

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function rowToMap(row: Record<string, unknown>) {
  return Object.entries(row).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
    accumulator[normalizeKey(key)] = value;
    return accumulator;
  }, {});
}

function readField(row: Record<string, unknown>, aliases: string[]) {
  for (const alias of aliases) {
    const value = row[normalizeKey(alias)];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return undefined;
}

function coerceString(value: unknown, fallback = '') {
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value).trim() || fallback;
}

function coerceNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function slugId(prefix: string, seed: string) {
  const slug = seed
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return `${prefix}-${slug || 'item'}`;
}

function parseTimestamp(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsedCode = XLSX.SSF.parse_date_code(value);
    if (parsedCode) {
      const date = new Date(Date.UTC(parsedCode.y, parsedCode.m - 1, parsedCode.d, parsedCode.H, parsedCode.M, Math.floor(parsedCode.S)));
      return date.toISOString();
    }
  }

  const raw = String(value ?? '').trim();
  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function dedupeById<T extends { id: string }>(rows: T[]) {
  const map = new Map<string, T>();
  rows.forEach((row) => map.set(row.id, row));
  return [...map.values()];
}

function buildMenuLookup(items: MenuItem[]) {
  const byName = new Map<string, string>();
  items.forEach((item) => {
    byName.set(normalizeKey(item.name), item.id);
  });
  return byName;
}

function buildInventoryLookup(items: InventoryItem[]) {
  const byName = new Map<string, string>();
  items.forEach((item) => {
    byName.set(normalizeKey(item.name), item.id);
  });
  return byName;
}

function parseMenuItems(rows: Record<string, unknown>[]) {
  const parsed: MenuItem[] = [];

  rows.forEach((sourceRow) => {
    const row = rowToMap(sourceRow);
    const name = coerceString(readField(row, ['name', 'itemname', 'menuitemname']));
    if (!name) {
      return;
    }

    parsed.push({
      id: coerceString(readField(row, ['id', 'menuitemid']), slugId('menu', name)),
      name,
      category: coerceString(readField(row, ['category', 'segment']), 'Uncategorized'),
      price: coerceNumber(readField(row, ['price', 'sellingprice']), 0),
      unitCost: coerceNumber(readField(row, ['unitcost', 'cost', 'foodcost']), 0),
      prepMinutes: coerceNumber(readField(row, ['prepminutes', 'prep', 'preptime']), 0),
    });
  });

  return dedupeById(parsed);
}

function parseInventoryItems(rows: Record<string, unknown>[]) {
  const parsed: InventoryItem[] = [];

  rows.forEach((sourceRow) => {
    const row = rowToMap(sourceRow);
    const name = coerceString(readField(row, ['name', 'ingredient', 'ingredientname']));
    if (!name) {
      return;
    }

    parsed.push({
      id: coerceString(readField(row, ['id', 'inventoryitemid', 'ingredientid']), slugId('inv', name)),
      name,
      unit: coerceString(readField(row, ['unit']), 'unit'),
      onHand: coerceNumber(readField(row, ['onhand', 'stock', 'available']), 0),
      unitCost: coerceNumber(readField(row, ['unitcost', 'cost']), 0),
      safetyStock: coerceNumber(readField(row, ['safetystock', 'minimumstock']), 0),
      leadTimeDays: coerceNumber(readField(row, ['leadtimedays', 'leadtime']), 1),
      packSize: coerceNumber(readField(row, ['packsize', 'pack']), 1),
      shelfLifeDays: coerceNumber(readField(row, ['shelflifedays', 'shelflife']), 7),
    });
  });

  return dedupeById(parsed);
}

function parseSalesRecords(rows: Record<string, unknown>[], menuItems: MenuItem[]) {
  const menuLookup = buildMenuLookup(menuItems);
  const parsed: SaleRecord[] = [];

  rows.forEach((sourceRow, index) => {
    const row = rowToMap(sourceRow);
    const explicitId = coerceString(readField(row, ['id', 'saleid']));
    const directMenuId = coerceString(readField(row, ['menuitemid', 'itemid']));
    const menuName = coerceString(readField(row, ['menuitemname', 'itemname', 'name']));
    const menuItemId = directMenuId || menuLookup.get(normalizeKey(menuName)) || '';
    const timestamp = parseTimestamp(readField(row, ['timestamp', 'datetime', 'date', 'soldat']));

    if (!menuItemId || !timestamp) {
      return;
    }

    const quantity = Math.max(1, coerceNumber(readField(row, ['quantity', 'qty', 'units']), 1));
    const note = coerceString(readField(row, ['note', 'remarks', 'source']), 'Spreadsheet sync');

    parsed.push({
      id: explicitId || `sale-${menuItemId}-${timestamp}-${index}`,
      menuItemId,
      timestamp,
      quantity,
      note,
    });
  });

  return dedupeById(parsed);
}

function parseRecipes(rows: Record<string, unknown>[], menuItems: MenuItem[], inventoryItems: InventoryItem[]) {
  const menuLookup = buildMenuLookup(menuItems);
  const inventoryLookup = buildInventoryLookup(inventoryItems);
  const parsed: RecipeLine[] = [];

  rows.forEach((sourceRow) => {
    const row = rowToMap(sourceRow);
    const explicitId = coerceString(readField(row, ['id', 'recipeid']));
    const directMenuId = coerceString(readField(row, ['menuitemid', 'itemid']));
    const directInventoryId = coerceString(readField(row, ['inventoryitemid', 'ingredientid']));
    const menuName = coerceString(readField(row, ['menuitemname', 'itemname']));
    const inventoryName = coerceString(readField(row, ['inventoryitemname', 'ingredientname', 'ingredient']));
    const menuItemId = directMenuId || menuLookup.get(normalizeKey(menuName)) || '';
    const inventoryItemId = directInventoryId || inventoryLookup.get(normalizeKey(inventoryName)) || '';

    if (!menuItemId || !inventoryItemId) {
      return;
    }

    parsed.push({
      id: explicitId || `${menuItemId}-${inventoryItemId}`,
      menuItemId,
      inventoryItemId,
      quantityPerItem: coerceNumber(readField(row, ['quantityperitem', 'usageperitem', 'usage', 'quantity']), 0),
    });
  });

  return dedupeById(parsed);
}

function parseSettings(rows: Record<string, unknown>[], currentSettings: OpsSettings) {
  const nextSettings: OpsSettings = { ...currentSettings };

  if (rows.length === 1) {
    const row = rowToMap(rows[0]);
    if (Object.keys(row).some((key) => ['currencycode', 'ordersperstaffhour', 'targetmargin', 'forecasthorizondays', 'wastecoverthresholddays', 'regressionblend'].includes(key))) {
      nextSettings.currencyCode = coerceString(readField(row, ['currencycode', 'currency']), currentSettings.currencyCode).toUpperCase();
      nextSettings.ordersPerStaffHour = coerceNumber(readField(row, ['ordersperstaffhour', 'ordersperstaff']), currentSettings.ordersPerStaffHour);
      nextSettings.targetMargin = coerceNumber(readField(row, ['targetmargin', 'margin']), currentSettings.targetMargin);
      nextSettings.forecastHorizonDays = Math.max(1, Math.round(coerceNumber(readField(row, ['forecasthorizondays', 'horizon']), currentSettings.forecastHorizonDays)));
      nextSettings.wasteCoverThresholdDays = Math.max(1, Math.round(coerceNumber(readField(row, ['wastecoverthresholddays', 'wastethreshold']), currentSettings.wasteCoverThresholdDays)));
      nextSettings.regressionBlend = coerceNumber(readField(row, ['regressionblend', 'blend']), currentSettings.regressionBlend);
      return nextSettings;
    }
  }

  rows.forEach((sourceRow) => {
    const row = rowToMap(sourceRow);
    const key = normalizeKey(coerceString(readField(row, ['key', 'setting', 'name'])));
    const value = readField(row, ['value']);

    if (!key) {
      return;
    }

    switch (key) {
      case 'currencycode':
      case 'currency':
        nextSettings.currencyCode = coerceString(value, currentSettings.currencyCode).toUpperCase();
        break;
      case 'ordersperstaffhour':
      case 'ordersperstaff':
        nextSettings.ordersPerStaffHour = coerceNumber(value, currentSettings.ordersPerStaffHour);
        break;
      case 'targetmargin':
      case 'margin':
        nextSettings.targetMargin = coerceNumber(value, currentSettings.targetMargin);
        break;
      case 'forecasthorizondays':
      case 'horizon':
        nextSettings.forecastHorizonDays = Math.max(1, Math.round(coerceNumber(value, currentSettings.forecastHorizonDays)));
        break;
      case 'wastecoverthresholddays':
      case 'wastethreshold':
        nextSettings.wasteCoverThresholdDays = Math.max(1, Math.round(coerceNumber(value, currentSettings.wasteCoverThresholdDays)));
        break;
      case 'regressionblend':
      case 'blend':
        nextSettings.regressionBlend = coerceNumber(value, currentSettings.regressionBlend);
        break;
      default:
        break;
    }
  });

  return nextSettings;
}

function readRowsFromSheet(sheet: XLSX.WorkSheet) {
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });
}

function inferFileType(filePath: string): SpreadsheetSyncConfig['fileType'] {
  const extension = extname(filePath).toLowerCase();
  if (extension === '.csv') {
    return 'csv';
  }
  if (extension === '.xlsx' || extension === '.xls') {
    return 'excel';
  }
  throw new Error('Only .csv, .xls, and .xlsx files can be watched.');
}

function parseSpreadsheet(config: SpreadsheetSyncConfig, currentState: AppState) {
  const workbook = XLSX.readFile(config.filePath, {
    cellDates: true,
    raw: false,
  });

  const partial: Partial<AppState> = {};
  const entitiesUpdated: SpreadsheetEntity[] = [];
  const workingState: AppState = {
    menuItems: [...currentState.menuItems],
    salesRecords: [...currentState.salesRecords],
    inventoryItems: [...currentState.inventoryItems],
    recipes: [...currentState.recipes],
    settings: { ...currentState.settings },
  };

  if (config.fileType === 'csv') {
    if (!config.csvTarget) {
      throw new Error('CSV sync needs a target entity such as salesRecords or inventoryItems.');
    }

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('The CSV file appears to be empty.');
    }
    const rows = readRowsFromSheet(workbook.Sheets[firstSheetName]);

    switch (config.csvTarget) {
      case 'menuItems':
        partial.menuItems = parseMenuItems(rows);
        break;
      case 'inventoryItems':
        partial.inventoryItems = parseInventoryItems(rows);
        break;
      case 'salesRecords':
        partial.salesRecords = parseSalesRecords(rows, workingState.menuItems);
        break;
      case 'recipes':
        partial.recipes = parseRecipes(rows, workingState.menuItems, workingState.inventoryItems);
        break;
      case 'settings':
        partial.settings = parseSettings(rows, workingState.settings);
        break;
      default:
        break;
    }

    entitiesUpdated.push(config.csvTarget);
    return { partial, entitiesUpdated };
  }

  const sheetLookup = new Map<string, string>();
  workbook.SheetNames.forEach((sheetName) => {
    sheetLookup.set(normalizeKey(sheetName), sheetName);
  });

  const resolvedSheets = (Object.keys(SHEET_NAME_ALIASES) as SpreadsheetEntity[])
    .map((entity) => ({
      entity,
      sheetName: SHEET_NAME_ALIASES[entity].map((alias) => sheetLookup.get(alias)).find(Boolean) ?? null,
    }))
    .filter((entry) => entry.sheetName !== null) as Array<{ entity: SpreadsheetEntity; sheetName: string }>;

  if (resolvedSheets.length === 0) {
    throw new Error('No supported sheets were found. Use sheet names like menuItems, inventoryItems, salesRecords, recipes, or settings.');
  }

  for (const entity of ['menuItems', 'inventoryItems', 'salesRecords', 'recipes', 'settings'] as SpreadsheetEntity[]) {
    const match = resolvedSheets.find((entry) => entry.entity === entity);
    if (!match) {
      continue;
    }

    const rows = readRowsFromSheet(workbook.Sheets[match.sheetName]);
    switch (entity) {
      case 'menuItems':
        workingState.menuItems = parseMenuItems(rows);
        partial.menuItems = workingState.menuItems;
        break;
      case 'inventoryItems':
        workingState.inventoryItems = parseInventoryItems(rows);
        partial.inventoryItems = workingState.inventoryItems;
        break;
      case 'salesRecords':
        workingState.salesRecords = parseSalesRecords(rows, workingState.menuItems);
        partial.salesRecords = workingState.salesRecords;
        break;
      case 'recipes':
        workingState.recipes = parseRecipes(rows, workingState.menuItems, workingState.inventoryItems);
        partial.recipes = workingState.recipes;
        break;
      case 'settings':
        workingState.settings = parseSettings(rows, workingState.settings);
        partial.settings = workingState.settings;
        break;
      default:
        break;
    }

    entitiesUpdated.push(entity);
  }

  return { partial, entitiesUpdated };
}

function normalizeConfig(input: SpreadsheetSyncConfig): SpreadsheetSyncConfig {
  const filePath = input.filePath.trim();
  if (!filePath) {
    throw new Error('Please provide the path to the CSV/XLSX file to watch.');
  }

  const resolvedPath = resolve(appConfig.projectRoot, filePath);
  const fileType = input.fileType ?? inferFileType(resolvedPath);

  if (!existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  if (fileType === 'csv' && !input.csvTarget) {
    throw new Error('CSV live sync requires a target entity.');
  }

  return {
    filePath: resolvedPath,
    fileType,
    csvTarget: fileType === 'csv' ? input.csvTarget : undefined,
  };
}

export class SpreadsheetSyncManager {
  private watcher: FSWatcher | null = null;
  private activeConfig: SpreadsheetSyncConfig | null = null;

  constructor(private readonly notify: (message: StreamMessage) => void) {}

  getStatus() {
    return readSpreadsheetSyncStatus();
  }

  async startWatching(input: SpreadsheetSyncConfig) {
    const normalized = normalizeConfig(input);
    await this.stopWatching(false);
    this.activeConfig = normalized;

    writeSpreadsheetSyncStatus({
      enabled: true,
      status: 'syncing',
      filePath: normalized.filePath,
      fileType: normalized.fileType,
      csvTarget: normalized.csvTarget ?? null,
      lastError: null,
    });

    const initialSyncOk = await this.syncNow('Initial spreadsheet sync completed.');
    if (!initialSyncOk) {
      await this.stopWatching(false);
      throw new Error(this.getStatus().lastError ?? 'Initial spreadsheet sync failed.');
    }

    this.watcher = chokidar.watch(normalized.filePath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 700,
        pollInterval: 100,
      },
    });

    this.watcher.on('add', () => {
      void this.syncNow('Spreadsheet added or restored.');
    });
    this.watcher.on('change', () => {
      void this.syncNow('Spreadsheet changes detected and imported.');
    });
    this.watcher.on('unlink', () => {
      writeSpreadsheetSyncStatus({
        enabled: true,
        status: 'error',
        lastError: 'The watched spreadsheet was removed or moved.',
      });
      this.notify({
        type: 'spreadsheet.error',
        timestamp: new Date().toISOString(),
        message: 'The watched spreadsheet was removed or moved.',
      });
    });

    writeSpreadsheetSyncStatus({
      enabled: true,
      status: 'watching',
      filePath: normalized.filePath,
      fileType: normalized.fileType,
      csvTarget: normalized.csvTarget ?? null,
      lastError: null,
    });

    return this.getStatus();
  }

  async stopWatching(markStopped = true) {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    this.activeConfig = null;

    if (markStopped) {
      writeSpreadsheetSyncStatus({
        enabled: false,
        status: 'stopped',
      });
    }

    return this.getStatus();
  }

  async resumeFromDatabase() {
    const status = readSpreadsheetSyncStatus();
    if (!status.enabled || !status.filePath || !status.fileType) {
      return;
    }

    try {
      await this.startWatching({
        filePath: status.filePath,
        fileType: status.fileType,
        csvTarget: status.csvTarget ?? undefined,
      });
    } catch (error) {
      writeSpreadsheetSyncStatus({
        enabled: true,
        status: 'error',
        lastError: error instanceof Error ? error.message : 'Unable to resume spreadsheet watcher.',
      });
    }
  }

  private async syncNow(successMessage: string) {
    if (!this.activeConfig) {
      return;
    }

    try {
      writeSpreadsheetSyncStatus({
        enabled: true,
        status: 'syncing',
        filePath: this.activeConfig.filePath,
        fileType: this.activeConfig.fileType,
        csvTarget: this.activeConfig.csvTarget ?? null,
        lastError: null,
      });

      const currentState = readAppState();
      const { partial, entitiesUpdated } = parseSpreadsheet(this.activeConfig, currentState);
      applyPartialAppState(partial);
      const syncedAt = new Date().toISOString();

      writeSpreadsheetSyncStatus({
        enabled: true,
        status: 'watching',
        filePath: this.activeConfig.filePath,
        fileType: this.activeConfig.fileType,
        csvTarget: this.activeConfig.csvTarget ?? null,
        lastSyncAt: syncedAt,
        lastError: null,
      });

      this.notify({
        type: 'spreadsheet.synced',
        timestamp: syncedAt,
        message: `${successMessage} Imported ${entitiesUpdated.join(', ')} from ${basename(this.activeConfig.filePath)}.`,
      });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Spreadsheet sync failed.';
      writeSpreadsheetSyncStatus({
        enabled: true,
        status: 'error',
        filePath: this.activeConfig.filePath,
        fileType: this.activeConfig.fileType,
        csvTarget: this.activeConfig.csvTarget ?? null,
        lastError: message,
      });
      this.notify({
        type: 'spreadsheet.error',
        timestamp: new Date().toISOString(),
        message,
      });
      return false;
    }
  }
}
