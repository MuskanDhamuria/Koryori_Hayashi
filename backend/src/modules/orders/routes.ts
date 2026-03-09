import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import {
  buildOrderLineItems,
  calculateOrderPricing,
  getSelectedDiscount,
  getTierFromPoints,
  getTierMultiplier,
} from "./orderHelpers.js";

const createOrderSchema = z.object({
  customerName: z.string().min(1),
  phoneNumber: z.string().min(6).optional(),
  tableCode: z.string().min(1),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        menuItemId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  paymentMethod: z.enum(["CARD", "MOBILE", "CASH"]).default("CARD"),
  birthdayDiscountPercent: z
    .union([z.literal(0), z.literal(5), z.literal(10), z.literal(15)])
    .default(0),
  selectedDiscountId: z
    .enum(["points-5", "points-10", "points-15", "first-time", "referral"])
    .nullable()
    .optional(),
});

class RouteError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const ordersRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", async (request, reply) => {
    const payload = createOrderSchema.parse(request.body);

    try {
      const result = await prisma.$transaction(async (tx) => {
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
        });

        if (menuItems.length !== payload.items.length) {
          throw new RouteError(400, "One or more menu items are unavailable");
        }

        let customer = null;
        let currentTier = "silver";
        let currentPoints = 0;

        if (payload.phoneNumber) {
          customer = await tx.user.upsert({
            where: { phoneNumber: payload.phoneNumber },
            update: { fullName: payload.customerName },
            create: {
              phoneNumber: payload.phoneNumber,
              fullName: payload.customerName,
              role: "CUSTOMER",
            },
          });

          const loyaltyAccount = await tx.loyaltyAccount.findUnique({
            where: { userId: customer.id },
          });

          currentTier = loyaltyAccount?.tier ?? "silver";
          currentPoints = loyaltyAccount?.pointsBalance ?? 0;
        }

        const lineItems = buildOrderLineItems(menuItems, payload.items);
        const preflightPricing = calculateOrderPricing({
          lineItems,
          birthdayDiscountPercent: payload.birthdayDiscountPercent,
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
          birthdayDiscountPercent: payload.birthdayDiscountPercent,
          selectedDiscount,
        });
        const orderNumber = `KH-${Date.now().toString().slice(-8)}`;

        const order = await tx.order.create({
          data: {
            orderNumber,
            userId: customer?.id,
            tableId: table.id,
            notes: payload.notes,
            status: "CONFIRMED",
            subtotalAmount: pricing.subtotal,
            discountAmount: pricing.discountAmount,
            taxAmount: pricing.taxAmount,
            totalAmount: pricing.totalAmount,
            orderItems: {
              create: lineItems.map((item) => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                lineTotal: item.lineTotal,
              })),
            },
            payment: {
              create: {
                method: payload.paymentMethod,
                status: payload.paymentMethod === "CASH" ? "PENDING" : "PAID",
                amount: pricing.totalAmount,
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
          const earnedPoints = Math.floor(pricing.totalAmount * getTierMultiplier(currentTier));

          if (selectedDiscount.pointsCost > 0) {
            const existingAccount = await tx.loyaltyAccount.findUnique({
              where: { userId: customer.id },
            });

            if (!existingAccount || existingAccount.pointsBalance < selectedDiscount.pointsCost) {
              throw new RouteError(400, "Insufficient loyalty points for selected discount");
            }

            await tx.loyaltyAccount.update({
              where: { userId: customer.id },
              data: {
                pointsBalance: {
                  decrement: selectedDiscount.pointsCost,
                },
                transactions: {
                  create: {
                    type: "REDEEM",
                    points: -selectedDiscount.pointsCost,
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
    } catch (error) {
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
