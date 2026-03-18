import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { buildRecommendations } from "./recommendations.js";
import { resolveCustomerMetadata, normalizeTier } from "./profileMetadata.js";
import { getCurrentWeather } from "./weather.js";
import { serializeMenuItem } from "../menu/serializers.js";

const flavorPreferencesSchema = z.object({
  umamiVsCitrus: z.enum(["umami", "citrus", "balanced"]),
  refreshingVsHearty: z.enum(["refreshing", "hearty", "balanced"]),
  spicyTolerance: z.enum(["mild", "medium", "very-spicy"]),
});

async function getOrderHistoryItemIds(phoneNumber: string) {
  const user = await prisma.user.findUnique({
    where: { phoneNumber },
    select: { id: true },
  });

  if (!user) {
    return [] as string[];
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

  const itemIds: string[] = [];
  for (const order of [...recentOrders].reverse()) {
    for (const item of order.orderItems) {
      const repeats = Math.max(1, item.quantity);
      for (let index = 0; index < repeats; index += 1) {
        itemIds.push(item.menuItemId);
      }
    }
  }

  return itemIds.slice(-500);
}

export const customerRoutes: FastifyPluginAsync = async (app) => {
  app.get("/experience", async (request) => {
    const query = z
      .object({
        phoneNumber: z.string().min(6),
      })
      .parse(request.query);

    const [user, categories, tables, orderHistoryItemIds, weather] = await Promise.all([
      prisma.user.findUnique({
        where: { phoneNumber: query.phoneNumber },
        include: {
          loyaltyAccount: true,
        },
      }),
      prisma.category.findMany({
        include: {
          items: {
            where: { isAvailable: true },
            include: {
              inventoryItem: true,
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { name: "asc" },
      }),
      prisma.restaurantTable.findMany({
        where: { isActive: true },
        orderBy: { code: "asc" },
      }),
      getOrderHistoryItemIds(query.phoneNumber),
      getCurrentWeather(),
    ]);

    const customerMetadata = resolveCustomerMetadata({
      phoneNumber: query.phoneNumber,
      fullName: user?.fullName,
      referralCode: user?.referralCode,
    });
    const tier = normalizeTier(user?.loyaltyAccount?.tier);
    const points = user?.loyaltyAccount?.pointsBalance ?? 0;
    const fullName = customerMetadata.fullName;

    const menuItems = categories.flatMap((category) =>
      category.items.map((item) =>
        serializeMenuItem({
          ...item,
          category: {
            slug: category.slug,
            name: category.name,
          },
        }),
      ),
    );

    return {
      customer: {
        phoneNumber: query.phoneNumber,
        fullName,
        flavorProfile: user?.flavorProfile ?? null,
        loyaltyProfile: {
          tier,
          points,
          name: fullName,
          isBirthday: customerMetadata.isBirthday,
          referralCode: customerMetadata.referralCode,
        },
      },
      categories: categories.map((category) => ({
        id: category.slug,
        label: category.name,
      })),
      menuItems,
      orderHistoryItemIds,
      weather,
      availableTables: tables.map((table) => ({
        code: table.code,
        label: table.label,
        seatCount: table.seatCount,
      })),
    };
  });

  app.post("/recommendations", async (request) => {
    const payload = z
      .object({
        phoneNumber: z.string().min(6),
        cartItemIds: z.array(z.string()).default([]),
        flavorPreferences: flavorPreferencesSchema.nullable().optional(),
      })
      .parse(request.body);

    const [menuItemsRaw, pairings, orderHistoryItemIds, weather, topOrderedItems] = await Promise.all([
      prisma.menuItem.findMany({
        where: { isAvailable: true },
        include: {
          category: true,
          inventoryItem: true,
        },
      }),
      (prisma as any).menuItemPairing.findMany({
        select: {
          sourceMenuItemId: true,
          targetMenuItemId: true,
          weight: true,
          reason: true,
        },
      }) as Promise<
        Array<{
          sourceMenuItemId: string;
          targetMenuItemId: string;
          weight: number;
          reason: string | null;
        }>
      >,
      getOrderHistoryItemIds(payload.phoneNumber),
      getCurrentWeather(),
      prisma.orderItem.groupBy({
        by: ["menuItemId"],
        _sum: {
          quantity: true,
        },
      }),
    ]);

    const popularityByItemId = new Map(
      topOrderedItems.map((entry) => [entry.menuItemId, entry._sum.quantity ?? 0]),
    );

    const menuItems = menuItemsRaw.map((item) =>
      serializeMenuItem({
        ...item,
        category: {
          slug: item.category.slug,
          name: item.category.name,
        },
      }),
    );

    const recommendations = buildRecommendations({
      menuItems,
      cartItemIds: payload.cartItemIds,
      flavorPreferences: payload.flavorPreferences ?? null,
      weather,
      menuItemPairings: pairings,
      userHistory: orderHistoryItemIds,
      popularityByItemId,
    });

    return { recommendations, weather };
  });
};
