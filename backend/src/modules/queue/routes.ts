import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { queueManager, type QueueEntry, type Table } from "./store.js";

function serializeDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function serializeEntry(entry: QueueEntry) {
  return {
    id: entry.id,
    phoneNumber: entry.phoneNumber,
    groupSize: entry.groupSize,
    joinedAt: serializeDate(entry.joinedAt),
    estimatedWait: entry.estimatedWait,
    position: entry.position,
    status: entry.status,
    predictedDiningDuration: entry.predictedDiningDuration ?? null,
    assignedTable: entry.assignedTable ?? null,
    readyAt: serializeDate(entry.readyAt),
    seatedAt: serializeDate(entry.seatedAt),
    cancelledAt: serializeDate(entry.cancelledAt),
  };
}

function serializeTable(table: Table) {
  return {
    id: table.id,
    capacity: table.capacity,
    status: table.status,
    currentParty: table.currentParty
      ? {
          size: table.currentParty.size,
          seatedAt: serializeDate(table.currentParty.seatedAt),
          estimatedFinish: serializeDate(table.currentParty.estimatedFinish),
        }
      : null,
  };
}

export const queueRoutes: FastifyPluginAsync = async (app) => {
  app.post("/join", async (request, reply) => {
    const payload = z
      .object({
        phoneNumber: z.string().min(6),
        groupSize: z.number().int().min(1).max(20),
      })
      .parse(request.body);

    const entry = queueManager.addToQueue(payload.phoneNumber, payload.groupSize);
    return reply.code(201).send({ entry: serializeEntry(entry) });
  });

  app.get("/entry/:id", async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const entry = queueManager.getEntry(params.id);
    if (!entry) return reply.code(404).send({ message: "Queue entry not found" });
    return { entry: serializeEntry(entry) };
  });

  app.get("/state", { preHandler: app.requireStaff }, async () => {
    const state = queueManager.getState();
    return {
      queue: state.queue.map(serializeEntry),
      tables: state.tables.map(serializeTable),
    };
  });

  app.patch("/entry/:id/ready", { preHandler: app.requireStaff }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const entry = queueManager.markAsReady(params.id);
    if (!entry) return reply.code(404).send({ message: "Queue entry not found" });
    return { entry: serializeEntry(entry) };
  });

  app.patch("/entry/:id/seat", { preHandler: app.requireStaff }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const payload = z.object({ tableId: z.number().int().min(1) }).parse(request.body);

    const result = queueManager.seatParty(params.id, payload.tableId);
    if (!result.entry) return reply.code(404).send({ message: "Queue entry not found" });

    if (result.error) {
      const messageByError: Record<string, string> = {
        CANCELLED: "Queue entry already cancelled",
        TABLE_NOT_FOUND: "Table not found",
        TABLE_NOT_AVAILABLE: "Table is not available",
        TABLE_TOO_SMALL: "Table capacity is too small for this party",
      };
      return reply.code(400).send({ message: messageByError[result.error] ?? "Unable to seat party" });
    }

    return { entry: serializeEntry(result.entry), table: serializeTable(result.table) };
  });

  app.post("/tables/:tableId/clear", { preHandler: app.requireStaff }, async (request, reply) => {
    const params = z
      .object({
        tableId: z.coerce.number().int().min(1),
      })
      .parse(request.params);

    const table = queueManager.clearTable(params.tableId);
    if (!table) return reply.code(404).send({ message: "Table not found" });
    return { table: serializeTable(table) };
  });

  app.delete("/entry/:id", { preHandler: app.requireStaff }, async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).parse(request.params);
    const entry = queueManager.cancelEntry(params.id);
    if (!entry) return reply.code(404).send({ message: "Queue entry not found" });
    return { entry: serializeEntry(entry) };
  });
};
