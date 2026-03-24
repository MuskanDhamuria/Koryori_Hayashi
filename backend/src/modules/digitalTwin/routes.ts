import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

const simulateBodySchema = z.object({
  demand_change: z.number().min(-100).max(200),
  staff: z.number().int().min(1).max(100),
  price_change: z.number().min(-100).max(200),
  inventory_level: z.number().min(0).max(100),
});

type SimulationBaseline = {
  baseWaitTimeMinutes: number;
  baseRevenuePerDay: number;
  baseStaffUtilisation: number;
  baseStockoutRisk: number;
  baselineStaffCount: number;
  dataSource: "database" | "fallback";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundNumber(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

async function getSimulationBaseline(): Promise<SimulationBaseline> {
  const fallback: SimulationBaseline = {
    baseWaitTimeMinutes: 15,
    baseRevenuePerDay: 1000,
    baseStaffUtilisation: 70,
    baseStockoutRisk: 30,
    baselineStaffCount: 5,
    dataSource: "fallback",
  };

  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [orders, staffCount, inventoryItems] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: "COMPLETED",
          completedAt: { not: null },
          orderedAt: { gte: oneWeekAgo },
        },
        select: {
          totalAmount: true,
          orderedAt: true,
          completedAt: true,
        },
      }),
      prisma.user.count({
        where: {
          role: {
            in: ["STAFF", "ADMIN"],
          },
        },
      }),
      prisma.inventoryItem.findMany({
        select: {
          stockOnHand: true,
          reorderPoint: true,
        },
      }),
    ]);

    const completedDurations = orders
      .map((order) =>
        order.completedAt ? (order.completedAt.getTime() - order.orderedAt.getTime()) / 60000 : null,
      )
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0);

    const averageWaitTimeMinutes =
      completedDurations.length === 0
        ? fallback.baseWaitTimeMinutes
        : roundNumber(
            completedDurations.reduce((sum, value) => sum + value, 0) /
              completedDurations.length,
            1,
          );

    const weekRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const baseRevenuePerDay = roundNumber(weekRevenue / 7, 2);

    const lowStockRatio =
      inventoryItems.length === 0
        ? 0
        : inventoryItems.filter((item) => item.stockOnHand <= item.reorderPoint).length /
          inventoryItems.length;

    return {
      baseWaitTimeMinutes: averageWaitTimeMinutes,
      baseRevenuePerDay: baseRevenuePerDay > 0 ? baseRevenuePerDay : fallback.baseRevenuePerDay,
      baseStaffUtilisation: fallback.baseStaffUtilisation,
      baseStockoutRisk: clamp(Math.round(15 + lowStockRatio * 85), 10, 95),
      baselineStaffCount: staffCount > 0 ? staffCount : fallback.baselineStaffCount,
      dataSource: "database",
    };
  } catch {
    return fallback;
  }
}

export const digitalTwinRoutes: FastifyPluginAsync = async (app) => {
  app.post("/simulate", async (request, reply) => {
    const parsed = simulateBodySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid simulation payload" });
    }

    const baseline = await getSimulationBaseline();
    const input = parsed.data;

    const demandMultiplier = 1 + input.demand_change / 100;
    const priceMultiplier = 1 + input.price_change / 100;

    const baselineStaff = baseline.baselineStaffCount || 5;
    const staffingFactor = Math.pow(baselineStaff / Math.max(1, input.staff), 0.7);

    const waitTime = Math.max(
      1,
      Math.round(baseline.baseWaitTimeMinutes * demandMultiplier * staffingFactor),
    );

    const revenue = Math.max(
      0,
      Math.round(baseline.baseRevenuePerDay * demandMultiplier * priceMultiplier),
    );

    const staffUtilisation = clamp(
      Math.round(
        baseline.baseStaffUtilisation *
          demandMultiplier *
          (baselineStaff / Math.max(1, input.staff)),
      ),
      0,
      100,
    );

    const inventoryLevelNormalized = clamp(input.inventory_level, 0, 100) / 100;
    const inventoryLevelFactor = 1.4 - 1.2 * inventoryLevelNormalized; // 0% => 1.4x risk, 100% => 0.2x risk
    const stockoutRisk = clamp(
      Math.round(baseline.baseStockoutRisk * demandMultiplier * inventoryLevelFactor),
      0,
      100,
    );

    const recommendations: string[] = [];

    if (baseline.dataSource === "fallback") {
      recommendations.push(
        "Backend database baseline unavailable; using fallback simulation baseline values.",
      );
    }

    if (waitTime > 20) {
      const additionalStaff = Math.ceil((waitTime - 15) / 5);
      recommendations.push(
        `Add ${additionalStaff} staff member${additionalStaff > 1 ? "s" : ""} to reduce wait time by approximately ${additionalStaff * 5} minutes`,
      );
    }

    if (staffUtilisation < 60) {
      recommendations.push(
        `Staff utilization is low (${staffUtilisation}%). Consider reducing staff count by 1-2 to optimize labor costs`,
      );
    } else if (staffUtilisation > 90) {
      recommendations.push(
        `Staff utilization is very high (${staffUtilisation}%). Consider adding 1-2 staff members to prevent burnout`,
      );
    }

    if (stockoutRisk >= 70) {
      recommendations.push(
        `High stockout risk detected (${stockoutRisk}%). Restock soon to avoid shortages`,
      );
    } else if (stockoutRisk <= 25 && input.inventory_level >= 70) {
      recommendations.push(
        `Low stockout risk (${stockoutRisk}%). Inventory looks healthy; monitor for overstock and waste on perishable items`,
      );
    }

    if (input.price_change < 0 && revenue < baseline.baseRevenuePerDay) {
      recommendations.push(
        "Price reduction is impacting revenue. Consider targeted discounts instead of across-the-board cuts",
      );
    } else if (input.price_change > 10 && demandMultiplier < 1) {
      recommendations.push(
        "High price increase may reduce demand. Monitor customer response closely",
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Operations are balanced. Current parameters maintain optimal performance",
      );
    }

    return {
      wait_time: waitTime,
      revenue,
      staff_utilisation: staffUtilisation,
      inventory_usage: stockoutRisk,
      recommendations,
    };
  });
};
