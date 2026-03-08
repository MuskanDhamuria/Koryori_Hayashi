import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";

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

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/dashboard", { preHandler: app.requireStaff }, async () => {
    const [orders, inventoryItems, menuItems, staffCount, activeTables] =
      await Promise.all([
        prisma.order.findMany({
          where: {
            status: {
              in: ["CONFIRMED", "PREPARING", "READY", "COMPLETED"],
            },
          },
          include: {
            orderItems: {
              include: {
                menuItem: {
                  include: { category: true },
                },
              },
            },
            user: true,
          },
          orderBy: { orderedAt: "asc" },
        }),
        prisma.inventoryItem.findMany({
          include: {
            menuItem: {
              include: {
                category: true,
              },
            },
          },
        }),
        prisma.menuItem.findMany(),
        prisma.user.count({
          where: {
            role: {
              in: ["STAFF", "ADMIN"],
            },
          },
        }),
        prisma.restaurantTable.count({
          where: { isActive: true },
        }),
      ]);

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayOrders = orders.filter((order) => order.orderedAt >= oneDayAgo);
    const currentWeekOrders = orders.filter((order) => order.orderedAt >= oneWeekAgo);
    const previousWeekOrders = orders.filter(
      (order) => order.orderedAt >= twoWeeksAgo && order.orderedAt < oneWeekAgo,
    );
    const monthOrders = orders.filter((order) => order.orderedAt >= oneMonthAgo);

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

    const last7Days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(now);
      day.setDate(day.getDate() - (6 - index));
      const dayKey = day.toISOString().split("T")[0];
      const dailyRevenue = orders
        .filter((order) => order.orderedAt.toISOString().split("T")[0] === dayKey)
        .reduce((sum, order) => sum + Number(order.totalAmount), 0);

      return {
        date: dayKey,
        value: roundNumber(dailyRevenue),
      };
    });

    const categoryRevenue = new Map<string, { revenue: number; orders: number }>();
    const hourlyRevenue = new Map<number, number>();

    orders.forEach((order) => {
      const hour = order.orderedAt.getHours();
      hourlyRevenue.set(
        hour,
        (hourlyRevenue.get(hour) ?? 0) + Number(order.totalAmount),
      );

      order.orderItems.forEach((item) => {
        const categoryName = item.menuItem.category.name;
        const current = categoryRevenue.get(categoryName) ?? {
          revenue: 0,
          orders: 0,
        };
        current.revenue += Number(item.lineTotal);
        current.orders += 1;
        categoryRevenue.set(categoryName, current);
      });
    });

    const peakHourEntry =
      Array.from(hourlyRevenue.entries()).sort((a, b) => b[1] - a[1])[0] ?? null;
    const peakHour = peakHourEntry?.[0] ?? 12;
    const peakHourRevenue = roundNumber(peakHourEntry?.[1] ?? 0);

    const uniqueCustomersThisWeek = new Set(
      currentWeekOrders.map((order) => order.userId ?? order.id),
    ).size;

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
            ((Number(item.menuItem.price) - Number(item.menuItem.cost)) /
              Number(item.menuItem.price)) *
            100,
        }))
        .filter((item) => item.marginPercent >= 60)
        .sort((a, b) => b.revenue - a.revenue)[0]?.name ?? null;

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
        sparklineData: last7Days,
      },
      categoryBreakdown: Array.from(categoryRevenue.entries()).map(([category, revenue]) => ({
        category,
        revenue: roundNumber(revenue.revenue),
        orders: revenue.orders,
      })),
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
        staffCount,
        activeTables,
        uniqueCustomersThisWeek,
        peakHourRange: `${formatHour(peakHour)} - ${formatHour(peakHour + 1)}`,
      },
      inventorySummary: {
        criticalCount: criticalInventory.length,
        warningCount: warningInventory.length,
        healthyCount:
          inventoryItems.length - criticalInventory.length - warningInventory.length,
        overstockCount: overstockInventory.length,
        averageCoverageDays:
          inventoryWithCoverage.length === 0
            ? 0
            : roundNumber(
                inventoryWithCoverage.reduce(
                  (sum, item) => sum + item.coverageDays,
                  0,
                ) / inventoryWithCoverage.length,
              ),
        criticalItems: criticalInventory.slice(0, 3).map((item) => item.menuItem.name),
      },
      marginSummary: {
        highCount: marginBuckets.high,
        mediumCount: marginBuckets.medium,
        lowCount: marginBuckets.low,
        recommendation:
          topMarginOpportunity === null
            ? `Focus on high-margin items during ${formatHour(peakHour)} lunch traffic.`
            : `Feature ${topMarginOpportunity} during ${formatHour(peakHour)} traffic to improve profit mix.`,
      },
    };
  });
};
