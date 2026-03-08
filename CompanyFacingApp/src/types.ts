export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  unitCost: number;
  prepMinutes: number;
}

export interface SaleRecord {
  id: string;
  menuItemId: string;
  timestamp: string;
  quantity: number;
  note: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  onHand: number;
  unitCost: number;
  safetyStock: number;
  leadTimeDays: number;
  packSize: number;
  shelfLifeDays: number;
}

export interface RecipeLine {
  id: string;
  menuItemId: string;
  inventoryItemId: string;
  quantityPerItem: number;
}

export interface OpsSettings {
  currencyCode: string;
  ordersPerStaffHour: number;
  targetMargin: number;
  forecastHorizonDays: number;
  wasteCoverThresholdDays: number;
  regressionBlend: number;
}

export interface AppState {
  menuItems: MenuItem[];
  salesRecords: SaleRecord[];
  inventoryItems: InventoryItem[];
  recipes: RecipeLine[];
  settings: OpsSettings;
}

export interface SummaryMetrics {
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  grossMargin: number;
  bestSellerName: string;
  slowMoverName: string;
  peakHourLabel: string;
  stockoutRiskCount: number;
}

export interface RevenuePoint {
  key: string;
  label: string;
  revenue: number;
  profit: number;
  orders: number;
}

export interface HourlyPoint {
  hour: number;
  label: string;
  revenue: number;
  quantity: number;
  transactions: number;
  averageDailyQuantity: number;
}

export interface SeasonalPoint {
  label: string;
  revenue: number;
  quantity: number;
  averageRevenue: number;
}

export interface ItemPerformance {
  menuItemId: string;
  name: string;
  category: string;
  quantity: number;
  revenue: number;
  profit: number;
  margin: number;
  avgDailyUnits: number;
}

export interface ForecastDayPoint {
  date: string;
  units: number;
  revenue: number;
}

export interface ForecastEntry {
  menuItemId: string;
  name: string;
  category: string;
  totalUnits: number;
  expectedRevenue: number;
  expectedProfit: number;
  regressionSlope: number;
  daily: ForecastDayPoint[];
}

export interface SlotForecast {
  hour: number;
  label: string;
  weeklyUnits: number;
  averageDailyUnits: number;
  recommendedStaff: number;
  isPeak: boolean;
}

export interface ReorderRecommendation {
  inventoryItemId: string;
  name: string;
  unit: string;
  projectedWeeklyUsage: number;
  demandDuringLeadTime: number;
  projectedEndingInventory: number;
  rawReorderQuantity: number;
  recommendedOrderQuantity: number;
  stockoutRisk: boolean;
  daysOfCover: number;
}

export interface WasteAlert {
  inventoryItemId: string;
  name: string;
  unit: string;
  daysOfCover: number;
  shelfLifeDays: number;
  projectedWasteQuantity: number;
  severity: 'high' | 'medium';
}

export interface MarginInsight {
  menuItemId: string;
  name: string;
  currentMargin: number;
  targetMargin: number;
  suggestedPrice: number;
  potentialWeeklyProfitLift: number;
  issue: string;
}

export interface AnalyticsBundle {
  summary: SummaryMetrics;
  revenueSeries: RevenuePoint[];
  hourlySeries: HourlyPoint[];
  seasonalSeries: SeasonalPoint[];
  itemPerformance: ItemPerformance[];
  forecasts: ForecastEntry[];
  slotForecast: SlotForecast[];
  reorderRecommendations: ReorderRecommendation[];
  wasteAlerts: WasteAlert[];
  marginInsights: MarginInsight[];
  generatedAt: string;
  filteredSalesCount: number;
}

export interface AiContextPayload {
  summary: SummaryMetrics;
  topItems: Array<Pick<ItemPerformance, 'name' | 'quantity' | 'revenue' | 'margin'>>;
  slowItems: Array<Pick<ItemPerformance, 'name' | 'quantity' | 'margin'>>;
  forecastHighlights: Array<Pick<ForecastEntry, 'name' | 'totalUnits' | 'expectedRevenue'>>;
  slotForecast: Array<Pick<SlotForecast, 'label' | 'averageDailyUnits' | 'recommendedStaff' | 'isPeak'>>;
  inventoryRisks: Array<Pick<ReorderRecommendation, 'name' | 'recommendedOrderQuantity' | 'stockoutRisk' | 'projectedEndingInventory'>>;
  wasteAlerts: Array<Pick<WasteAlert, 'name' | 'unit' | 'daysOfCover' | 'projectedWasteQuantity' | 'severity'>>;
  marginInsights: Array<Pick<MarginInsight, 'name' | 'currentMargin' | 'targetMargin' | 'potentialWeeklyProfitLift'>>;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}

export interface AuthSessionResponse {
  authenticated: boolean;
  setupRequired: boolean;
  user: AuthUser | null;
}

export type SpreadsheetEntity = 'menuItems' | 'inventoryItems' | 'salesRecords' | 'recipes' | 'settings';
export type SpreadsheetFileType = 'csv' | 'excel';
export type SpreadsheetSyncState = 'idle' | 'watching' | 'syncing' | 'error' | 'stopped';

export interface SpreadsheetSyncConfig {
  filePath: string;
  fileType?: SpreadsheetFileType;
  csvTarget?: SpreadsheetEntity;
}

export interface SpreadsheetSyncStatus {
  enabled: boolean;
  status: SpreadsheetSyncState;
  filePath: string | null;
  fileType: SpreadsheetFileType | null;
  csvTarget: SpreadsheetEntity | null;
  lastSyncAt: string | null;
  lastError: string | null;
  supportedSheets: SpreadsheetEntity[];
}

export interface ApiResponse<T> {
  ok: boolean;
  message: string;
  data: T;
}

export interface StreamMessage {
  type: 'spreadsheet.synced' | 'spreadsheet.error' | 'system.notice';
  timestamp: string;
  message: string;
}
