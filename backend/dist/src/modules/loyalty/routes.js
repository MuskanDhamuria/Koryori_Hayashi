import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { normalizeTier, resolveCustomerMetadata } from "../customer/profileMetadata.js";
export const loyaltyRoutes = async (app) => {
    app.get("/:phoneNumber/history", async (request) => {
        const { phoneNumber } = request.params;
        const user = await prisma.user.findUnique({
            where: { phoneNumber },
            select: { id: true },
        });
        if (!user) {
            return { itemIds: [] };
        }
        const recentOrders = await prisma.order.findMany({
            where: { userId: user.id },
            select: {
                orderedAt: true,
                orderItems: {
                    select: {
                        menuItemId: true,
                        quantity: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: { orderedAt: "desc" },
            take: 25,
        });
        // Convert to "most-recent last" item IDs (repeated by quantity).
        const itemIds = [];
        for (const order of [...recentOrders].reverse()) {
            for (const orderItem of order.orderItems) {
                const repeats = Math.max(1, orderItem.quantity);
                for (let i = 0; i < repeats; i += 1) {
                    itemIds.push(orderItem.menuItemId);
                }
            }
        }
        return { itemIds: itemIds.slice(-500) };
    });
    app.get("/:phoneNumber", async (request, reply) => {
        const { phoneNumber } = request.params;
        const user = await prisma.user.findUnique({
            where: { phoneNumber },
            include: {
                loyaltyAccount: {
                    include: {
                        transactions: {
                            orderBy: { createdAt: "desc" },
                            take: 10
                        }
                    }
                }
            }
        });
        if (!user) {
            return reply.code(404).send({ message: "Customer not found" });
        }
        const metadata = resolveCustomerMetadata({
            phoneNumber: user.phoneNumber,
            fullName: user.fullName,
            referralCode: user.referralCode,
        });
        return {
            user: {
                id: user.id,
                fullName: metadata.fullName,
                phoneNumber: user.phoneNumber,
                flavorProfile: user.flavorProfile,
                referralCode: metadata.referralCode,
                isBirthday: metadata.isBirthday,
            },
            loyaltyAccount: user.loyaltyAccount
                ? {
                    ...user.loyaltyAccount,
                    tier: normalizeTier(user.loyaltyAccount.tier),
                }
                : null,
        };
    });
    app.put("/:phoneNumber/preferences", async (request) => {
        const { phoneNumber } = request.params;
        const payload = z
            .object({
            fullName: z.string().min(1).optional(),
            flavorProfile: z.object({
                umamiVsCitrus: z.enum(["umami", "citrus", "balanced"]),
                refreshingVsHearty: z.enum(["refreshing", "hearty", "balanced"]),
                spicyTolerance: z.enum(["mild", "medium", "very-spicy"]),
            }),
        })
            .parse(request.body);
        const metadata = resolveCustomerMetadata({
            phoneNumber,
            fullName: payload.fullName,
        });
        const user = await prisma.user.upsert({
            where: { phoneNumber },
            update: {
                fullName: metadata.fullName,
                flavorProfile: payload.flavorProfile,
            },
            create: {
                phoneNumber,
                fullName: metadata.fullName,
                role: "CUSTOMER",
                flavorProfile: payload.flavorProfile,
                referralCode: metadata.referralCode,
            },
            include: {
                loyaltyAccount: true,
            },
        });
        return {
            user: {
                id: user.id,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                flavorProfile: user.flavorProfile,
                referralCode: user.referralCode ?? metadata.referralCode,
                isBirthday: metadata.isBirthday,
            },
            loyaltyAccount: user.loyaltyAccount
                ? {
                    ...user.loyaltyAccount,
                    tier: normalizeTier(user.loyaltyAccount.tier),
                }
                : null,
        };
    });
};
