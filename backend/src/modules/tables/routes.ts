import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";

export const tablesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/active", async () => {
    const tables = await prisma.restaurantTable.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    });

    return {
      tables: tables.map((table) => ({
        code: table.code,
        label: table.label,
        seatCount: table.seatCount,
      })),
    };
  });
};
