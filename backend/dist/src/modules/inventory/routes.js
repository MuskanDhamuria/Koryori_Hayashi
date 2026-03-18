import { prisma } from "../../lib/prisma.js";
export const inventoryRoutes = async (app) => {
    app.get("/", { preHandler: app.requireStaff }, async () => {
        const inventory = await prisma.inventoryItem.findMany({
            include: {
                menuItem: {
                    include: {
                        category: true,
                    },
                },
            },
            orderBy: { stockOnHand: "asc" }
        });
        return { inventory };
    });
    app.get("/alerts", { preHandler: app.requireStaff }, async () => {
        const alerts = await prisma.inventoryItem.findMany({
            where: {
                stockOnHand: {
                    lte: 20
                }
            },
            include: {
                menuItem: {
                    include: {
                        category: true,
                    },
                },
            },
            orderBy: { stockOnHand: "asc" }
        });
        return {
            alerts: alerts.map((alert) => ({
                item: {
                    id: alert.menuItem.id,
                    name: alert.menuItem.name,
                    category: alert.menuItem.category?.name ?? "Uncategorized",
                    stock: alert.stockOnHand,
                    reorderPoint: alert.reorderPoint,
                },
                daysUntilStockout: Math.max(1, Math.floor(alert.stockOnHand / Math.max(1, alert.reorderPoint / 3 || 1))),
                suggestedOrder: Math.max(alert.reorderPoint * 3 - alert.stockOnHand, 0),
            })),
        };
    });
};
