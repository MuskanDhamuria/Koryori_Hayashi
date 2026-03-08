import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AssistantPanel } from './components/AssistantPanel';
import { AuthPanel } from './components/AuthPanel';
import { EditableColumn, EditableTable } from './components/EditableTable';
import { MetricCard } from './components/MetricCard';
import { SectionCard } from './components/SectionCard';
import { SyncPanel } from './components/SyncPanel';
import {
  createBlankInventoryItem,
  createBlankMenuItem,
  createBlankRecipeLine,
  createBlankSaleRecord,
} from './data/defaultData';
import {
  fetchDashboard,
  fetchSession,
  fetchSpreadsheetStatus,
  login as loginRequest,
  logout as logoutRequest,
  registerFirstUser,
  resetDashboard,
  saveDashboard,
  startSpreadsheetWatch,
  stopSpreadsheetWatch,
} from './lib/api';
import {
  AiContextPayload,
  AppState,
  AuthUser,
  InventoryItem,
  MenuItem,
  RecipeLine,
  SaleRecord,
  SpreadsheetSyncConfig,
  SpreadsheetSyncStatus,
  StreamMessage,
} from './types';
import { buildAnalytics } from './utils/analytics';
import { exportDashboardCsv, exportDashboardPdf } from './utils/export';
import {
  formatCurrency,
  formatDateLabel,
  formatDateTimeInput,
  formatDateTimeLabel,
  formatNumber,
  formatPercent,
} from './utils/format';

type RevenueGrain = 'day' | 'week' | 'month';
type AnalysisWindow = 14 | 30 | 60 | 'all';
type DataTab = 'sales' | 'menu' | 'inventory' | 'recipes' | 'settings';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function sortSales(records: SaleRecord[]) {
  return [...records].sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());
}

function getInitialSaleDraft(state: AppState) {
  return {
    menuItemId: state.menuItems[0]?.id ?? '',
    timestamp: formatDateTimeInput(new Date()),
    quantity: 1,
    note: 'Manual input',
  };
}

function saveStatusLabel(status: SaveStatus) {
  switch (status) {
    case 'saving':
      return 'Saving to database…';
    case 'saved':
      return 'Saved to database';
    case 'error':
      return 'Save failed';
    default:
      return 'Changes sync automatically';
  }
}

interface DashboardAppProps {
  user: AuthUser;
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  saveStatus: SaveStatus;
  syncStatus: SpreadsheetSyncStatus | null;
  syncBusy: boolean;
  streamMessage: string | null;
  appError: string | null;
  onRefreshData: () => Promise<void>;
  onResetData: () => Promise<void>;
  onStartSync: (config: SpreadsheetSyncConfig) => Promise<void>;
  onStopSync: () => Promise<void>;
  onRefreshSync: () => Promise<void>;
  onLogout: () => Promise<void>;
}

