import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/dashboard", { preHandler: app.requireStaff }, async () => {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ["CONFIRMED", "PREPARING", "READY", "COMPLETED"]
        }
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              include: { category: true }
            }
          }
        }
      }
    });

    const totalRevenue = orders.reduce((sum: number, order) => sum + Number(order.totalAmount), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders === 0 ? 0 : totalRevenue / totalOrders;

    const categoryRevenue = new Map<string, number>();

    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const categoryName = item.menuItem.category.name;
        categoryRevenue.set(categoryName, (categoryRevenue.get(categoryName) ?? 0) + Number(item.lineTotal));
      });
    });

    return {
      metrics: {
        totalRevenue,
        totalOrders,
        averageOrderValue: Number(averageOrderValue.toFixed(2))
      },
      categoryBreakdown: Array.from(categoryRevenue.entries()).map(([category, revenue]) => ({
        category,
        revenue: Number(revenue.toFixed(2))
      }))
    };
  });
};
