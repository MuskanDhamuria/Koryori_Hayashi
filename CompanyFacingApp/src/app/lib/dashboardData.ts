import type { BackendOrder, DashboardAnalyticsResponse } from "../services/api";
import type { MenuItem, SalesRecord } from "../utils/mockData";

type MenuCategoryResponse = Array<{
  slug: string;
  name: string;
  items: Array<{
    id: string;
    name: string;
    price: string | number;
    cost: string | number;
    inventoryItem: {
      stockOnHand: number;
      reorderPoint: number;
    } | null;
  }>;
}>;

type InventoryAlertsResponse = Array<{
  stockOnHand: number;
  reorderPoint: number;
  menuItem: {
    id: string;
    name: string;
    category: {
      name: string;
    };
  };
}>;

export interface DashboardInventoryAlert {
  item: {
    id: string;
    name: string;
    category: string;
    stock: number;
    reorderPoint: number;
  };
  daysUntilStockout: number;
  suggestedOrder: number;
}

export function buildMenuCatalog(categories: MenuCategoryResponse): MenuItem[] {
  return categories.flatMap((category) =>
    category.items.map((item) => ({
      id: item.id,
      name: item.name,
      category: category.name,
      price: Number(item.price),
      cost: Number(item.cost),
      stock: item.inventoryItem?.stockOnHand ?? 0,
      reorderPoint: item.inventoryItem?.reorderPoint ?? 0,
    })),
  );
}

export function buildSalesRecords(orders: BackendOrder[]): SalesRecord[] {
  return orders.flatMap((order) => {
    const date = new Date(order.orderedAt);

    return order.orderItems.map((item) => ({
      date,
      hour: date.getHours(),
      itemId: item.menuItem.id,
      quantity: item.quantity,
      revenue: Number(item.lineTotal),
    }));
  });
}

export function buildInventoryAlerts(
  alerts: InventoryAlertsResponse,
): DashboardInventoryAlert[] {
  return alerts.map((alert) => ({
    item: {
      id: alert.menuItem.id,
      name: alert.menuItem.name,
      category: alert.menuItem.category?.name ?? "Uncategorized",
      stock: alert.stockOnHand,
      reorderPoint: alert.reorderPoint,
    },
    daysUntilStockout: Math.max(
      1,
      Math.floor(alert.stockOnHand / Math.max(1, alert.reorderPoint / 3 || 1)),
    ),
    suggestedOrder: Math.max(alert.reorderPoint * 3 - alert.stockOnHand, 0),
  }));
}

export function buildCategoryData(historicalSales: SalesRecord[], menuCatalog: MenuItem[]) {
  if (historicalSales.length === 0) {
    return [];
  }

  const categoryStats: Record<string, { revenue: number; orders: number }> = {};

  historicalSales.forEach((sale) => {
    const item = menuCatalog.find((menuItem) => menuItem.id === sale.itemId);
    if (!item) {
      return;
    }

    if (!categoryStats[item.category]) {
      categoryStats[item.category] = { revenue: 0, orders: 0 };
    }

    categoryStats[item.category].revenue += sale.revenue;
    categoryStats[item.category].orders += 1;
  });

  return Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    revenue: stats.revenue,
    orders: stats.orders,
  }));
}

export function buildHeatMapData(historicalSales: SalesRecord[]) {
  if (historicalSales.length === 0) {
    return [];
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = [11, 12, 13, 14, 15];
  const weekData: Record<number, Record<number, number>> = {};

  historicalSales.forEach((sale) => {
    const day = sale.date.getDay();
    if (!weekData[day]) {
      weekData[day] = {};
    }
    if (!weekData[day][sale.hour]) {
      weekData[day][sale.hour] = 0;
    }
    weekData[day][sale.hour] += sale.revenue;
  });

  return dayNames.map((day, dayIndex) => ({
    day,
    hours: hours.map((hour) => ({
      hour,
      value: weekData[dayIndex]?.[hour] || 0,
    })),
  }));
}

export function buildComboData(orders: BackendOrder[]) {
  if (orders.length === 0) {
    return [];
  }

  const dailyStats: Record<string, { revenue: number; orders: number; customers: number }> = {};

  orders.forEach((order) => {
    const orderDate = new Date(order.orderedAt);
    const dateKey = orderDate.toISOString().split("T")[0];
    if (!dailyStats[dateKey]) {
      dailyStats[dateKey] = { revenue: 0, orders: 0, customers: 0 };
    }
    dailyStats[dateKey].revenue += Number(order.totalAmount);
    dailyStats[dateKey].orders += 1;
    dailyStats[dateKey].customers += 1;
  });

  return Object.keys(dailyStats)
    .sort()
    .slice(-14)
    .map((date) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: dailyStats[date].revenue,
      orders: dailyStats[date].orders,
      customers: dailyStats[date].customers,
    }));
}

export function buildRevenueChartData(
  historicalSales: SalesRecord[],
  selectedPeriod: "daily" | "weekly" | "monthly",
) {
  if (historicalSales.length === 0) {
    return [];
  }

  const dailyRevenue: Record<string, number> = {};
  historicalSales.forEach((sale) => {
    const dateKey = sale.date.toISOString().split("T")[0];
    dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + sale.revenue;
  });

  const sortedDates = Object.keys(dailyRevenue).sort();

  if (selectedPeriod === "daily") {
    return sortedDates.slice(-7).map((date) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: dailyRevenue[date],
    }));
  }

  if (selectedPeriod === "weekly") {
    const weeklyData: Record<string, number> = {};
    sortedDates.forEach((date) => {
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];
      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + dailyRevenue[date];
    });

    return Object.keys(weeklyData)
      .sort()
      .slice(-4)
      .map((week) => ({
        date: `Week ${new Date(week).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
        revenue: weeklyData[week],
      }));
  }

  return sortedDates.map((date) => ({
    date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    revenue: dailyRevenue[date],
  }));
}

export function buildSeasonalData(historicalSales: SalesRecord[]) {
  if (historicalSales.length === 0) {
    return [];
  }

  const weeklyData: Record<string, { revenue: number; orders: number }> = {};

  historicalSales.forEach((sale) => {
    const weekStart = new Date(sale.date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { revenue: 0, orders: 0 };
    }
    weeklyData[weekKey].revenue += sale.revenue;
    weeklyData[weekKey].orders += 1;
  });

  return Object.keys(weeklyData)
    .sort()
    .slice(-4)
    .map((week) => ({
      period: `Week ${new Date(week).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      revenue: weeklyData[week].revenue,
      orders: weeklyData[week].orders,
      avgOrderValue: weeklyData[week].revenue / weeklyData[week].orders,
    }));
}

export function buildComparisonData(dashboardAnalytics: DashboardAnalyticsResponse | null) {
  if (!dashboardAnalytics) {
    return null;
  }

  return {
    currentPeriod: dashboardAnalytics.comparison.currentPeriod,
    previousPeriod: dashboardAnalytics.comparison.previousPeriod,
    industryBenchmark: {
      avgOrderValue: dashboardAnalytics.comparison.benchmark.avgOrderValue,
      margin: dashboardAnalytics.comparison.benchmark.margin,
      peakHourRevenue: dashboardAnalytics.comparison.benchmark.peakHourRevenue,
    },
  };
}
