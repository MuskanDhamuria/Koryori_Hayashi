import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { buildOrderLineItems, calculateOrderPricing, getAvailableDiscounts, getBirthdayDiscountPercent, getSelectedDiscount, getTierFromPoints, getTierMultiplier, } from "./orderHelpers.js";
import { normalizeTier, resolveCustomerMetadata } from "../customer/profileMetadata.js";
const createOrderSchema = z.object({
    customerName: z.string().min(1),
    phoneNumber: z.string().min(6).optional(),
    tableCode: z.string().min(1),
    notes: z.string().max(500).optional(),
    items: z
        .array(z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().positive(),
    }))
        .min(1),
    paymentMethod: z.enum(["CARD", "MOBILE", "CASH"]).default("CARD"),
    selectedDiscountId: z
        .enum(["points-5", "points-10", "points-15", "first-time", "referral"])
        .nullable()
        .optional(),
});
class RouteError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}
async function buildOrderContext(tx, payload) {
    const table = await tx.restaurantTable.findUnique({
        where: { code: payload.tableCode },
    });
    if (!table) {
        throw new RouteError(404, "Table not found");
    }
    const menuItems = await tx.menuItem.findMany({
        where: {
            id: {
                in: payload.items.map((item) => item.menuItemId),
            },
            isAvailable: true,
        },
        include: {
            inventoryItem: true,
        },
    });
    if (menuItems.length !== payload.items.length) {
        throw new RouteError(400, "One or more menu items are unavailable");
    }
    const existingCustomer = payload.phoneNumber
        ? await tx.user.findUnique({
            where: { phoneNumber: payload.phoneNumber },
            include: {
                loyaltyAccount: true,
            },
        })
        : null;
    const metadata = resolveCustomerMetadata({
        phoneNumber: payload.phoneNumber,
        fullName: payload.customerName,
        referralCode: existingCustomer?.referralCode,
    });
    const currentTier = normalizeTier(existingCustomer?.loyaltyAccount?.tier);
    const currentPoints = existingCustomer?.loyaltyAccount?.pointsBalance ?? 0;
    const birthdayDiscountPercent = getBirthdayDiscountPercent({
        tier: currentTier,
        isBirthday: metadata.isBirthday,
    });
    const lineItems = buildOrderLineItems(menuItems, payload.items);
    const preflightPricing = calculateOrderPricing({
        lineItems,
        birthdayDiscountPercent,
        selectedDiscount: { amount: 0, pointsCost: 0 },
    });
    const selectedDiscount = getSelectedDiscount({
        selectedDiscountId: payload.selectedDiscountId,
        totalBeforeSelectedDiscount: preflightPricing.totalBeforeSelectedDiscount,
        currentPoints,
        currentTier,
    });
    const pricing = calculateOrderPricing({
        lineItems,
        birthdayDiscountPercent,
        selectedDiscount,
    });
    return {
        table,
        menuItems,
        lineItems,
        pricing,
        selectedDiscount,
        currentTier,
        currentPoints,
        birthdayDiscountPercent,
        existingCustomer,
        customerMetadata: metadata,
        availableDiscounts: getAvailableDiscounts({
            currentPoints,
            currentTier,
            totalBeforeSelectedDiscount: preflightPricing.totalBeforeSelectedDiscount,
            referralEligible: false,
        }),
    };
}
export const ordersRoutes = async (app) => {
    app.post("/preview", async (request, reply) => {
        const payload = createOrderSchema.parse({
            paymentMethod: "CARD",
            ...request.body,
        });
        try {
            const context = await buildOrderContext(prisma, payload);
            return {
                pricing: {
                    subtotal: context.pricing.subtotal,
                    birthdayDiscountPercent: context.birthdayDiscountPercent,
                    birthdayDiscountAmount: context.pricing.birthdayDiscountAmount,
                    subtotalAfterBirthdayDiscount: context.pricing.subtotalAfterBirthdayDiscount,
                    taxAmount: context.pricing.taxAmount,
                    totalBeforeSelectedDiscount: context.pricing.totalBeforeSelectedDiscount,
                    selectedDiscountId: payload.selectedDiscountId ?? null,
                    selectedDiscountAmount: context.selectedDiscount.amount,
                    selectedDiscountPointsCost: context.selectedDiscount.pointsCost,
                    finalTotal: context.pricing.totalAmount,
                    pointsMultiplier: getTierMultiplier(context.currentTier),
                    pointsEarned: Math.floor(context.pricing.totalAmount * getTierMultiplier(context.currentTier)),
                    projectedPointsBalance: context.currentPoints -
                        context.selectedDiscount.pointsCost +
                        Math.floor(context.pricing.totalAmount * getTierMultiplier(context.currentTier)),
                },
                availableDiscounts: context.availableDiscounts,
                loyaltyProfile: {
                    tier: context.currentTier,
                    points: context.currentPoints,
                    name: context.customerMetadata.fullName,
                    isBirthday: context.customerMetadata.isBirthday,
                    referralCode: context.customerMetadata.referralCode,
                },
            };
        }
        catch (error) {
            if (error instanceof RouteError) {
                return reply.code(error.statusCode).send({ message: error.message });
            }
            throw error;
        }
    });
    app.post("/", async (request, reply) => {
        const payload = createOrderSchema.parse(request.body);
        try {
            const result = await prisma.$transaction(async (tx) => {
                const context = await buildOrderContext(tx, payload);
                let customer = null;
                const currentTier = context.currentTier;
                const currentPoints = context.currentPoints;
                const orderNumber = `KH-${Date.now().toString().slice(-8)}`;
                if (payload.phoneNumber) {
                    customer = await tx.user.upsert({
                        where: { phoneNumber: payload.phoneNumber },
                        update: {
                            fullName: context.customerMetadata.fullName,
                            referralCode: context.customerMetadata.referralCode,
                        },
                        create: {
                            phoneNumber: payload.phoneNumber,
                            fullName: context.customerMetadata.fullName,
                            role: "CUSTOMER",
                            referralCode: context.customerMetadata.referralCode,
                        },
                    });
                }
                const order = await tx.order.create({
                    data: {
                        orderNumber,
                        userId: customer?.id,
                        tableId: context.table.id,
                        notes: payload.notes,
                        status: "CONFIRMED",
                        subtotalAmount: context.pricing.subtotal,
                        discountAmount: context.pricing.discountAmount,
                        taxAmount: context.pricing.taxAmount,
                        totalAmount: context.pricing.totalAmount,
                        orderItems: {
                            create: context.lineItems.map((item) => ({
                                menuItemId: item.menuItemId,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                lineTotal: item.lineTotal,
                                discountPercent: item.discountPercent,
                            })),
                        },
                        payment: {
                            create: {
                                method: payload.paymentMethod,
                                status: payload.paymentMethod === "CASH" ? "PENDING" : "PAID",
                                amount: context.pricing.totalAmount,
                                paidAt: payload.paymentMethod === "CASH" ? null : new Date(),
                            },
                        },
                    },
                    include: {
                        orderItems: {
                            include: {
                                menuItem: true,
                            },
                        },
                        payment: true,
                        table: true,
                    },
                });
                let loyalty = null;
                if (customer) {
                    const earnedPoints = Math.floor(context.pricing.totalAmount * getTierMultiplier(currentTier));
                    if (context.selectedDiscount.pointsCost > 0) {
                        const existingAccount = await tx.loyaltyAccount.findUnique({
                            where: { userId: customer.id },
                        });
                        if (!existingAccount || existingAccount.pointsBalance < context.selectedDiscount.pointsCost) {
                            throw new RouteError(400, "Insufficient loyalty points for selected discount");
                        }
                        await tx.loyaltyAccount.update({
                            where: { userId: customer.id },
                            data: {
                                pointsBalance: {
                                    decrement: context.selectedDiscount.pointsCost,
                                },
                                transactions: {
                                    create: {
                                        type: "REDEEM",
                                        points: -context.selectedDiscount.pointsCost,
                                        description: `Points redeemed on order ${order.orderNumber}`,
                                    },
                                },
                            },
                        });
                    }
                    const loyaltyAccount = await tx.loyaltyAccount.upsert({
                        where: { userId: customer.id },
                        update: {
                            pointsBalance: {
                                increment: earnedPoints,
                            },
                        },
                        create: {
                            userId: customer.id,
                            pointsBalance: earnedPoints,
                            tier: getTierFromPoints(earnedPoints),
                        },
                    });
                    const nextTier = getTierFromPoints(loyaltyAccount.pointsBalance);
                    const nextPointsBalance = await tx.loyaltyAccount.update({
                        where: { userId: customer.id },
                        data: {
                            tier: nextTier,
                            transactions: {
                                create: {
                                    type: "EARN",
                                    points: earnedPoints,
                                    description: `Points earned from order ${order.orderNumber}`,
                                },
                            },
                        },
                    });
                    loyalty = {
                        earnedPoints,
                        pointsBalance: nextPointsBalance.pointsBalance,
                        tier: nextPointsBalance.tier,
                    };
                }
                return { order, loyalty };
            });
            return reply.code(201).send(result);
        }
        catch (error) {
            if (error instanceof RouteError) {
                return reply.code(error.statusCode).send({ message: error.message });
            }
            throw error;
        }
    });
    app.get("/", { preHandler: app.requireStaff }, async () => {
        const orders = await prisma.order.findMany({
            include: {
                orderItems: {
                    include: { menuItem: true },
                },
                table: true,
                payment: true,
                user: true,
            },
            orderBy: { orderedAt: "desc" },
            take: 50,
        });
        return { orders };
    });
};
