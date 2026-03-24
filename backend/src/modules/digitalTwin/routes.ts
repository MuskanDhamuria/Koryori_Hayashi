import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import {
  predictWithDigitalTwinSurrogateModel,
  trainDigitalTwinSurrogateModel,
  type DigitalTwinMlInfo,
  type DigitalTwinSimulationInput,
  type DigitalTwinSimulationOutput,
} from "./ml.js";
import { loadDigitalTwinTrainingSamplesFromCsv } from "./csv.js";

const simulateBodySchema = z.object({
  demand_change: z.number().min(-100).max(200),
  staff: z.number().int().min(1).max(100),
  price_change: z.number().min(-100).max(200),
  inventory_level: z.number().min(0).max(100),
  engine: z.enum(["rules", "ml"]).optional(),
  record_run: z.boolean().optional(),
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

function computeRuleBasedOutput(
  baseline: SimulationBaseline,
  input: DigitalTwinSimulationInput,
): DigitalTwinSimulationOutput {
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

  return {
    wait_time: waitTime,
    revenue,
    staff_utilisation: staffUtilisation,
    inventory_usage: stockoutRisk,
  };
}

function generateRecommendations(
  baseline: SimulationBaseline,
  input: DigitalTwinSimulationInput,
  output: DigitalTwinSimulationOutput,
  context: {
    engineRequested: "rules" | "ml";
    engineUsed: "rules" | "ml";
    mlInfo?: DigitalTwinMlInfo;
    persistenceAvailable: boolean;
  },
): string[] {
  const recommendations: string[] = [];

  if (output.wait_time > 20) {
    const additionalStaff = Math.ceil((output.wait_time - 15) / 5);
    recommendations.push(
      `Add ${additionalStaff} staff member${additionalStaff > 1 ? "s" : ""} to reduce wait time by approximately ${additionalStaff * 5} minutes`,
    );
  }

  if (output.staff_utilisation < 60) {
    recommendations.push(
      `Staff utilization is low (${output.staff_utilisation}%). Consider reducing staff count by 1-2 to optimize labor costs`,
    );
  } else if (output.staff_utilisation > 90) {
    recommendations.push(
      `Staff utilization is very high (${output.staff_utilisation}%). Consider adding 1-2 staff members to prevent burnout`,
    );
  }

  if (output.inventory_usage >= 70) {
    recommendations.push(
      `High stockout risk detected (${output.inventory_usage}%). Restock soon to avoid shortages`,
    );
  } else if (output.inventory_usage <= 25 && input.inventory_level >= 70) {
    recommendations.push(
      `Low stockout risk (${output.inventory_usage}%). Inventory looks healthy; monitor for overstock and waste on perishable items`,
    );
  }

  const demandMultiplier = 1 + input.demand_change / 100;
  if (input.price_change < 0 && output.revenue < baseline.baseRevenuePerDay) {
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

  return recommendations;
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
    const input: DigitalTwinSimulationInput = {
      demand_change: parsed.data.demand_change,
      staff: parsed.data.staff,
      price_change: parsed.data.price_change,
      inventory_level: parsed.data.inventory_level,
    };

    const engineRequested = parsed.data.engine ?? "ml";
    let engineUsed: "rules" | "ml" = "rules";
    let output = computeRuleBasedOutput(baseline, input);
    let mlInfo: DigitalTwinMlInfo | undefined;
    let persistenceAvailable = true;
    const simulationRunModel = (prisma as any).digitalTwinSimulationRun as
      | {
          findMany: (args: unknown) => Promise<Array<{ input: unknown; output: unknown }>>;
          create: (args: unknown) => Promise<unknown>;
        }
      | undefined;

    if (engineRequested === "ml") {
      const samples: Array<{ input: DigitalTwinSimulationInput; output: DigitalTwinSimulationOutput }> = [];

      if (env.DIGITAL_TWIN_TRAINING_CSV_PATH) {
        try {
          samples.push(
            ...(await loadDigitalTwinTrainingSamplesFromCsv(env.DIGITAL_TWIN_TRAINING_CSV_PATH)),
          );
        } catch {
          // ignore and continue (DB samples may still be available)
        }
      }

      let runs: Array<{ input: unknown; output: unknown }> = [];
      if (!simulationRunModel?.findMany) {
        persistenceAvailable = false;
      } else {
        try {
          runs = await simulationRunModel.findMany({
            where: { engineUsed: "rules" },
            orderBy: { createdAt: "desc" },
            take: 500,
            select: { input: true, output: true },
          });
        } catch {
          persistenceAvailable = false;
        }
      }

      const dbSamples = runs
        .map((run) => {
          const runInput = run.input as Partial<DigitalTwinSimulationInput> | null;
          const runOutput = run.output as Partial<DigitalTwinSimulationOutput> | null;
          if (!runInput || !runOutput) return null;
          if (
            typeof runInput.demand_change !== "number" ||
            typeof runInput.staff !== "number" ||
            typeof runInput.price_change !== "number" ||
            typeof runInput.inventory_level !== "number"
          ) {
            return null;
          }
          if (
            typeof runOutput.wait_time !== "number" ||
            typeof runOutput.revenue !== "number" ||
            typeof runOutput.staff_utilisation !== "number" ||
            typeof runOutput.inventory_usage !== "number"
          ) {
            return null;
          }
          return {
            input: runInput as DigitalTwinSimulationInput,
            output: runOutput as DigitalTwinSimulationOutput,
          };
        })
        .filter(
          (value): value is { input: DigitalTwinSimulationInput; output: DigitalTwinSimulationOutput } =>
            value !== null,
        );

      samples.push(...dbSamples);

      // de-dupe identical samples (common if you regenerate CSV / rerun scenarios)
      const unique = new Map<string, { input: DigitalTwinSimulationInput; output: DigitalTwinSimulationOutput }>();
      for (const sample of samples) {
        unique.set(JSON.stringify(sample), sample);
      }
      const mergedSamples = Array.from(unique.values()).slice(0, 2000);

      const trained = trainDigitalTwinSurrogateModel(mergedSamples);
      if (trained) {
        engineUsed = "ml";
        mlInfo = trained.info;
        output = predictWithDigitalTwinSurrogateModel(trained.model, input);
      }
    }

    const recommendations = generateRecommendations(baseline, input, output, {
      engineRequested,
      engineUsed,
      mlInfo,
      persistenceAvailable,
    });

    const recordRun = parsed.data.record_run ?? true;
    if (recordRun && persistenceAvailable) {
      try {
        if (!simulationRunModel?.create) {
          persistenceAvailable = false;
        } else {
          await simulationRunModel.create({
            data: {
              engineRequested,
              engineUsed,
              input,
              output,
              mlInfo: mlInfo ? mlInfo : undefined,
            },
          });
        }
      } catch {
        // Swallow: DB may not be migrated yet.
        persistenceAvailable = false;
      }
    }

    return {
      ...output,
      recommendations,
      engine_requested: engineRequested,
      engine_used: engineUsed,
      ml_info: mlInfo,
    };
  });
};
