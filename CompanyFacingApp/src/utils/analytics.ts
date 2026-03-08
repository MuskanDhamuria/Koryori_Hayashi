import {
  AnalyticsBundle,
  AppState,
  ForecastDayPoint,
  ForecastEntry,
  HourlyPoint,
  ItemPerformance,
  MarginInsight,
  MenuItem,
  ReorderRecommendation,
  RevenuePoint,
  SeasonalPoint,
  SlotForecast,
  SummaryMetrics,
  WasteAlert,
} from '../types';
import { formatDateLabel, formatMonthLabel, pad, toDateKey, toMonthKey } from './format';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface EnrichedSale {
  id: string;
  menuItemId: string;
  name: string;
  category: string;
  timestamp: string;
  quantity: number;
  revenue: number;
  profit: number;
}

function startOfDay(input: string | Date) {
  const date = new Date(input);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(input: Date, days: number) {
  const date = new Date(input);
  date.setDate(date.getDate() + days);
  return date;
}

function startOfWeek(input: string | Date) {
  const date = startOfDay(input);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return date;
}

function weekKey(dateInput: string | Date) {
  return toDateKey(startOfWeek(dateInput));
}

function hourLabel(hour: number) {
  return `${pad(hour)}:00`;
}

function clampPositive(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function weightedMovingAverage(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const weights = values.map((_, index) => index + 1);
  const numerator = values.reduce((sum, value, index) => sum + value * weights[index], 0);
  const denominator = weights.reduce((sum, value) => sum + value, 0);
  return numerator / denominator;
}

function linearRegression(values: number[]) {
  if (values.length <= 1) {
    return { slope: 0, intercept: values[0] ?? 0 };
  }

  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let denominator = 0;

  values.forEach((value, index) => {
    numerator += (index - xMean) * (value - yMean);
    denominator += (index - xMean) ** 2;
  });

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;

  return { slope, intercept };
}

function enrichSales(state: AppState) {
  const menuMap = new Map(state.menuItems.map((item) => [item.id, item]));
  const sales: EnrichedSale[] = [];

  for (const sale of state.salesRecords) {
    const menuItem = menuMap.get(sale.menuItemId);
    if (!menuItem || !Number.isFinite(sale.quantity) || sale.quantity <= 0) {
      continue;
    }

    sales.push({
      id: sale.id,
      menuItemId: sale.menuItemId,
      name: menuItem.name,
      category: menuItem.category,
      timestamp: sale.timestamp,
      quantity: sale.quantity,
      revenue: sale.quantity * menuItem.price,
      profit: sale.quantity * (menuItem.price - menuItem.unitCost),
    });
  }

  return sales.sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());
}

function filterSalesByWindow(sales: EnrichedSale[], analysisWindowDays: number | 'all') {
  if (analysisWindowDays === 'all' || sales.length === 0) {
    return sales;
  }

  const latest = startOfDay(sales[sales.length - 1].timestamp);
  const threshold = addDays(latest, -(analysisWindowDays - 1));
  return sales.filter((sale) => new Date(sale.timestamp) >= threshold);
}

function buildSummary(sales: EnrichedSale[], reorderRecommendations: ReorderRecommendation[]): SummaryMetrics {
  if (!sales.length) {
    return {
      dailyRevenue: 0,
      weeklyRevenue: 0,
      monthlyRevenue: 0,
      grossMargin: 0,
      bestSellerName: 'No data',
      slowMoverName: 'No data',
      peakHourLabel: 'No data',
      stockoutRiskCount: reorderRecommendations.filter((item) => item.stockoutRisk).length,
    };
  }

  const latestDay = toDateKey(sales[sales.length - 1].timestamp);
  const latestDate = startOfDay(sales[sales.length - 1].timestamp);
  const weekThreshold = addDays(latestDate, -6);
  const monthThreshold = addDays(latestDate, -29);

  let dailyRevenue = 0;
  let weeklyRevenue = 0;
  let monthlyRevenue = 0;
  let revenue = 0;
  let profit = 0;

  const itemTotals = new Map<string, { name: string; quantity: number }>();
  const hourTotals = new Map<number, number>();

  for (const sale of sales) {
    const saleDate = new Date(sale.timestamp);
    const saleKey = toDateKey(saleDate);
    const total = itemTotals.get(sale.menuItemId) ?? { name: sale.name, quantity: 0 };
    total.quantity += sale.quantity;
    itemTotals.set(sale.menuItemId, total);

    hourTotals.set(saleDate.getHours(), (hourTotals.get(saleDate.getHours()) ?? 0) + sale.quantity);

    revenue += sale.revenue;
    profit += sale.profit;

    if (saleKey === latestDay) {
      dailyRevenue += sale.revenue;
    }
    if (saleDate >= weekThreshold) {
      weeklyRevenue += sale.revenue;
    }
    if (saleDate >= monthThreshold) {
      monthlyRevenue += sale.revenue;
    }
  }

  const bestSeller = [...itemTotals.values()].sort((left, right) => right.quantity - left.quantity)[0];
  const slowMover = [...itemTotals.values()].sort((left, right) => left.quantity - right.quantity)[0];
  const peakHour = [...hourTotals.entries()].sort((left, right) => right[1] - left[1])[0];

  return {
    dailyRevenue,
    weeklyRevenue,
    monthlyRevenue,
    grossMargin: revenue === 0 ? 0 : profit / revenue,
    bestSellerName: bestSeller?.name ?? 'No data',
    slowMoverName: slowMover?.name ?? 'No data',
    peakHourLabel: peakHour ? hourLabel(peakHour[0]) : 'No data',
    stockoutRiskCount: reorderRecommendations.filter((item) => item.stockoutRisk).length,
  };
}

function buildRevenueSeries(sales: EnrichedSale[], grain: 'day' | 'week' | 'month') {
  const groups = new Map<string, RevenuePoint>();

  sales.forEach((sale) => {
    const key = grain === 'day' ? toDateKey(sale.timestamp) : grain === 'week' ? weekKey(sale.timestamp) : toMonthKey(sale.timestamp);
    const current = groups.get(key) ?? {
      key,
      label:
        grain === 'day'
          ? formatDateLabel(sale.timestamp)
          : grain === 'week'
            ? `Week of ${formatDateLabel(startOfWeek(sale.timestamp))}`
            : formatMonthLabel(sale.timestamp),
      revenue: 0,
      profit: 0,
      orders: 0,
    };

    current.revenue += sale.revenue;
    current.profit += sale.profit;
    current.orders += sale.quantity;
    groups.set(key, current);
  });

  return [...groups.values()].sort((left, right) => left.key.localeCompare(right.key));
}

function buildHourlySeries(sales: EnrichedSale[]) {
  const totals = new Map<number, HourlyPoint>();
  const uniqueDays = new Set(sales.map((sale) => toDateKey(sale.timestamp))).size || 1;

  for (let hour = 0; hour < 24; hour += 1) {
    totals.set(hour, {
      hour,
      label: hourLabel(hour),
      revenue: 0,
      quantity: 0,
      transactions: 0,
      averageDailyQuantity: 0,
    });
  }

  sales.forEach((sale) => {
    const date = new Date(sale.timestamp);
    const point = totals.get(date.getHours());
    if (!point) {
      return;
    }

    point.revenue += sale.revenue;
    point.quantity += sale.quantity;
    point.transactions += 1;
  });

  return [...totals.values()].map((point) => ({
    ...point,
    averageDailyQuantity: point.quantity / uniqueDays,
  }));
}

function buildSeasonalSeries(sales: EnrichedSale[]) {
  const totals = new Map<number, { label: string; revenue: number; quantity: number; dayKeys: Set<string> }>();

  for (let index = 0; index < 7; index += 1) {
    totals.set(index, { label: WEEKDAY_LABELS[index], revenue: 0, quantity: 0, dayKeys: new Set<string>() });
  }

  sales.forEach((sale) => {
    const date = new Date(sale.timestamp);
    const current = totals.get(date.getDay());
    if (!current) {
      return;
    }

    current.revenue += sale.revenue;
    current.quantity += sale.quantity;
    current.dayKeys.add(toDateKey(sale.timestamp));
  });

  return [...totals.values()].map<SeasonalPoint>((point) => ({
    label: point.label,
    revenue: point.revenue,
    quantity: point.quantity,
    averageRevenue: point.dayKeys.size ? point.revenue / point.dayKeys.size : 0,
  }));
}

function buildItemPerformance(sales: EnrichedSale[]) {
  const totals = new Map<string, ItemPerformance>();
  const uniqueDays = new Set(sales.map((sale) => toDateKey(sale.timestamp))).size || 1;

  sales.forEach((sale) => {
    const current = totals.get(sale.menuItemId) ?? {
      menuItemId: sale.menuItemId,
      name: sale.name,
      category: sale.category,
      quantity: 0,
      revenue: 0,
      profit: 0,
      margin: 0,
      avgDailyUnits: 0,
    };

    current.quantity += sale.quantity;
    current.revenue += sale.revenue;
    current.profit += sale.profit;
    totals.set(sale.menuItemId, current);
  });

  return [...totals.values()]
    .map((entry) => ({
      ...entry,
      margin: entry.revenue === 0 ? 0 : entry.profit / entry.revenue,
      avgDailyUnits: entry.quantity / uniqueDays,
    }))
    .sort((left, right) => right.quantity - left.quantity);
}

function buildItemDailySeries(menuItems: MenuItem[], sales: EnrichedSale[]) {
  const dailyKeys = [...new Set(sales.map((sale) => toDateKey(sale.timestamp)))].sort();
  const totalsByItemAndDay = new Map<string, Map<string, number>>();

  menuItems.forEach((item) => totalsByItemAndDay.set(item.id, new Map<string, number>()));
  sales.forEach((sale) => {
    const itemMap = totalsByItemAndDay.get(sale.menuItemId);
    if (!itemMap) {
      return;
    }

    const key = toDateKey(sale.timestamp);
    itemMap.set(key, (itemMap.get(key) ?? 0) + sale.quantity);
  });

  return { dailyKeys, totalsByItemAndDay };
}

function buildWeekdayFactors(dailyKeys: string[], values: number[]) {
  const total = values.reduce((sum, value) => sum + value, 0);
  const overallAverage = values.length ? total / values.length : 0;
  const weekdaySums = new Array(7).fill(0);
  const weekdayCounts = new Array(7).fill(0);

  dailyKeys.forEach((key, index) => {
    const weekday = new Date(`${key}T00:00:00`).getDay();
    weekdaySums[weekday] += values[index] ?? 0;
    weekdayCounts[weekday] += 1;
  });

  return weekdaySums.map((sum, weekday) => {
    const average = weekdayCounts[weekday] ? sum / weekdayCounts[weekday] : overallAverage;
    if (!overallAverage || !Number.isFinite(average)) {
      return 1;
    }
    return Math.max(0.65, Math.min(1.45, average / overallAverage));
  });
}

function buildForecasts(state: AppState, sales: EnrichedSale[]) {
  const { dailyKeys, totalsByItemAndDay } = buildItemDailySeries(state.menuItems, sales);
  const latestDate = dailyKeys.length ? new Date(`${dailyKeys[dailyKeys.length - 1]}T00:00:00`) : startOfDay(new Date());

  return state.menuItems
    .map<ForecastEntry>((item) => {
      const seriesMap = totalsByItemAndDay.get(item.id) ?? new Map<string, number>();
      const seriesValues = dailyKeys.map((key) => seriesMap.get(key) ?? 0);
      const window = seriesValues.slice(-Math.min(14, seriesValues.length));
      const { slope, intercept } = linearRegression(seriesValues.length ? seriesValues : [0]);
      const movingAverage = weightedMovingAverage(window.length ? window : [0]);
      const weekdayFactors = buildWeekdayFactors(dailyKeys, seriesValues.length ? seriesValues : [0]);
      const daily: ForecastDayPoint[] = [];

      for (let dayOffset = 1; dayOffset <= state.settings.forecastHorizonDays; dayOffset += 1) {
        const forecastDate = addDays(latestDate, dayOffset);
        const weekdayFactor = weekdayFactors[forecastDate.getDay()] ?? 1;
        const regressionForecast = intercept + slope * (seriesValues.length - 1 + dayOffset);
        const blended =
          state.settings.regressionBlend * regressionForecast +
          (1 - state.settings.regressionBlend) * movingAverage;
        const units = clampPositive(Math.round(blended * weekdayFactor));

        daily.push({
          date: toDateKey(forecastDate),
          units,
          revenue: units * item.price,
        });
      }

      const totalUnits = daily.reduce((sum, point) => sum + point.units, 0);

      return {
        menuItemId: item.id,
        name: item.name,
        category: item.category,
        totalUnits,
        expectedRevenue: totalUnits * item.price,
        expectedProfit: totalUnits * (item.price - item.unitCost),
        regressionSlope: slope,
        daily,
      };
    })
    .sort((left, right) => right.totalUnits - left.totalUnits);
}

function buildSlotForecast(sales: EnrichedSale[], forecasts: ForecastEntry[], horizonDays: number, ordersPerStaffHour: number) {
  const totalForecastByDate = new Map<string, number>();
  forecasts.forEach((forecast) => {
    forecast.daily.forEach((point) => {
      totalForecastByDate.set(point.date, (totalForecastByDate.get(point.date) ?? 0) + point.units);
    });
  });

  const overallHourTotals = new Array(24).fill(0);
  const overallTotal = sales.reduce((sum, sale) => sum + sale.quantity, 0) || 1;
  const weekdayHourTotals = Array.from({ length: 7 }, () => new Array(24).fill(0));
  const weekdayTotals = new Array(7).fill(0);

  sales.forEach((sale) => {
    const date = new Date(sale.timestamp);
    const weekday = date.getDay();
    const hour = date.getHours();
    overallHourTotals[hour] += sale.quantity;
    weekdayHourTotals[weekday][hour] += sale.quantity;
    weekdayTotals[weekday] += sale.quantity;
  });

  const overallShare = overallHourTotals.map((value) => value / overallTotal);
  const forecastByHour = new Array(24).fill(0);

  totalForecastByDate.forEach((units, dateKey) => {
    const weekday = new Date(`${dateKey}T00:00:00`).getDay();
    const weekdayShare = weekdayTotals[weekday]
      ? weekdayHourTotals[weekday].map((value) => value / weekdayTotals[weekday])
      : overallShare;

    for (let hour = 0; hour < 24; hour += 1) {
      const share = weekdayShare[hour] || overallShare[hour] || 0;
      forecastByHour[hour] += units * share;
    }
  });

  const values = forecastByHour.map((value) => value / Math.max(horizonDays, 1));
  const ranked = [...values].sort((left, right) => right - left);
  const peakThreshold = ranked[Math.min(4, ranked.length - 1)] ?? 0;

  return forecastByHour
    .map<SlotForecast>((weeklyUnits, hour) => ({
      hour,
      label: hourLabel(hour),
      weeklyUnits,
      averageDailyUnits: weeklyUnits / Math.max(horizonDays, 1),
      recommendedStaff: weeklyUnits <= 0 ? 0 : Math.max(1, Math.ceil((weeklyUnits / Math.max(horizonDays, 1)) / Math.max(ordersPerStaffHour, 1))),
      isPeak: weeklyUnits / Math.max(horizonDays, 1) >= peakThreshold && weeklyUnits > 0,
    }))
    .filter((slot) => slot.weeklyUnits > 0.2);
}

function buildIngredientDemand(state: AppState, forecasts: ForecastEntry[]) {
  const ingredientDemand = new Map<string, number>();
  const forecastMap = new Map(forecasts.map((forecast) => [forecast.menuItemId, forecast.totalUnits]));

  state.recipes.forEach((recipe) => {
    const forecastUnits = forecastMap.get(recipe.menuItemId) ?? 0;
    const current = ingredientDemand.get(recipe.inventoryItemId) ?? 0;
    ingredientDemand.set(recipe.inventoryItemId, current + forecastUnits * recipe.quantityPerItem);
  });

  return ingredientDemand;
}

function buildReorderRecommendations(state: AppState, ingredientDemand: Map<string, number>) {
  return state.inventoryItems
    .map<ReorderRecommendation>((inventoryItem) => {
      const projectedWeeklyUsage = ingredientDemand.get(inventoryItem.id) ?? 0;
      const dailyUsage = projectedWeeklyUsage / Math.max(state.settings.forecastHorizonDays, 1);
      const demandDuringLeadTime = dailyUsage * inventoryItem.leadTimeDays;
      const projectedEndingInventory = inventoryItem.onHand - projectedWeeklyUsage;
      const rawReorderQuantity = clampPositive(demandDuringLeadTime + inventoryItem.safetyStock - inventoryItem.onHand);
      const recommendedOrderQuantity =
        inventoryItem.packSize > 0
          ? Math.ceil(rawReorderQuantity / inventoryItem.packSize) * inventoryItem.packSize
          : rawReorderQuantity;
      const daysOfCover = dailyUsage > 0 ? inventoryItem.onHand / dailyUsage : Number.POSITIVE_INFINITY;

      return {
        inventoryItemId: inventoryItem.id,
        name: inventoryItem.name,
        unit: inventoryItem.unit,
        projectedWeeklyUsage,
        demandDuringLeadTime,
        projectedEndingInventory,
        rawReorderQuantity,
        recommendedOrderQuantity,
        stockoutRisk:
          projectedEndingInventory < inventoryItem.safetyStock || inventoryItem.onHand < demandDuringLeadTime,
        daysOfCover,
      };
    })
    .sort((left, right) => Number(right.stockoutRisk) - Number(left.stockoutRisk) || right.recommendedOrderQuantity - left.recommendedOrderQuantity);
}

function buildWasteAlerts(state: AppState, ingredientDemand: Map<string, number>) {
  return state.inventoryItems
    .map<WasteAlert | null>((inventoryItem) => {
      const projectedWeeklyUsage = ingredientDemand.get(inventoryItem.id) ?? 0;
      const dailyUsage = projectedWeeklyUsage / Math.max(state.settings.forecastHorizonDays, 1);
      const daysOfCover = dailyUsage > 0 ? inventoryItem.onHand / dailyUsage : Number.POSITIVE_INFINITY;
      const projectedWasteQuantity = dailyUsage > 0
        ? clampPositive(inventoryItem.onHand - dailyUsage * inventoryItem.shelfLifeDays)
        : inventoryItem.onHand;

      if (
        projectedWasteQuantity <= 0 ||
        (!Number.isFinite(daysOfCover) && inventoryItem.onHand <= 0) ||
        daysOfCover < state.settings.wasteCoverThresholdDays
      ) {
        return null;
      }

      return {
        inventoryItemId: inventoryItem.id,
        name: inventoryItem.name,
        unit: inventoryItem.unit,
        daysOfCover,
        shelfLifeDays: inventoryItem.shelfLifeDays,
        projectedWasteQuantity,
        severity: daysOfCover > inventoryItem.shelfLifeDays ? 'high' : 'medium',
      };
    })
    .filter((alert): alert is WasteAlert => Boolean(alert))
    .sort((left, right) => right.projectedWasteQuantity - left.projectedWasteQuantity);
}

function buildMarginInsights(state: AppState, itemPerformance: ItemPerformance[]) {
  const recentMap = new Map(itemPerformance.map((item) => [item.menuItemId, item]));

  return state.menuItems
    .map<MarginInsight | null>((item) => {
      const performance = recentMap.get(item.id);
      const currentMargin = item.price === 0 ? 0 : (item.price - item.unitCost) / item.price;
      const targetMargin = state.settings.targetMargin;
      const suggestedPrice = currentMargin >= targetMargin ? item.price : item.unitCost / Math.max(1 - targetMargin, 0.0001);
      const potentialWeeklyProfitLift = (suggestedPrice - item.price) * (performance?.avgDailyUnits ?? 0) * 7;

      if (currentMargin >= targetMargin && potentialWeeklyProfitLift <= 0) {
        return null;
      }

      const issue = performance && performance.quantity > 0
        ? `${item.name} is below the target gross margin and moves ${performance.avgDailyUnits.toFixed(1)} units per day.`
        : `${item.name} is below the target gross margin.`;

      return {
        menuItemId: item.id,
        name: item.name,
        currentMargin,
        targetMargin,
        suggestedPrice,
        potentialWeeklyProfitLift,
        issue,
      };
    })
    .filter((insight): insight is MarginInsight => Boolean(insight))
    .sort((left, right) => right.potentialWeeklyProfitLift - left.potentialWeeklyProfitLift)
    .slice(0, 6);
}

export function buildAnalytics(state: AppState, analysisWindowDays: number | 'all', revenueGrain: 'day' | 'week' | 'month'): AnalyticsBundle {
  const allSales = enrichSales(state);
  const filteredSales = filterSalesByWindow(allSales, analysisWindowDays);
  const forecasts = buildForecasts(state, allSales);
  const ingredientDemand = buildIngredientDemand(state, forecasts);
  const reorderRecommendations = buildReorderRecommendations(state, ingredientDemand);
  const itemPerformance = buildItemPerformance(filteredSales);
  const slotForecast = buildSlotForecast(allSales, forecasts, state.settings.forecastHorizonDays, state.settings.ordersPerStaffHour);

  return {
    summary: buildSummary(allSales, reorderRecommendations),
    revenueSeries: buildRevenueSeries(filteredSales, revenueGrain),
    hourlySeries: buildHourlySeries(filteredSales),
    seasonalSeries: buildSeasonalSeries(filteredSales),
    itemPerformance,
    forecasts,
    slotForecast,
    reorderRecommendations,
    wasteAlerts: buildWasteAlerts(state, ingredientDemand),
    marginInsights: buildMarginInsights(state, itemPerformance),
    generatedAt: new Date().toISOString(),
    filteredSalesCount: filteredSales.length,
  };
}