function DashboardApp({
  user,
  state,
  setState,
  saveStatus,
  syncStatus,
  syncBusy,
  streamMessage,
  appError,
  onRefreshData,
  onResetData,
  onStartSync,
  onStopSync,
  onRefreshSync,
  onLogout,
}: DashboardAppProps) {
  const [analysisWindow, setAnalysisWindow] = useState<AnalysisWindow>(30);
  const [revenueGrain, setRevenueGrain] = useState<RevenueGrain>('day');
  const [activeTab, setActiveTab] = useState<DataTab>('sales');
  const [selectedForecastItemId, setSelectedForecastItemId] = useState<string>('all');
  const [saleDraft, setSaleDraft] = useState(() => getInitialSaleDraft(state));

  useEffect(() => {
    if (!state.menuItems.some((item) => item.id === saleDraft.menuItemId)) {
      setSaleDraft((current) => ({
        ...current,
        menuItemId: state.menuItems[0]?.id ?? '',
      }));
    }

    if (selectedForecastItemId !== 'all' && !state.menuItems.some((item) => item.id === selectedForecastItemId)) {
      setSelectedForecastItemId('all');
    }
  }, [saleDraft.menuItemId, selectedForecastItemId, state.menuItems]);

  const analytics = useMemo(
    () => buildAnalytics(state, analysisWindow, revenueGrain),
    [analysisWindow, revenueGrain, state],
  );

  const currencyCode = state.settings.currencyCode;
  const menuOptions = useMemo(
    () => state.menuItems.map((item) => ({ label: item.name, value: item.id })),
    [state.menuItems],
  );
  const inventoryOptions = useMemo(
    () => state.inventoryItems.map((item) => ({ label: item.name, value: item.id })),
    [state.inventoryItems],
  );

  const salesPreview = useMemo(
    () => [...state.salesRecords].sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()).slice(0, 30),
    [state.salesRecords],
  );

  const forecastChartData = useMemo(() => {
    const selectedForecasts =
      selectedForecastItemId === 'all'
        ? analytics.forecasts
        : analytics.forecasts.filter((forecast) => forecast.menuItemId === selectedForecastItemId);

    const points = new Map<string, { date: string; label: string; units: number; revenue: number }>();

    selectedForecasts.forEach((forecast) => {
      forecast.daily.forEach((day) => {
        const current = points.get(day.date) ?? {
          date: day.date,
          label: formatDateLabel(`${day.date}T00:00:00`),
          units: 0,
          revenue: 0,
        };
        current.units += day.units;
        current.revenue += day.revenue;
        points.set(day.date, current);
      });
    });

    return [...points.values()].sort((left, right) => left.date.localeCompare(right.date));
  }, [analytics.forecasts, selectedForecastItemId]);

  const topItemsForMarginChart = useMemo(
    () => analytics.itemPerformance.slice(0, 6).map((item) => ({ ...item, marginPct: Number((item.margin * 100).toFixed(1)) })),
    [analytics.itemPerformance],
  );

  const aiContext = useMemo<AiContextPayload>(
    () => ({
      summary: analytics.summary,
      topItems: analytics.itemPerformance.slice(0, 5).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        revenue: item.revenue,
        margin: item.margin,
      })),
      slowItems: [...analytics.itemPerformance]
        .sort((left, right) => left.quantity - right.quantity)
        .slice(0, 5)
        .map((item) => ({ name: item.name, quantity: item.quantity, margin: item.margin })),
      forecastHighlights: analytics.forecasts.slice(0, 5).map((item) => ({
        name: item.name,
        totalUnits: item.totalUnits,
        expectedRevenue: item.expectedRevenue,
      })),
      slotForecast: analytics.slotForecast.slice(0, 12).map((slot) => ({
        label: slot.label,
        averageDailyUnits: slot.averageDailyUnits,
        recommendedStaff: slot.recommendedStaff,
        isPeak: slot.isPeak,
      })),
      inventoryRisks: analytics.reorderRecommendations.slice(0, 8).map((item) => ({
        name: item.name,
        recommendedOrderQuantity: item.recommendedOrderQuantity,
        stockoutRisk: item.stockoutRisk,
        projectedEndingInventory: item.projectedEndingInventory,
      })),
      wasteAlerts: analytics.wasteAlerts.slice(0, 5).map((item) => ({
        name: item.name,
        unit: item.unit,
        daysOfCover: item.daysOfCover,
        projectedWasteQuantity: item.projectedWasteQuantity,
        severity: item.severity,
      })),
      marginInsights: analytics.marginInsights.slice(0, 5).map((item) => ({
        name: item.name,
        currentMargin: item.currentMargin,
        targetMargin: item.targetMargin,
        potentialWeeklyProfitLift: item.potentialWeeklyProfitLift,
      })),
    }),
    [analytics],
  );

  function updateMenuItem(id: string, key: keyof MenuItem & string, value: string | number) {
    setState((current) => ({
      ...current,
      menuItems: current.menuItems.map((item) => (item.id === id ? ({ ...item, [key]: value } as MenuItem) : item)),
    }));
  }

  function updateInventoryItem(id: string, key: keyof InventoryItem & string, value: string | number) {
    setState((current) => ({
      ...current,
      inventoryItems: current.inventoryItems.map((item) =>
        item.id === id ? ({ ...item, [key]: value } as InventoryItem) : item,
      ),
    }));
  }

  function updateRecipeLine(id: string, key: keyof RecipeLine & string, value: string | number) {
    setState((current) => ({
      ...current,
      recipes: current.recipes.map((recipe) => (recipe.id === id ? ({ ...recipe, [key]: value } as RecipeLine) : recipe)),
    }));
  }

  function updateSaleRecord(id: string, key: keyof SaleRecord & string, value: string | number) {
    setState((current) => ({
      ...current,
      salesRecords: sortSales(
        current.salesRecords.map((sale) =>
          sale.id === id
            ? ({
                ...sale,
                [key]: key === 'timestamp' ? new Date(String(value)).toISOString() : value,
              } as SaleRecord)
            : sale,
        ),
      ),
    }));
  }

  function addQuickSale() {
    if (!saleDraft.menuItemId) {
      return;
    }

    const nextSale: SaleRecord = {
      id: crypto.randomUUID(),
      menuItemId: saleDraft.menuItemId,
      quantity: Math.max(1, Number(saleDraft.quantity) || 1),
      timestamp: new Date(saleDraft.timestamp).toISOString(),
      note: saleDraft.note || 'Manual input',
    };

    setState((current) => ({
      ...current,
      salesRecords: sortSales([...current.salesRecords, nextSale]),
    }));

    setSaleDraft((current) => ({
      ...current,
      timestamp: formatDateTimeInput(new Date()),
      quantity: 1,
      note: 'Manual input',
    }));
  }

  function removeMenuItem(id: string) {
    setState((current) => ({
      ...current,
      menuItems: current.menuItems.filter((item) => item.id !== id),
      salesRecords: current.salesRecords.filter((sale) => sale.menuItemId !== id),
      recipes: current.recipes.filter((recipe) => recipe.menuItemId !== id),
    }));
  }

  function removeInventoryItem(id: string) {
    setState((current) => ({
      ...current,
      inventoryItems: current.inventoryItems.filter((item) => item.id !== id),
      recipes: current.recipes.filter((recipe) => recipe.inventoryItemId !== id),
    }));
  }

  function removeRecipeLine(id: string) {
    setState((current) => ({
      ...current,
      recipes: current.recipes.filter((recipe) => recipe.id !== id),
    }));
  }

  function removeSaleRecord(id: string) {
    setState((current) => ({
      ...current,
      salesRecords: current.salesRecords.filter((sale) => sale.id !== id),
    }));
  }

  async function resetData() {
    if (!window.confirm('Reset the dashboard to the seeded sample dataset in the database?')) {
      return;
    }

    await onResetData();
    setSaleDraft(getInitialSaleDraft(state));
  }

  const menuColumns: EditableColumn<MenuItem>[] = [
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price', type: 'number', step: '0.01' },
    { key: 'unitCost', label: 'Unit cost', type: 'number', step: '0.01' },
    { key: 'prepMinutes', label: 'Prep mins', type: 'number', step: '1' },
  ];

  const inventoryColumns: EditableColumn<InventoryItem>[] = [
    { key: 'name', label: 'Ingredient' },
    { key: 'unit', label: 'Unit' },
    { key: 'onHand', label: 'On hand', type: 'number', step: '0.1' },
    { key: 'unitCost', label: 'Unit cost', type: 'number', step: '0.01' },
    { key: 'safetyStock', label: 'Safety stock', type: 'number', step: '0.1' },
    { key: 'leadTimeDays', label: 'Lead time', type: 'number', step: '1' },
    { key: 'packSize', label: 'Pack size', type: 'number', step: '0.1' },
    { key: 'shelfLifeDays', label: 'Shelf life', type: 'number', step: '1' },
  ];

  const recipeColumns: EditableColumn<RecipeLine>[] = [
    { key: 'menuItemId', label: 'Menu item', type: 'select', options: menuOptions },
    { key: 'inventoryItemId', label: 'Ingredient', type: 'select', options: inventoryOptions },
    { key: 'quantityPerItem', label: 'Usage per item', type: 'number', step: '0.01' },
  ];

  const salesColumns: EditableColumn<SaleRecord>[] = [
    { key: 'menuItemId', label: 'Menu item', type: 'select', options: menuOptions },
    {
      key: 'timestamp',
      label: 'Timestamp',
      render: (row) => (
        <input
          type="datetime-local"
          value={formatDateTimeInput(row.timestamp)}
          onChange={(event) => updateSaleRecord(row.id, 'timestamp', event.target.value)}
        />
      ),
    },
    { key: 'quantity', label: 'Quantity', type: 'number', step: '1' },
    { key: 'note', label: 'Note' },
  ];

  return (
    <div className="app-shell">
      <header className="hero">
        <div className="hero__copy">
          <span className="eyebrow">Smart Analytics, Secure Login, and Live Spreadsheet Sync</span>
          <h1>Operational intelligence with a database-backed dashboard and real-time spreadsheet ingestion.</h1>
          <p>
            Signed in as {user.name} ({user.email}). Every edit updates the in-memory dashboard immediately, then autosaves to the local SQLite database. Optional CSV/XLSX watching can also push live changes into the app whenever the watched file is saved.
          </p>
          <div className="status-row">
            <span className={`status-chip ${saveStatus === 'saved' ? 'status-chip--success' : saveStatus === 'error' ? 'status-chip--danger' : 'status-chip--warning'}`}>
              {saveStatusLabel(saveStatus)}
            </span>
            <span className={`status-chip ${syncStatus?.status === 'watching' ? 'status-chip--success' : syncStatus?.status === 'error' ? 'status-chip--danger' : 'status-chip--warning'}`}>
              Spreadsheet watcher: {syncStatus?.status ?? 'idle'}
            </span>
          </div>
        </div>
        <div className="hero__actions">
          <button type="button" className="button" onClick={() => exportDashboardCsv(state, analytics)}>
            Export CSV
          </button>
          <button type="button" className="button button--secondary" onClick={() => exportDashboardPdf(state, analytics)}>
            Export PDF
          </button>
          <button type="button" className="button button--ghost" onClick={() => void onRefreshData()}>
            Reload database
          </button>
          <button type="button" className="button button--ghost" onClick={() => void onLogout()}>
            Log out
          </button>
        </div>
      </header>

      {streamMessage ? <div className="banner banner--info">{streamMessage}</div> : null}
      {appError ? <div className="banner banner--danger">{appError}</div> : null}

      <SectionCard
        title="Database sync and spreadsheet integration"
        subtitle="Secure session auth, autosave to SQLite, and optional live CSV/XLSX ingestion from a watched local file"
      >
        <div className="dashboard-grid dashboard-grid--two-wide-right">
          <SyncPanel status={syncStatus} loading={syncBusy} onStart={onStartSync} onStop={onStopSync} onRefresh={onRefreshSync} />
          <div className="insight-list">
            <div className="insight-item">
              <strong>How the live sync works</strong>
              <p>
                The browser cannot silently crawl arbitrary laptop files, so the backend watches one user-approved path. When that CSV or Excel file is saved, the backend reparses it and replaces the matching entities in SQLite.
              </p>
            </div>
            <div className="insight-item">
              <strong>Workbook-friendly format</strong>
              <p>
                For Excel workbooks, add sheets named <code>menuItems</code>, <code>inventoryItems</code>, <code>salesRecords</code>, <code>recipes</code>, and <code>settings</code>. For CSV, pick which entity the file should overwrite.
              </p>
            </div>
            <div className="insight-item">
              <strong>Secure access layer</strong>
              <p>
                The dashboard now requires a login. Users are stored in SQLite and authenticated with secure, HTTP-only session cookies issued by the backend.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      <section className="control-bar">
        <label>
          Analysis window
          <select
            value={String(analysisWindow)}
            onChange={(event) => setAnalysisWindow(event.target.value === 'all' ? 'all' : (Number(event.target.value) as AnalysisWindow))}
          >
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="all">All data</option>
          </select>
        </label>

        <label>
          Revenue grain
          <select value={revenueGrain} onChange={(event) => setRevenueGrain(event.target.value as RevenueGrain)}>
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
        </label>

        <label>
          Forecast focus
          <select value={selectedForecastItemId} onChange={(event) => setSelectedForecastItemId(event.target.value)}>
            <option value="all">All menu items</option>
            {state.menuItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="control-bar__meta">
          {state.salesRecords.length} sales records · {analytics.filteredSalesCount} included in the current analysis window
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard label="Daily revenue" value={formatCurrency(analytics.summary.dailyRevenue, currencyCode)} hint="Latest trading day" />
        <MetricCard label="Weekly revenue" value={formatCurrency(analytics.summary.weeklyRevenue, currencyCode)} hint="Trailing 7 days" />
        <MetricCard label="Monthly revenue" value={formatCurrency(analytics.summary.monthlyRevenue, currencyCode)} hint="Trailing 30 days" />
        <MetricCard label="Gross margin" value={formatPercent(analytics.summary.grossMargin)} hint="Revenue less unit cost" />
        <MetricCard label="Best seller" value={analytics.summary.bestSellerName} hint="Highest units sold" />
        <MetricCard label="Slow mover" value={analytics.summary.slowMoverName} hint="Lowest units sold" />
        <MetricCard label="Peak hour" value={analytics.summary.peakHourLabel} hint="Most units sold" />
        <MetricCard label="Stockout risks" value={analytics.summary.stockoutRiskCount} hint="Ingredients below projected need" />
      </section>

      <section className="dashboard-grid dashboard-grid--two">
        <SectionCard title="Revenue performance" subtitle="Daily, weekly, or monthly revenue and profit tracking">
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.revenueSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="profit" name="Profit" stroke="#16a34a" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Hourly sales analysis" subtitle="Average daily units sold by hour to expose service peaks">
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.hourlySeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="averageDailyQuantity" name="Avg daily units" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Seasonal trend visualization" subtitle="Average revenue by weekday to highlight recurring demand patterns">
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.seasonalSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="averageRevenue" name="Average revenue" fill="#ea580c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Best sellers, slow movers, and margins" subtitle="Top-selling items with margin visibility to support pricing decisions">
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topItemsForMarginChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={65} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantity" name="Units sold" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="marginPct" name="Margin %" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </section>

      <section className="dashboard-grid dashboard-grid--two-wide-right">
        <SectionCard title="Demand forecasting engine" subtitle="Weighted moving average + regression + weekday seasonality blended into next-week sales predictions">
          <div className="chart-wrapper chart-wrapper--compact">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={forecastChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="units" name="Forecast units" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="revenue" name="Forecast revenue" stroke="#60a5fa" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mini-table">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Next-week units</th>
                  <th>Expected revenue</th>
                  <th>Trend slope</th>
                </tr>
              </thead>
              <tbody>
                {analytics.forecasts.slice(0, 8).map((forecast) => (
                  <tr key={forecast.menuItemId}>
                    <td>{forecast.name}</td>
                    <td>{formatNumber(forecast.totalUnits, 1)}</td>
                    <td>{formatCurrency(forecast.expectedRevenue, currencyCode)}</td>
                    <td>{formatNumber(forecast.regressionSlope, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <div className="stacked-panels">
          <SectionCard title="Trend and peak analysis" subtitle="Forecast demand by hour and recommend staffing for busy periods">
            <div className="mini-table">
              <table>
                <thead>
                  <tr>
                    <th>Hour</th>
                    <th>Avg daily units</th>
                    <th>Weekly units</th>
                    <th>Recommended staff</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.slotForecast.filter((slot) => slot.isPeak).map((slot) => (
                    <tr key={slot.hour}>
                      <td>{slot.label}</td>
                      <td>{formatNumber(slot.averageDailyUnits, 1)}</td>
                      <td>{formatNumber(slot.weeklyUnits, 1)}</td>
                      <td>{slot.recommendedStaff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="AI assistant" subtitle="Gemini receives the live dashboard context to answer operational questions">
            <AssistantPanel context={aiContext} />
          </SectionCard>
        </div>
      </section>

      <SectionCard title="Inventory optimization" subtitle="Automated purchase recommendations, stockout flags, waste alerts, and margin opportunities">
        <div className="dashboard-grid dashboard-grid--three">
          <div>
            <h3>Reorder recommendations</h3>
            <div className="mini-table">
              <table>
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Weekly usage</th>
                    <th>Recommended order</th>
                    <th>Ending inventory</th>
                    <th>Cover days</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.reorderRecommendations.slice(0, 8).map((item) => (
                    <tr key={item.inventoryItemId} className={item.stockoutRisk ? 'row-alert' : ''}>
                      <td>{item.name}</td>
                      <td>{formatNumber(item.projectedWeeklyUsage, 1)} {item.unit}</td>
                      <td>{formatNumber(item.recommendedOrderQuantity, 1)} {item.unit}</td>
                      <td>{formatNumber(item.projectedEndingInventory, 1)} {item.unit}</td>
                      <td>{Number.isFinite(item.daysOfCover) ? formatNumber(item.daysOfCover, 1) : '∞'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3>Waste reduction alerts</h3>
            <div className="insight-list">
              {analytics.wasteAlerts.length === 0 ? (
                <div className="insight-item">No waste alerts are currently triggered by the projected cover-days logic.</div>
              ) : (
                analytics.wasteAlerts.slice(0, 6).map((alert) => (
                  <div key={alert.inventoryItemId} className={`insight-item ${alert.severity === 'high' ? 'insight-item--danger' : 'insight-item--warning'}`}>
                    <strong>{alert.name}</strong>
                    <p>
                      {formatNumber(alert.daysOfCover, 1)} days of cover against {alert.shelfLifeDays} shelf-life days. Projected waste: {formatNumber(alert.projectedWasteQuantity, 1)} {alert.unit}.
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3>Margin improvement insights</h3>
            <div className="insight-list">
              {analytics.marginInsights.length === 0 ? (
                <div className="insight-item">All visible menu items are already meeting the configured target margin.</div>
              ) : (
                analytics.marginInsights.map((insight) => (
                  <div key={insight.menuItemId} className="insight-item">
                    <strong>{insight.name}</strong>
                    <p>{insight.issue}</p>
                    <p>
                      Current margin {formatPercent(insight.currentMargin)} · Target {formatPercent(insight.targetMargin)} · Suggested price {formatCurrency(insight.suggestedPrice, currencyCode)} · Potential weekly lift {formatCurrency(insight.potentialWeeklyProfitLift, currencyCode)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Real-time editing and inputs" subtitle="Edit the operational model directly. Every chart, forecast, reorder suggestion, export, and database save updates automatically.">
        <div className="tab-bar">
          {(['sales', 'menu', 'inventory', 'recipes', 'settings'] as DataTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`tab-bar__button ${activeTab === tab ? 'tab-bar__button--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'sales' ? (
          <div className="dashboard-grid dashboard-grid--two">
            <div className="quick-entry-card">
              <h3>Quick sales input</h3>
              <div className="form-grid">
                <label>
                  Menu item
                  <select
                    value={saleDraft.menuItemId}
                    onChange={(event) => setSaleDraft((current) => ({ ...current, menuItemId: event.target.value }))}
                  >
                    {menuOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Timestamp
                  <input
                    type="datetime-local"
                    value={saleDraft.timestamp}
                    onChange={(event) => setSaleDraft((current) => ({ ...current, timestamp: event.target.value }))}
                  />
                </label>
                <label>
                  Quantity
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={saleDraft.quantity}
                    onChange={(event) => setSaleDraft((current) => ({ ...current, quantity: Number(event.target.value) }))}
                  />
                </label>
                <label>
                  Note
                  <input
                    type="text"
                    value={saleDraft.note}
                    onChange={(event) => setSaleDraft((current) => ({ ...current, note: event.target.value }))}
                  />
                </label>
              </div>
              <button type="button" className="button" onClick={addQuickSale}>
                Add live sale input
              </button>
            </div>

            <div>
              <h3>Recent sales feed</h3>
              <EditableTable
                rows={salesPreview}
                columns={salesColumns}
                onChange={updateSaleRecord}
                onRemove={removeSaleRecord}
                onAdd={() => setState((current) => ({
                  ...current,
                  salesRecords: sortSales([...current.salesRecords, createBlankSaleRecord(current.menuItems)]),
                }))}
                addLabel="Add blank sales row"
              />
            </div>
          </div>
        ) : null}

        {activeTab === 'menu' ? (
          <EditableTable
            rows={state.menuItems}
            columns={menuColumns}
            onChange={updateMenuItem}
            onRemove={removeMenuItem}
            onAdd={() => setState((current) => ({ ...current, menuItems: [...current.menuItems, createBlankMenuItem()] }))}
            addLabel="Add menu item"
          />
        ) : null}

        {activeTab === 'inventory' ? (
          <EditableTable
            rows={state.inventoryItems}
            columns={inventoryColumns}
            onChange={updateInventoryItem}
            onRemove={removeInventoryItem}
            onAdd={() => setState((current) => ({ ...current, inventoryItems: [...current.inventoryItems, createBlankInventoryItem()] }))}
            addLabel="Add ingredient"
          />
        ) : null}

        {activeTab === 'recipes' ? (
          <EditableTable
            rows={state.recipes}
            columns={recipeColumns}
            onChange={updateRecipeLine}
            onRemove={removeRecipeLine}
            onAdd={() => setState((current) => ({
              ...current,
              recipes: [...current.recipes, createBlankRecipeLine(current.menuItems, current.inventoryItems)],
            }))}
            addLabel="Add recipe mapping"
          />
        ) : null}

        {activeTab === 'settings' ? (
          <div className="form-grid form-grid--settings">
            <label>
              Currency code
              <input
                type="text"
                value={state.settings.currencyCode}
                onChange={(event) => setState((current) => ({
                  ...current,
                  settings: { ...current.settings, currencyCode: event.target.value.toUpperCase() },
                }))}
              />
            </label>
            <label>
              Orders per staff hour
              <input
                type="number"
                min="1"
                step="1"
                value={state.settings.ordersPerStaffHour}
                onChange={(event) => setState((current) => ({
                  ...current,
                  settings: { ...current.settings, ordersPerStaffHour: Number(event.target.value) },
                }))}
              />
            </label>
            <label>
              Target gross margin
              <input
                type="number"
                min="0"
                max="0.95"
                step="0.01"
                value={state.settings.targetMargin}
                onChange={(event) => setState((current) => ({
                  ...current,
                  settings: { ...current.settings, targetMargin: Number(event.target.value) },
                }))}
              />
            </label>
            <label>
              Forecast horizon days
              <input
                type="number"
                min="1"
                max="30"
                step="1"
                value={state.settings.forecastHorizonDays}
                onChange={(event) => setState((current) => ({
                  ...current,
                  settings: { ...current.settings, forecastHorizonDays: Number(event.target.value) },
                }))}
              />
            </label>
            <label>
              Waste cover threshold days
              <input
                type="number"
                min="1"
                max="60"
                step="1"
                value={state.settings.wasteCoverThresholdDays}
                onChange={(event) => setState((current) => ({
                  ...current,
                  settings: { ...current.settings, wasteCoverThresholdDays: Number(event.target.value) },
                }))}
              />
            </label>
            <label>
              Regression blend
              <input
                type="number"
                min="0"
                max="1"
                step="0.05"
                value={state.settings.regressionBlend}
                onChange={(event) => setState((current) => ({
                  ...current,
                  settings: { ...current.settings, regressionBlend: Number(event.target.value) },
                }))}
              />
            </label>
          </div>
        ) : null}
      </SectionCard>

      <footer className="footer-note">
        <p>
          Latest quick-sale timestamp: {salesPreview[0] ? formatDateTimeLabel(salesPreview[0].timestamp) : 'No sales yet'} · Currency: {currencyCode}
        </p>
        <p>
          {saveStatusLabel(saveStatus)} · Database session user: {user.email}
        </p>
        <div className="footer-actions">
          <button type="button" className="button button--ghost" onClick={resetData}>
            Reset seeded data in database
          </button>
        </div>
      </footer>
    </div>
  );
}

function App() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [state, setState] = useState<AppState | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [syncStatus, setSyncStatus] = useState<SpreadsheetSyncStatus | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);
  const [streamMessage, setStreamMessage] = useState<string | null>(null);
  const lastSavedSnapshot = useRef<string>('');
  const streamTimeout = useRef<number | null>(null);

  const loadSession = useCallback(async () => {
    setSessionLoading(true);
    setAuthError(null);

    try {
      const session = await fetchSession();
      setSetupRequired(session.setupRequired);
      setUser(session.user);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to read the current session.');
    } finally {
      setSessionLoading(false);
    }
  }, []);

  const loadDashboardData = useCallback(async () => {
    setDataLoading(true);
    setAppError(null);

    try {
      const dashboard = await fetchDashboard();
      lastSavedSnapshot.current = JSON.stringify(dashboard);
      setState(dashboard);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Unable to load the dashboard from the database.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  const loadSpreadsheetStatus = useCallback(async () => {
    try {
      const status = await fetchSpreadsheetStatus();
      setSyncStatus(status);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Unable to read spreadsheet sync status.');
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!user) {
      setState(null);
      setSyncStatus(null);
      return;
    }

    void loadDashboardData();
    void loadSpreadsheetStatus();
  }, [loadDashboardData, loadSpreadsheetStatus, user]);

  useEffect(() => {
    if (!user || !state) {
      return;
    }

    const snapshot = JSON.stringify(state);
    if (snapshot === lastSavedSnapshot.current) {
      return;
    }

    setSaveStatus('saving');
    const timer = window.setTimeout(async () => {
      try {
        await saveDashboard(state);
        lastSavedSnapshot.current = snapshot;
        setSaveStatus('saved');
        window.setTimeout(() => {
          setSaveStatus((current) => (current === 'saved' ? 'idle' : current));
        }, 1600);
      } catch (error) {
        setSaveStatus('error');
        setAppError(error instanceof Error ? error.message : 'Unable to save the dashboard to the database.');
      }
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [state, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const stream = new EventSource('/api/stream', { withCredentials: true });

    stream.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as StreamMessage;
        if (message.message === 'stream-connected') {
          return;
        }

        setStreamMessage(message.message);
        if (streamTimeout.current) {
          window.clearTimeout(streamTimeout.current);
        }
        streamTimeout.current = window.setTimeout(() => setStreamMessage(null), 6000);

        if (message.type === 'spreadsheet.synced' || message.type === 'spreadsheet.error' || message.type === 'system.notice') {
          void loadSpreadsheetStatus();
        }

        if (message.type === 'spreadsheet.synced' || message.message.includes('reset')) {
          void loadDashboardData();
        }
      } catch {
        // Ignore malformed stream messages.
      }
    };

    stream.onerror = () => {
      stream.close();
    };

    return () => {
      stream.close();
      if (streamTimeout.current) {
        window.clearTimeout(streamTimeout.current);
      }
    };
  }, [loadDashboardData, loadSpreadsheetStatus, user]);

  async function handleRegister(payload: { name: string; email: string; password: string }) {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const session = await registerFirstUser(payload);
      setSetupRequired(session.setupRequired);
      setUser(session.user);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to create the first admin account.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogin(payload: { email: string; password: string }) {
    setAuthBusy(true);
    setAuthError(null);
    try {
      const session = await loginRequest(payload);
      setSetupRequired(session.setupRequired);
      setUser(session.user);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Login failed.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    setAuthBusy(true);
    setAuthError(null);
    try {
      await logoutRequest();
      setUser(null);
      setState(null);
      setSyncStatus(null);
      setSaveStatus('idle');
      await loadSession();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to log out.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleResetData() {
    try {
      const dashboard = await resetDashboard();
      lastSavedSnapshot.current = JSON.stringify(dashboard);
      setState(dashboard);
      setSaveStatus('saved');
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Unable to reset dashboard data.');
    }
  }

  async function handleStartSync(config: SpreadsheetSyncConfig) {
    setSyncBusy(true);
    setAppError(null);
    try {
      const status = await startSpreadsheetWatch(config);
      setSyncStatus(status);
      await loadDashboardData();
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Unable to start the spreadsheet watcher.');
    } finally {
      setSyncBusy(false);
    }
  }

  async function handleStopSync() {
    setSyncBusy(true);
    setAppError(null);
    try {
      const status = await stopSpreadsheetWatch();
      setSyncStatus(status);
    } catch (error) {
      setAppError(error instanceof Error ? error.message : 'Unable to stop the spreadsheet watcher.');
    } finally {
      setSyncBusy(false);
    }
  }

  async function handleRefreshSync() {
    setSyncBusy(true);
    try {
      await loadSpreadsheetStatus();
    } finally {
      setSyncBusy(false);
    }
  }

  const updateDashboardState: Dispatch<SetStateAction<AppState>> = (next) => {
    setState((current) => {
      if (!current) {
        return current;
      }

      return typeof next === 'function' ? (next as (previous: AppState) => AppState)(current) : next;
    });
  };

  if (sessionLoading) {
    return <div className="loading-shell">Loading secure session…</div>;
  }

  if (!user) {
    return <AuthPanel setupRequired={setupRequired} loading={authBusy} error={authError} onLogin={handleLogin} onRegister={handleRegister} />;
  }

  if (dataLoading || !state) {
    return <div className="loading-shell">Loading dashboard data from SQLite…</div>;
  }

  return (
    <DashboardApp
      user={user}
      state={state}
      setState={updateDashboardState}
      saveStatus={saveStatus}
      syncStatus={syncStatus}
      syncBusy={syncBusy}
      streamMessage={streamMessage}
      appError={appError}
      onRefreshData={loadDashboardData}
      onResetData={handleResetData}
      onStartSync={handleStartSync}
      onStopSync={handleStopSync}
      onRefreshSync={handleRefreshSync}
      onLogout={handleLogout}
    />
  );
}

export default App;
