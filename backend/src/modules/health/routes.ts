import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../../lib/prisma.js";

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/", async () => {
    let databaseOk = false;
    let databaseError: string | null = null;

    try {
      await prisma.$queryRaw`SELECT 1`;
      databaseOk = true;
    } catch (error) {
      databaseOk = false;
      databaseError = error instanceof Error ? error.message : "Unknown database error";
    }

    return {
      status: "ok",
      service: "backend",
      timestamp: new Date().toISOString(),
      database: {
        ok: databaseOk,
        error: databaseError
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
