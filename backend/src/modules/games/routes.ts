import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";

const GAME_KEYS = ["PLATE_DASH", "SAKE_POUR", "SUSHI_MEMORY"] as const;
type GameKey = (typeof GAME_KEYS)[number];
type LeaderboardScoreEntry = {
  userId: string | null;
  score: number;
  earnedPoints: number;
  createdAt: Date;
  user: {
    fullName: string;
  } | null;
};

const submitGameScoreSchema = z.object({
  phoneNumber: z.string().min(6),
  fullName: z.string().min(1),
  gameKey: z.enum(GAME_KEYS),
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

function getLeaderboardIdentity(entry: LeaderboardScoreEntry) {
  return entry.userId ?? `guest:${entry.user?.fullName ?? "Guest"}`;
}

function buildLeaderboard(entries: LeaderboardScoreEntry[]) {
  const bestScoresByPlayer = new Map<string, LeaderboardScoreEntry>();

  for (const entry of entries) {
    const identity = getLeaderboardIdentity(entry);
    const currentBest = bestScoresByPlayer.get(identity);

    if (!currentBest) {
      bestScoresByPlayer.set(identity, entry);
      continue;
    }

    if (entry.score > currentBest.score) {
      bestScoresByPlayer.set(identity, entry);
      continue;
    }

    if (entry.score === currentBest.score && entry.createdAt < currentBest.createdAt) {
      bestScoresByPlayer.set(identity, entry);
    }
  }

  return [...bestScoresByPlayer.values()]
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.createdAt.getTime() - right.createdAt.getTime();
    })
    .slice(0, 10)
    .map((entry, index) => ({
      rank: index + 1,
      playerName: entry.user?.fullName ?? "Guest",
      score: entry.score,
      earnedPoints: entry.earnedPoints,
      createdAt: entry.createdAt,
      userId: entry.userId,
    }));
}

export const gamesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/leaderboards", async () => {
    const leaderboardEntries = await prisma.gameScore.findMany({
      include: {
        user: true,
      },
      orderBy: [{ gameKey: "asc" }, { score: "desc" }, { createdAt: "asc" }],
    });

    const groupedScores = GAME_KEYS.reduce<Record<GameKey, Array<{
      rank: number;
      playerName: string;
      score: number;
      earnedPoints: number;
      createdAt: Date;
    }>>>((accumulator, gameKey) => {
      const topScores = buildLeaderboard(
        leaderboardEntries.filter((entry) => entry.gameKey === gameKey),
      ).map(({ userId: _userId, ...entry }) => entry);

      accumulator[gameKey] = topScores;
      return accumulator;
    }, {
      PLATE_DASH: [],
      SAKE_POUR: [],
      SUSHI_MEMORY: [],
    });

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
        gameKey: payload.gameKey as any,
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

    const latestScoresForGame = await prisma.gameScore.findMany({
      where: {
        gameKey: payload.gameKey as any,
      },
      include: {
        user: true,
      },
      orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    });

    const latestTopScores = buildLeaderboard(latestScoresForGame);
    const playerRank =
      latestTopScores.find((entry) => entry.userId === user.id)?.rank ?? null;

    return {
      score: {
        id: scoreEntry.id,
        gameKey: scoreEntry.gameKey,
        score: scoreEntry.score,
        earnedPoints: scoreEntry.earnedPoints,
        rank: playerRank ?? latestTopScores.length + 1,
      },
      loyalty,
      leaderboard: latestTopScores.map(({ userId: _userId, ...entry }) => entry),
    };
  });
};
