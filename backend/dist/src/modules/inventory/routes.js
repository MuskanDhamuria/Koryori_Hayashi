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
        return { alerts };
    });
};
