import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => {
    return {
      status: "ok",
      service: "backend",
      timestamp: new Date().toISOString(),
      database: {
        ok: null,
        error: null
      }
    };
  });

  app.get("/db", async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.send({ ok: true });
    } catch (error) {
      return reply.code(503).send({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown database error"
      });
    }
  });
};
