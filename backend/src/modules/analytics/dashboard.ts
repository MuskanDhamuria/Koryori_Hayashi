import type { Order, User } from "@prisma/client";

type DashboardOrder = Order & {
  orderItems: Array<{
    quantity: number;
    lineTotal: unknown;
    unitPrice: unknown;
    menuItem: {
      id: string;
      name: string;
      price: unknown;
      cost: unknown;
      category: {
        name: string;
      };
      inventoryItem: {
        stockOnHand: number;
        reorderPoint: number;
      } | null;
    };
  }>;
  user: {
    id: string;
    fullName: string;
  } | null;
};

type DashboardInventoryItem = {
  stockOnHand: number;
  reorderPoint: number;
  ingredientName: string;
  menuItem: {
    id: string;
    name: string;
    category: {
      name: string;
    };
  };
};

type DashboardMenuItem = {
  id: string;
  name: string;
  price: unknown;
  cost: unknown;
  isHighMargin: boolean;
  isNew: boolean;
  category: {
    name: string;
  };
  inventoryItem: {
    stockOnHand: number;
    reorderPoint: number;
  } | null;
};

type DashboardStaffUser = Pick<User, "id" | "fullName" | "role">;

function roundNumber(value: number) {
  return Number(value.toFixed(2));
}

function revenueForOrders(orders: Array<{ totalAmount: unknown }>) {
  return roundNumber(
    orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
  );
}

function orderMarginPercent(
  orders: Array<{
    orderItems: Array<{
      quantity: number;
      lineTotal: unknown;
      menuItem: {
        cost: unknown;
      };
    }>;
  }>,
) {
  const revenue = orders.reduce(
    (sum, order) =>
      sum +
      order.orderItems.reduce(
        (orderSum, item) => orderSum + Number(item.lineTotal),
        0,
      ),
    0,
  );

  if (revenue === 0) {
    return 0;
  }

  const cost = orders.reduce(
    (sum, order) =>
      sum +
      order.orderItems.reduce(
        (orderSum, item) =>
          orderSum + Number(item.menuItem.cost) * Number(item.quantity),
        0,
      ),
    0,
  );

  return roundNumber(((revenue - cost) / revenue) * 100);
}

function averageOrderValue(orders: Array<{ totalAmount: unknown }>) {
  if (orders.length === 0) {
    return 0;
  }

  return roundNumber(
    orders.reduce((sum, order) => sum + Number(order.totalAmount), 0) / orders.length,
  );
}

