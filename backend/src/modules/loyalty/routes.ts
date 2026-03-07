import type { FastifyPluginAsync } from "fastify";
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
        phoneNumber: user.phoneNumber
      },
      loyaltyAccount: user.loyaltyAccount
    };
  });
};
