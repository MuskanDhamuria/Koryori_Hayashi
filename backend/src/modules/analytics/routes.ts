import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";
import { buildDashboardAnalytics } from "./dashboard.js";

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/dashboard", { preHandler: app.requireStaff }, async () => {
    const [orders, inventoryItems, menuItems, staffUsers, activeTables] =
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
                  include: {
                    category: true,
                    inventoryItem: true,
                  },
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
        prisma.menuItem.findMany({
          include: {
            category: true,
            inventoryItem: true,
          },
        }),
        prisma.user.findMany({
          where: {
            role: {
              in: ["STAFF", "ADMIN"],
            },
          },
          orderBy: { fullName: "asc" },
        }),
        prisma.restaurantTable.count({
          where: { isActive: true },
        }),
      ]);

    return buildDashboardAnalytics({
      orders,
      inventoryItems,
      menuItems,
      staffUsers,
      activeTables,
    });
  });
};
