import { prisma } from "../../lib/prisma.js";
import { serializeMenuItem } from "./serializers.js";
export const menuRoutes = async (app) => {
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
        return {
            categories: categories.map((category) => ({
                ...category,
                items: category.items.map((item) => serializeMenuItem({
                    ...item,
                    category: {
                        slug: category.slug,
                        name: category.name,
                    },
                })),
            })),
        };
    });
    app.get("/pairings", async () => {
        const pairings = await prisma.menuItemPairing.findMany({
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
        return {
            items: items.map((item) => serializeMenuItem({
                ...item,
                category: {
                    slug: "featured",
                    name: "Featured",
                },
            })),
        };
    });
};
