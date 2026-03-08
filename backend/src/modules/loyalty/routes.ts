import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

export const loyaltyRoutes: FastifyPluginAsync = async (app) => {
  app.get("/:phoneNumber", async (request, reply) => {
    const { phoneNumber } = request.params as { phoneNumber: string };

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

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        flavorProfile: user.flavorProfile,
      },
      loyaltyAccount: user.loyaltyAccount
    };
  });

  app.put("/:phoneNumber/preferences", async (request) => {
    const { phoneNumber } = request.params as { phoneNumber: string };
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

    const user = await prisma.user.upsert({
      where: { phoneNumber },
      update: {
        fullName: payload.fullName,
        flavorProfile: payload.flavorProfile,
      },
      create: {
        phoneNumber,
        fullName: payload.fullName ?? "Guest",
        role: "CUSTOMER",
        flavorProfile: payload.flavorProfile,
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
      },
      loyaltyAccount: user.loyaltyAccount,
    };
  });
};
