import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { env } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";

const askBodySchema = z.object({
  question: z.string().min(3).max(500),
});

function round(value: number) {
  return Number(value.toFixed(2));
}

export const aiRoutes: FastifyPluginAsync = async (app) => {
  app.post("/ask", { preHandler: app.requireStaff }, async (request, reply) => {
    const parsed = askBodySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({ message: "Invalid question payload" });
    }

    if (!env.GEMINI_API_KEY) {
      return reply.code(503).send({
        message: "GEMINI_API_KEY is not configured on the server",
      });
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [recentOrders, inventoryItems, topOrderItems] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: {
            in: ["CONFIRMED", "PREPARING", "READY", "COMPLETED"],
          },
          orderedAt: {
            gte: oneMonthAgo,
          },
        },
        orderBy: {
          orderedAt: "desc",
        },
        include: {
          orderItems: {
            include: {
              menuItem: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      }),
      prisma.inventoryItem.findMany({
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          stockOnHand: "asc",
        },
      }),
      prisma.orderItem.groupBy({
        by: ["menuItemId"],
        where: {
          order: {
            orderedAt: {
              gte: oneMonthAgo,
            },
            status: {
              in: ["CONFIRMED", "PREPARING", "READY", "COMPLETED"],
            },
          },
        },
        _sum: {
          quantity: true,
          lineTotal: true,
        },
        orderBy: {
          _sum: {
            lineTotal: "desc",
          },
        },
        take: 5,
      }),
    ]);

    const inventoryAlerts = inventoryItems
      .filter((item) => item.stockOnHand <= item.reorderPoint)
      .slice(0, 10);

    const topMenuItems = await prisma.menuItem.findMany({
      where: {
        id: {
          in: topOrderItems.map((item) => item.menuItemId),
        },
      },
      include: {
        category: true,
      },
    });

    const menuById = new Map(topMenuItems.map((item) => [item.id, item]));

    const weekOrders = recentOrders.filter((order) => order.orderedAt >= oneWeekAgo);
    const weekRevenue = round(
      weekOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
    );
    const monthRevenue = round(
      recentOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
    );
    const averageOrderValue =
      weekOrders.length === 0 ? 0 : round(weekRevenue / weekOrders.length);

    const context = {
      generatedAt: now.toISOString(),
      kpis: {
        weekRevenue,
        monthRevenue,
        weekOrders: weekOrders.length,
        averageOrderValue,
      },
      topItems: topOrderItems.map((item) => {
        const menuItem = menuById.get(item.menuItemId);
        return {
          id: item.menuItemId,
          name: menuItem?.name ?? "Unknown item",
          category: menuItem?.category.name ?? "Uncategorized",
          unitsSold: item._sum.quantity ?? 0,
          revenue: round(Number(item._sum.lineTotal ?? 0)),
        };
      }),
      lowInventory: inventoryAlerts.map((item) => ({
        itemName: item.menuItem.name,
        category: item.menuItem.category.name,
        stockOnHand: item.stockOnHand,
        reorderPoint: item.reorderPoint,
      })),
      recentOrders: weekOrders.slice(0, 10).map((order) => ({
        orderedAt: order.orderedAt.toISOString(),
        totalAmount: round(Number(order.totalAmount)),
        status: order.status,
        itemCount: order.orderItems.length,
      })),
    };

    const prompt = [
      "You are an operations analyst for a Japanese cafe dashboard.",
      "Use ONLY the supplied JSON data.",
      "If data is missing, state that clearly instead of guessing.",
      "Keep answers concise and actionable.",
      "",
      `Question: ${parsed.data.question}`,
      "",
      `Data: ${JSON.stringify(context)}`,
    ].join("\n");

    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          env.GEMINI_MODEL,
        )}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 500,
            },
          }),
          signal: AbortSignal.timeout(env.GEMINI_TIMEOUT_MS),
        },
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      request.log.error({ errorMessage }, "Gemini network request failed");

      if (errorMessage.toLowerCase().includes("timeout")) {
        return reply.code(504).send({
          message: `Gemini timed out after ${env.GEMINI_TIMEOUT_MS}ms`,
        });
      }

      return reply.code(502).send({ message: "Gemini network request failed" });
    }

    if (!response.ok) {
      const errorText = await response.text();
      request.log.error({ status: response.status, errorText }, "Gemini request failed");
      return reply.code(502).send({
        message: `Gemini request failed (${response.status})`,
        upstreamStatus: response.status,
        upstreamError: errorText.slice(0, 500),
      });
    }

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const answer =
      payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("\n")
        .trim() ?? "";

    if (!answer) {
      return reply.code(502).send({ message: "Gemini returned an empty response" });
    }

    return {
      answer,
      model: env.GEMINI_MODEL,
      generatedAt: now.toISOString(),
    };
  });
};
