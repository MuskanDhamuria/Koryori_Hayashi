import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalyticsBundle, AppState } from '../types';
import { formatCurrency, formatNumber, formatPercent } from './format';

function download(filename: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value: string | number) {
  const stringValue = String(value ?? '');
  return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
}

export function exportDashboardCsv(state: AppState, analytics: AnalyticsBundle) {
  const rows: Array<Array<string | number>> = [
    ['Section', 'Metric', 'Value'],
    ['Summary', 'Daily revenue', analytics.summary.dailyRevenue],
    ['Summary', 'Weekly revenue', analytics.summary.weeklyRevenue],
    ['Summary', 'Monthly revenue', analytics.summary.monthlyRevenue],
    ['Summary', 'Gross margin', analytics.summary.grossMargin],
    ['Summary', 'Best seller', analytics.summary.bestSellerName],
    ['Summary', 'Slow mover', analytics.summary.slowMoverName],
    ['Summary', 'Peak hour', analytics.summary.peakHourLabel],
    ['Summary', 'Stockout risk count', analytics.summary.stockoutRiskCount],
    [],
    ['Forecast', 'Item', 'Forecast units', 'Expected revenue', 'Expected profit'],
    ...analytics.forecasts.map((entry) => ['Forecast', entry.name, entry.totalUnits, entry.expectedRevenue, entry.expectedProfit]),
    [],
    ['Reorders', 'Ingredient', 'Weekly usage', 'Recommended order', 'Projected ending inventory', 'Stockout risk'],
    ...analytics.reorderRecommendations.map((item) => [
      'Reorders',
      item.name,
      item.projectedWeeklyUsage,
      item.recommendedOrderQuantity,
      item.projectedEndingInventory,
      item.stockoutRisk ? 'Yes' : 'No',
    ]),
    [],
    ['Waste', 'Ingredient', 'Days of cover', 'Shelf life days', 'Projected waste', 'Severity'],
    ...analytics.wasteAlerts.map((item) => [
      'Waste',
      item.name,
      item.daysOfCover,
      item.shelfLifeDays,
      item.projectedWasteQuantity,
      item.severity,
    ]),
    [],
    ['Menu Items', 'Name', 'Category', 'Price', 'Unit cost', 'Prep minutes'],
    ...state.menuItems.map((item) => ['Menu Items', item.name, item.category, item.price, item.unitCost, item.prepMinutes]),
    [],
    ['Inventory', 'Name', 'On hand', 'Unit', 'Safety stock', 'Lead time days', 'Pack size'],
    ...state.inventoryItems.map((item) => [
      'Inventory',
      item.name,
      item.onHand,
      item.unit,
      item.safetyStock,
      item.leadTimeDays,
      item.packSize,
    ]),
    [],
    ['Sales', 'Timestamp', 'Menu item', 'Quantity', 'Note'],
    ...state.salesRecords.map((sale) => [
      'Sales',
      sale.timestamp,
      state.menuItems.find((item) => item.id === sale.menuItemId)?.name ?? sale.menuItemId,
      sale.quantity,
      sale.note,
    ]),
  ];

  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
  download(`smart-analytics-dashboard-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8;');
}

export function exportDashboardPdf(state: AppState, analytics: AnalyticsBundle) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const currency = state.settings.currencyCode;

  doc.setFontSize(18);
  doc.text('Smart Analytics & AI Forecasting Dashboard', 40, 42);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date(analytics.generatedAt).toLocaleString()}`, 40, 60);

  autoTable(doc, {
    startY: 78,
    head: [['Metric', 'Value']],
    body: [
      ['Daily revenue', formatCurrency(analytics.summary.dailyRevenue, currency)],
      ['Weekly revenue', formatCurrency(analytics.summary.weeklyRevenue, currency)],
      ['Monthly revenue', formatCurrency(analytics.summary.monthlyRevenue, currency)],
      ['Gross margin', formatPercent(analytics.summary.grossMargin)],
      ['Best seller', analytics.summary.bestSellerName],
      ['Slow mover', analytics.summary.slowMoverName],
      ['Peak hour', analytics.summary.peakHourLabel],
      ['Stockout risk count', String(analytics.summary.stockoutRiskCount)],
    ],
    theme: 'grid',
    styles: { fontSize: 9 },
  });

  const afterSummary = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 78) + 18;

  autoTable(doc, {
    startY: afterSummary,
    head: [['Forecast item', 'Units next week', 'Forecast revenue', 'Forecast profit']],
    body: analytics.forecasts.slice(0, 8).map((item) => [
      item.name,
      formatNumber(item.totalUnits, 0),
      formatCurrency(item.expectedRevenue, currency),
      formatCurrency(item.expectedProfit, currency),
    ]),
    theme: 'striped',
    styles: { fontSize: 9 },
  });

  const afterForecast = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? afterSummary) + 18;

  autoTable(doc, {
    startY: afterForecast,
    head: [['Ingredient', 'Weekly usage', 'Recommended order', 'Ending inventory', 'Stockout risk']],
    body: analytics.reorderRecommendations.slice(0, 8).map((item) => [
      item.name,
      `${formatNumber(item.projectedWeeklyUsage, 1)} ${item.unit}`,
      `${formatNumber(item.recommendedOrderQuantity, 1)} ${item.unit}`,
      `${formatNumber(item.projectedEndingInventory, 1)} ${item.unit}`,
      item.stockoutRisk ? 'Yes' : 'No',
    ]),
    theme: 'striped',
    styles: { fontSize: 9 },
  });

  const afterInventory = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? afterForecast) + 18;

  autoTable(doc, {
    startY: afterInventory,
    head: [['Menu item', 'Current margin', 'Target margin', 'Suggested price', 'Potential weekly profit lift']],
    body: analytics.marginInsights.slice(0, 6).map((item) => [
      item.name,
      formatPercent(item.currentMargin),
      formatPercent(item.targetMargin),
      formatCurrency(item.suggestedPrice, currency),
      formatCurrency(item.potentialWeeklyProfitLift, currency),
    ]),
    theme: 'striped',
    styles: { fontSize: 9 },
  });

  doc.save(`smart-analytics-dashboard-${new Date().toISOString().slice(0, 10)}.pdf`);
}
