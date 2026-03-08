import type { FastifyPluginAsync } from "fastify";
import { GameKey } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

const submitGameScoreSchema = z.object({
  phoneNumber: z.string().min(6),
  fullName: z.string().min(1),
  gameKey: z.nativeEnum(GameKey),
  score: z.number().int().nonnegative(),
  rewardPoints: z.number().int().nonnegative().default(0),
  rewardReason: z.string().min(1).max(120).optional(),
});

function getTierFromPoints(points: number) {
  if (points >= 1500) {
    return "platinum";
  }

  if (points >= 500) {
    return "gold";
  }

  return "silver";
}

export const gamesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/leaderboards", async () => {
    const leaderboardEntries = await prisma.gameScore.findMany({
      include: {
        user: true,
      },
      orderBy: [{ gameKey: "asc" }, { score: "desc" }, { createdAt: "asc" }],
    });

    const groupedScores = Object.values(GameKey).reduce<Record<string, Array<{
      rank: number;
      playerName: string;
      score: number;
      earnedPoints: number;
      createdAt: Date;
    }>>>((accumulator, gameKey) => {
      const topScores = leaderboardEntries
        .filter((entry) => entry.gameKey === gameKey)
        .slice(0, 10)
        .map((entry, index) => ({
          rank: index + 1,
          playerName: entry.user?.fullName ?? "Guest",
          score: entry.score,
          earnedPoints: entry.earnedPoints,
          createdAt: entry.createdAt,
        }));

      accumulator[gameKey] = topScores;
      return accumulator;
    }, {});

    return { leaderboards: groupedScores };
  });

  app.post("/score", async (request) => {
    const payload = submitGameScoreSchema.parse(request.body);

    const user = await prisma.user.upsert({
      where: { phoneNumber: payload.phoneNumber },
      update: {
        fullName: payload.fullName,
      },
      create: {
        phoneNumber: payload.phoneNumber,
        fullName: payload.fullName,
        role: "CUSTOMER",
      },
    });

    const scoreEntry = await prisma.gameScore.create({
      data: {
        userId: user.id,
        gameKey: payload.gameKey,
        score: payload.score,
        earnedPoints: payload.rewardPoints,
      },
    });

    let loyalty = null;

    if (payload.rewardPoints > 0) {
      const updatedAccount = await prisma.$transaction(async (tx) => {
        const existingAccount = await tx.loyaltyAccount.findUnique({
          where: { userId: user.id },
        });

        const nextPointsBalance =
          (existingAccount?.pointsBalance ?? 0) + payload.rewardPoints;
        const nextTier = getTierFromPoints(nextPointsBalance);

        return tx.loyaltyAccount.upsert({
          where: { userId: user.id },
          update: {
            pointsBalance: nextPointsBalance,
            tier: nextTier,
            transactions: {
              create: {
                type: "ADJUSTMENT",
                points: payload.rewardPoints,
                description:
                  payload.rewardReason ??
                  `Reward earned from ${payload.gameKey} leaderboard submission`,
              },
            },
          },
          create: {
            userId: user.id,
            pointsBalance: nextPointsBalance,
            tier: nextTier,
            transactions: {
              create: {
                type: "ADJUSTMENT",
                points: payload.rewardPoints,
                description:
                  payload.rewardReason ??
                  `Reward earned from ${payload.gameKey} leaderboard submission`,
              },
            },
          },
        });
      });

      loyalty = {
        pointsBalance: updatedAccount.pointsBalance,
        tier: updatedAccount.tier,
      };
    }

    const higherScoresCount = await prisma.gameScore.count({
      where: {
        gameKey: payload.gameKey,
        score: {
          gt: payload.score,
        },
      },
    });

    const latestTopScores = await prisma.gameScore.findMany({
      where: {
        gameKey: payload.gameKey,
      },
      include: {
        user: true,
      },
      orderBy: [{ score: "desc" }, { createdAt: "asc" }],
      take: 10,
    });

    return {
      score: {
        id: scoreEntry.id,
        gameKey: scoreEntry.gameKey,
        score: scoreEntry.score,
        earnedPoints: scoreEntry.earnedPoints,
        rank: higherScoresCount + 1,
      },
      loyalty,
      leaderboard: latestTopScores.map((entry, index) => ({
        rank: index + 1,
        playerName: entry.user?.fullName ?? "Guest",
        score: entry.score,
        earnedPoints: entry.earnedPoints,
        createdAt: entry.createdAt,
      })),
    };
  });
};
