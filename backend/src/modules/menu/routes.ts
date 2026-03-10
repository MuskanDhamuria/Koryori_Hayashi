import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";

export const menuRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => {
    const categories = await prisma.category.findMany({
      include: {
        items: {
          where: { isAvailable: true },
          include: {
            inventoryItem: true
          },
          orderBy: { name: "asc" }
        }
      },
      orderBy: { name: "asc" }
    });

    return { categories };
  });

  app.get("/pairings", async () => {
    const pairings = await (prisma as any).menuItemPairing.findMany({
      select: {
        sourceMenuItemId: true,
        targetMenuItemId: true,
        weight: true,
        reason: true
      }
    });

    return { pairings };
  });

  app.get("/featured", async () => {
    const items = await prisma.menuItem.findMany({
      where: {
        isAvailable: true,
        OR: [{ isNew: true }, { isHighMargin: true }]
      },
      include: {
        inventoryItem: true
      },
      take: 8,
      orderBy: [{ isNew: "desc" }, { name: "asc" }]
    });

    return { items };
  });
};