function formatHour(hour: number) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalizedHour}:00 ${suffix}`;
}

function toDateKey(date: Date) {
  return date.toISOString().split("T")[0];
}

function formatShortDate(dateKey: string) {
  return new Date(dateKey).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getWeekStart(date: Date) {
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  return weekStart;
}

function buildRevenueSeries(
  orders: DashboardOrder[],
  selectedPeriod: "daily" | "weekly" | "monthly",
) {
  const dailyRevenue = new Map<string, number>();

  for (const order of orders) {
    const dateKey = toDateKey(order.orderedAt);
    dailyRevenue.set(dateKey, (dailyRevenue.get(dateKey) ?? 0) + Number(order.totalAmount));
  }

  const sortedDates = Array.from(dailyRevenue.keys()).sort();

  if (selectedPeriod === "daily") {
    return sortedDates.slice(-7).map((date) => ({
      date: formatShortDate(date),
      revenue: roundNumber(dailyRevenue.get(date) ?? 0),
    }));
  }

  if (selectedPeriod === "weekly") {
    const weeklyRevenue = new Map<string, number>();
    for (const dateKey of sortedDates) {
      const weekKey = toDateKey(getWeekStart(new Date(dateKey)));
      weeklyRevenue.set(weekKey, (weeklyRevenue.get(weekKey) ?? 0) + (dailyRevenue.get(dateKey) ?? 0));
    }

    return Array.from(weeklyRevenue.keys())
      .sort()
      .slice(-4)
      .map((weekKey) => ({
        date: `Week ${formatShortDate(weekKey)}`,
        revenue: roundNumber(weeklyRevenue.get(weekKey) ?? 0),
      }));
  }

  return sortedDates.map((date) => ({
    date: formatShortDate(date),
    revenue: roundNumber(dailyRevenue.get(date) ?? 0),
  }));
}

function buildCategoryBreakdown(orders: DashboardOrder[]) {
  const categoryRevenue = new Map<string, { revenue: number; orders: number }>();

  for (const order of orders) {
    for (const item of order.orderItems) {
      const categoryName = item.menuItem.category.name;
      const current = categoryRevenue.get(categoryName) ?? {
        revenue: 0,
        orders: 0,
      };
      current.revenue += Number(item.lineTotal);
      current.orders += 1;
      categoryRevenue.set(categoryName, current);
    }
  }

  return Array.from(categoryRevenue.entries()).map(([category, revenue]) => ({
    category,
    revenue: roundNumber(revenue.revenue),
    orders: revenue.orders,
  }));
}

function buildHourlySalesData(orders: DashboardOrder[]) {
  const hourlyRevenue = new Map<number, number>();
  for (const order of orders) {
    const hour = order.orderedAt.getHours();
    hourlyRevenue.set(hour, (hourlyRevenue.get(hour) ?? 0) + Number(order.totalAmount));
  }

  const values = Array.from(hourlyRevenue.values());
  const average = values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

  return Array.from(hourlyRevenue.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([hour, sales]) => ({
      hour,
      sales: roundNumber(sales),
      isPeak: sales >= average * 1.15 && sales > 0,
    }));
}

function buildHeatMapData(orders: DashboardOrder[]) {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const hours = [11, 12, 13, 14, 15];
  const weekData: Record<number, Record<number, number>> = {};

  for (const order of orders) {
    const day = order.orderedAt.getDay();
    const hour = order.orderedAt.getHours();
    if (!hours.includes(hour)) {
      continue;
    }

    weekData[day] ??= {};
    weekData[day][hour] = (weekData[day][hour] ?? 0) + Number(order.totalAmount);
  }

  return dayNames.map((day, dayIndex) => ({
    day,
    hours: hours.map((hour) => ({
      hour,
      value: roundNumber(weekData[dayIndex]?.[hour] ?? 0),
    })),
  }));
}

function buildComboData(orders: DashboardOrder[]) {
  const dailyStats: Record<string, { revenue: number; orders: number; customers: Set<string> }> = {};

  for (const order of orders) {
    const dateKey = toDateKey(order.orderedAt);
    dailyStats[dateKey] ??= { revenue: 0, orders: 0, customers: new Set<string>() };
    dailyStats[dateKey].revenue += Number(order.totalAmount);
    dailyStats[dateKey].orders += 1;
    dailyStats[dateKey].customers.add(order.userId ?? order.id);
  }

  return Object.keys(dailyStats)
    .sort()
    .slice(-14)
    .map((date) => ({
      date: formatShortDate(date),
      revenue: roundNumber(dailyStats[date].revenue),
      orders: dailyStats[date].orders,
      customers: dailyStats[date].customers.size,
    }));
}

function buildSeasonalData(orders: DashboardOrder[]) {
  const weeklyData: Record<string, { revenue: number; orders: number }> = {};

  for (const order of orders) {
    const weekKey = toDateKey(getWeekStart(order.orderedAt));
    weeklyData[weekKey] ??= { revenue: 0, orders: 0 };
    weeklyData[weekKey].revenue += Number(order.totalAmount);
    weeklyData[weekKey].orders += 1;
  }

  return Object.keys(weeklyData)
    .sort()
    .slice(-4)
    .map((weekKey) => ({
      period: `Week ${formatShortDate(weekKey)}`,
      revenue: roundNumber(weeklyData[weekKey].revenue),
      orders: weeklyData[weekKey].orders,
      avgOrderValue: roundNumber(
        weeklyData[weekKey].orders === 0
          ? 0
          : weeklyData[weekKey].revenue / weeklyData[weekKey].orders,
      ),
    }));
}

function buildItemPerformance(menuItems: DashboardMenuItem[], orders: DashboardOrder[]) {
  const stats = new Map<
    string,
    {
      item: DashboardMenuItem;
      totalRevenue: number;
      totalQuantity: number;
    }
  >();

  for (const item of menuItems) {
    stats.set(item.id, {
      item,
      totalRevenue: 0,
      totalQuantity: 0,
    });
  }

  for (const order of orders) {
    for (const orderItem of order.orderItems) {
      const current = stats.get(orderItem.menuItem.id);
      if (!current) {
        continue;
      }

      current.totalRevenue += Number(orderItem.lineTotal);
      current.totalQuantity += Number(orderItem.quantity);
    }
  }

  return Array.from(stats.values()).map((entry) => ({
    item: {
      id: entry.item.id,
      name: entry.item.name,
      category: entry.item.category.name,
      price: Number(entry.item.price),
      cost: Number(entry.item.cost),
      stock: entry.item.inventoryItem?.stockOnHand ?? 0,
      reorderPoint: entry.item.inventoryItem?.reorderPoint ?? 0,
    },
    totalRevenue: roundNumber(entry.totalRevenue),
    totalQuantity: entry.totalQuantity,
  }));
}

function forecastNextWeek(orders: DashboardOrder[], itemId: string) {
  const dailySales = new Map<string, number>();

  for (const order of orders) {
    for (const item of order.orderItems) {
      if (item.menuItem.id !== itemId) {
        continue;
      }

      const dateKey = toDateKey(order.orderedAt);
      dailySales.set(dateKey, (dailySales.get(dateKey) ?? 0) + Number(item.quantity));
    }
  }

  const dates = Array.from(dailySales.keys()).sort();
  const quantities = dates.map((date) => dailySales.get(date) ?? 0);
  const recentWindow = quantities.slice(-7);
  const recentAverage =
    recentWindow.length === 0
      ? 0
      : recentWindow.reduce((sum, value) => sum + value, 0) / recentWindow.length;
  const trend =
    quantities.length > 1 ? (quantities[quantities.length - 1] - quantities[0]) / quantities.length : 0;

  return Array.from({ length: 7 }, (_, index) =>
    Math.max(0, Math.round(recentAverage + trend * index)),
  );
}

function buildForecast(topItems: Array<{ item: { id: string; name: string; stock: number }; totalRevenue: number; totalQuantity: number }>, orders: DashboardOrder[]) {
  if (topItems.length === 0) {
    return {
      chart: [] as Array<{ date: string; actual?: number; forecast?: number; isHistorical: boolean }>,
      cards: [] as Array<{
        itemId: string;
        itemName: string;
        weekTotal: number;
        avgDaily: number;
        currentStock: number;
      }>,
      focusItemName: "",
    };
  }

  const focusItem = topItems[0].item;
  const focusForecast = forecastNextWeek(orders, focusItem.id);
  const focusDailySales = new Map<string, number>();

  for (const order of orders) {
    for (const item of order.orderItems) {
      if (item.menuItem.id !== focusItem.id) {
        continue;
      }

      const dateKey = toDateKey(order.orderedAt);
      focusDailySales.set(dateKey, (focusDailySales.get(dateKey) ?? 0) + Number(item.quantity));
    }
  }

  const historicalDates = Array.from(focusDailySales.keys()).sort().slice(-7);
  const historicalData = historicalDates.map((date) => ({
    date: formatShortDate(date),
    actual: focusDailySales.get(date) ?? 0,
    isHistorical: true,
  }));

  const now = new Date();
  const forecastData = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() + index + 1);
    return {
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      forecast: focusForecast[index],
      isHistorical: false,
    };
  });

  return {
    chart: [...historicalData, ...forecastData],
    cards: topItems.slice(0, 3).map((performance) => {
      const forecast = forecastNextWeek(orders, performance.item.id);
      const weekTotal = forecast.reduce((sum, value) => sum + value, 0);
      return {
        itemId: performance.item.id,
        itemName: performance.item.name,
        weekTotal,
        avgDaily: roundNumber(weekTotal / 7),
        currentStock: performance.item.stock,
      };
    }),
    focusItemName: focusItem.name,
  };
}

function buildInventorySummary(inventoryItems: DashboardInventoryItem[]) {
  const inventoryWithCoverage = inventoryItems.map((item) => {
    const estimatedDailyUsage = Math.max(1, Math.ceil(item.reorderPoint / 3));
    const coverageDays = Math.max(1, Math.floor(item.stockOnHand / estimatedDailyUsage));
    return {
      ...item,
      coverageDays,
    };
  });

  const criticalInventory = inventoryWithCoverage.filter(
    (item) => item.stockOnHand <= Math.max(1, Math.floor(item.reorderPoint / 2)),
  );
  const warningInventory = inventoryWithCoverage.filter(
    (item) =>
      item.stockOnHand > Math.max(1, Math.floor(item.reorderPoint / 2)) &&
      item.stockOnHand <= item.reorderPoint,
  );
  const overstockInventory = inventoryWithCoverage.filter(
    (item) => item.stockOnHand >= item.reorderPoint * 3,
  );

  return {
    criticalCount: criticalInventory.length,
    warningCount: warningInventory.length,
    healthyCount:
      inventoryItems.length - criticalInventory.length - warningInventory.length,
    overstockCount: overstockInventory.length,
    averageCoverageDays:
      inventoryWithCoverage.length === 0
        ? 0
        : roundNumber(
            inventoryWithCoverage.reduce((sum, item) => sum + item.coverageDays, 0) /
              inventoryWithCoverage.length,
          ),
    criticalItems: criticalInventory.slice(0, 3).map((item) => item.menuItem.name),
  };
}

function buildMarginSummary(menuItems: DashboardMenuItem[], currentWeekOrders: DashboardOrder[], peakHour: number) {
  const marginBuckets = menuItems.reduce(
    (accumulator, item) => {
      const price = Number(item.price);
      const cost = Number(item.cost);
      const marginPercent = price === 0 ? 0 : ((price - cost) / price) * 100;

      if (marginPercent >= 60) {
        accumulator.high += 1;
      } else if (marginPercent >= 40) {
        accumulator.medium += 1;
      } else {
        accumulator.low += 1;
      }

      return accumulator;
    },
    { high: 0, medium: 0, low: 0 },
  );

  const topMarginOpportunity =
    currentWeekOrders
      .flatMap((order) => order.orderItems)
      .map((item) => ({
        name: item.menuItem.name,
        revenue: Number(item.lineTotal),
        marginPercent:
          ((Number(item.menuItem.price) - Number(item.menuItem.cost)) / Number(item.menuItem.price)) *
          100,
      }))
      .filter((item) => item.marginPercent >= 60)
      .sort((a, b) => b.revenue - a.revenue)[0]?.name ?? null;

  return {
    highCount: marginBuckets.high,
    mediumCount: marginBuckets.medium,
    lowCount: marginBuckets.low,
    recommendation:
      topMarginOpportunity === null
        ? `Focus on high-margin items during ${formatHour(peakHour)} lunch traffic.`
        : `Feature ${topMarginOpportunity} during ${formatHour(peakHour)} traffic to improve profit mix.`,
  };
}

function getStaffRoleLabel(role: DashboardStaffUser["role"]) {
  if (role === "ADMIN") {
    return "Manager";
  }
  if (role === "STAFF") {
    return "Service Staff";
  }
  return "Support";
}

function buildStaffSchedule(staffUsers: DashboardStaffUser[], peakHourRange: string, peakCoverageNeeded: number) {
  const shifts = ["Morning", "Prep", "Peak Rush", "Full"];
  const hoursByShift = {
    Morning: "10:00-14:00",
    Prep: "10:30-15:00",
    "Peak Rush": "11:30-14:30",
    Full: "10:00-15:30",
  } as const;

  const staff = staffUsers.map((user, index) => {
    const shift = shifts[index % shifts.length] as keyof typeof hoursByShift;
    return {
      id: user.id,
      name: user.fullName,
      role: getStaffRoleLabel(user.role),
      shift,
      hours: hoursByShift[shift],
    };
  });

  return {
    staff,
    coverage: {
      peak: staff.length >= peakCoverageNeeded ? "Full" : "Tight",
      offPeak: staff.length >= 2 ? "Adequate" : "Lean",
      peakHourRange,
    },
  };
}

function buildStaffAllocation(hourlySalesData: Array<{ hour: number; sales: number; isPeak: boolean }>, availableStaffCount: number) {
  const peaks = hourlySalesData.filter((hour) => hour.isPeak);

  return peaks.map((peak) => {
    const staffRequired = Math.min(5, Math.max(2, Math.ceil(peak.sales / 200)));
    const shift =
      peak.hour >= 12 && peak.hour <= 13
        ? "Peak Rush"
        : peak.hour === 11 || peak.hour === 14 || peak.hour === 15
          ? "Off-Peak"
          : "Lunch Service";

    return {
      hour: peak.hour,
      label: `${peak.hour}:00 - ${peak.hour + 1}:00`,
      shift,
      expectedSales: roundNumber(peak.sales),
      staffRequired,
      availableStaff: availableStaffCount,
      coverageStatus:
        availableStaffCount >= staffRequired ? "Covered" : availableStaffCount >= staffRequired - 1 ? "Tight" : "Gap",
    };
  });
}

function buildPricingStrategy(itemPerformance: Array<{ item: { id: string; name: string; category: string; price: number; cost: number }; totalRevenue: number; totalQuantity: number }>, peakHourRange: string) {
  const topItems = [...itemPerformance]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 3);
  const worstItems = [...itemPerformance]
    .sort((a, b) => a.totalRevenue - b.totalRevenue)
    .slice(0, 3);

  const topPerformers = topItems.map((performance) => {
    const margin = ((performance.item.price - performance.item.cost) / performance.item.price) * 100;
    const action =
      margin < 50
        ? `Test a 5% price lift on ${performance.item.name}`
        : performance.totalQuantity > 25
          ? `Bundle ${performance.item.name} with a drink`
          : `Keep ${performance.item.name} at its current price`;
    const reason =
      margin < 50
        ? "Demand is strong, but margin is below target."
        : performance.totalQuantity > 25
          ? "High volume makes this a strong anchor for combo upsells."
          : "It is already performing well with a healthy margin.";

    return {
      itemId: performance.item.id,
      itemName: performance.item.name,
      category: performance.item.category,
      price: performance.item.price,
      margin: roundNumber(margin),
      quantity: performance.totalQuantity,
      revenue: roundNumber(performance.totalRevenue),
      action,
      reason,
    };
  });

  const slowMovers = worstItems.map((performance) => {
    const margin = ((performance.item.price - performance.item.cost) / performance.item.price) * 100;
    const action =
      margin > 60
        ? `Run a limited discount on ${performance.item.name}`
        : `Review recipe or replace ${performance.item.name}`;
    const reason =
      margin > 60
        ? "Margin can absorb a promotion to stimulate trial."
        : "Low sales and weaker margin suggest a menu adjustment.";

    return {
      itemId: performance.item.id,
      itemName: performance.item.name,
      category: performance.item.category,
      price: performance.item.price,
      margin: roundNumber(margin),
      quantity: performance.totalQuantity,
      revenue: roundNumber(performance.totalRevenue),
      action,
      reason,
    };
  });

  return {
    topPerformers,
    slowMovers,
    strategicInsights: [
      `Peak demand is centered around ${peakHourRange}; prioritize upsells in that window.`,
      "Use combo offers to lift average order value before reducing prices broadly.",
      "Promote high-margin items with healthy stock coverage first to protect profit.",
      "Review the weakest seller each week and rotate slow movers with seasonal specials.",
    ],
  };
}

export function buildDashboardAnalytics(payload: {
  orders: DashboardOrder[];
  inventoryItems: DashboardInventoryItem[];
  menuItems: DashboardMenuItem[];
  staffUsers: DashboardStaffUser[];
  activeTables: number;
}) {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const todayOrders = payload.orders.filter((order) => order.orderedAt >= oneDayAgo);
  const currentWeekOrders = payload.orders.filter((order) => order.orderedAt >= oneWeekAgo);
  const previousWeekOrders = payload.orders.filter(
    (order) => order.orderedAt >= twoWeeksAgo && order.orderedAt < oneWeekAgo,
  );
  const monthOrders = payload.orders.filter((order) => order.orderedAt >= oneMonthAgo);

  const todayRevenue = revenueForOrders(todayOrders);
  const weekRevenue = revenueForOrders(currentWeekOrders);
  const monthRevenue = revenueForOrders(monthOrders);
  const previousWeekRevenue = revenueForOrders(previousWeekOrders);
  const weekOrdersCount = currentWeekOrders.length;
  const previousWeekOrdersCount = previousWeekOrders.length;
  const avgOrderValue = averageOrderValue(currentWeekOrders);
  const previousAvgOrderValue = averageOrderValue(previousWeekOrders);
  const currentMargin = orderMarginPercent(currentWeekOrders);
  const previousMargin = orderMarginPercent(previousWeekOrders);
  const monthMargin = orderMarginPercent(monthOrders);
  const weekGrowth =
    previousWeekRevenue === 0
      ? 0
      : roundNumber(((weekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100);
  const ordersGrowth =
    previousWeekOrdersCount === 0
      ? 0
      : roundNumber(
          ((weekOrdersCount - previousWeekOrdersCount) / previousWeekOrdersCount) * 100,
        );
  const marginDelta = roundNumber(currentMargin - previousMargin);

  const hourlySalesData = buildHourlySalesData(currentWeekOrders);
  const peakHourEntry = [...hourlySalesData].sort((a, b) => b.sales - a.sales)[0];
  const peakHour = peakHourEntry?.hour ?? 12;
  const peakHourRevenue = roundNumber(peakHourEntry?.sales ?? 0);
  const peakHourRange = `${formatHour(peakHour)} - ${formatHour(peakHour + 1)}`;
  const uniqueCustomersThisWeek = new Set(
    currentWeekOrders.map((order) => order.userId ?? order.id),
  ).size;

  const itemPerformance = buildItemPerformance(payload.menuItems, monthOrders);
  const topItems = [...itemPerformance].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
  const worstItems = [...itemPerformance].sort((a, b) => a.totalRevenue - b.totalRevenue).slice(0, 5);
  const forecast = buildForecast(topItems, payload.orders);
  const peakCoverageNeeded = peakHourEntry ? Math.min(5, Math.max(2, Math.ceil(peakHourEntry.sales / 200))) : 2;

  return {
    metrics: {
      todayRevenue,
      weekRevenue,
      monthRevenue,
      todayOrders: todayOrders.length,
      weekOrders: weekOrdersCount,
      avgMargin: monthMargin,
      avgOrderValue,
      weekGrowth,
      ordersGrowth,
      marginDelta,
      previousWeekRevenue,
      previousWeekOrders: previousWeekOrdersCount,
      previousAvgOrderValue,
      previousMargin,
      sparklineData: buildRevenueSeries(payload.orders, "daily").map((point) => ({
        date: point.date,
        value: point.revenue,
      })),
    },
    categoryBreakdown: buildCategoryBreakdown(payload.orders),
    comparison: {
      currentPeriod: {
        revenue: weekRevenue,
        orders: weekOrdersCount,
        avgOrderValue,
        margin: currentMargin,
      },
      previousPeriod: {
        revenue: previousWeekRevenue,
        orders: previousWeekOrdersCount,
        avgOrderValue: previousAvgOrderValue,
        margin: previousMargin,
      },
      benchmark: {
        avgOrderValue: averageOrderValue(monthOrders),
        margin: monthMargin,
        peakHourRevenue,
      },
    },
    operations: {
      staffCount: payload.staffUsers.length,
      activeTables: payload.activeTables,
      uniqueCustomersThisWeek,
      peakHourRange,
    },
    inventorySummary: buildInventorySummary(payload.inventoryItems),
    marginSummary: buildMarginSummary(payload.menuItems, currentWeekOrders, peakHour),
    charts: {
      revenue: {
        daily: buildRevenueSeries(payload.orders, "daily"),
        weekly: buildRevenueSeries(payload.orders, "weekly"),
        monthly: buildRevenueSeries(payload.orders, "monthly"),
      },
      combo: buildComboData(payload.orders),
      hourlySales: hourlySalesData,
      heatMap: buildHeatMapData(monthOrders),
      seasonal: buildSeasonalData(payload.orders),
      forecast: forecast.chart,
      forecastFocusItemName: forecast.focusItemName,
    },
    performance: {
      topItems,
      worstItems,
    },
    forecast: {
      focusItemName: forecast.focusItemName,
      chart: forecast.chart,
      cards: forecast.cards,
    },
    staffing: {
      schedule: buildStaffSchedule(payload.staffUsers, peakHourRange, peakCoverageNeeded),
      allocation: buildStaffAllocation(hourlySalesData, payload.staffUsers.length),
    },
    pricingStrategy: buildPricingStrategy(itemPerformance, peakHourRange),
  };
}
