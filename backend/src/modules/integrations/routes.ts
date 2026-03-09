import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { z } from "zod";
import { attachIntegrationStream, broadcastIntegrationEvent, closeIntegrationStreams } from "./events.js";
import { spreadsheetSyncManager } from "./spreadsheetSync.js";

const watchSchema = z.object({
  filePath: z.string().min(1),
  csvTarget: z.enum(["menuItems", "inventoryItems"]),
});

function extractBearerToken(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length);
  }

  const query = request.query as Record<string, unknown>;
  return typeof query.token === "string" ? query.token : null;
}

async function authenticateStream(request: FastifyRequest) {
  const token = extractBearerToken(request);
  if (!token) {
    throw new Error("Missing token");
  }

  const verified = await request.server.jwt.verify<{ role: string }>(token);
  if (!["STAFF", "ADMIN"].includes(verified.role)) {
    throw new Error("Forbidden");
  }
}

export const integrationRoutes: FastifyPluginAsync = async (app) => {
  await spreadsheetSyncManager.resumeFromState();

  app.addHook("onClose", async () => {
    await spreadsheetSyncManager.stopWatching(false);
    closeIntegrationStreams();
  });

  app.get("/spreadsheet/status", { preHandler: app.requireStaff }, async () => {
    return spreadsheetSyncManager.getStatus();
  });

  app.post("/spreadsheet/watch", { preHandler: app.requireStaff }, async (request, reply) => {
    const payload = watchSchema.parse(request.body);
    const status = await spreadsheetSyncManager.startWatching(payload.filePath, payload.csvTarget);
    broadcastIntegrationEvent({
      type: "spreadsheet.status",
      timestamp: new Date().toISOString(),
      message: "Spreadsheet watcher started.",
      data: status,
    });
    return reply.send(status);
  });

  app.post("/spreadsheet/sync-now", { preHandler: app.requireStaff }, async () => {
    return spreadsheetSyncManager.syncNow();
  });

  app.delete("/spreadsheet/watch", { preHandler: app.requireStaff }, async () => {
    const status = await spreadsheetSyncManager.stopWatching(true);
    broadcastIntegrationEvent({
      type: "spreadsheet.status",
      timestamp: new Date().toISOString(),
      message: "Spreadsheet watcher stopped.",
      data: status,
    });
    return status;
  });

  app.get("/stream", async (request, reply) => {
    try {
      await authenticateStream(request);
    } catch {
      return reply.code(401).send({ message: "Invalid or missing token" });
    }

    attachIntegrationStream(request, reply);
  });
};
