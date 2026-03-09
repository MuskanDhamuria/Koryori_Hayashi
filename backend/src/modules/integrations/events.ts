import type { FastifyReply, FastifyRequest } from "fastify";

export interface IntegrationEvent {
  type: "spreadsheet.synced" | "spreadsheet.error" | "spreadsheet.status" | "system.notice";
  timestamp: string;
  message: string;
  data?: unknown;
}

const clients = new Set<FastifyReply>();
let heartbeat: NodeJS.Timeout | null = null;

function ensureHeartbeat() {
  if (heartbeat) {
    return;
  }

  heartbeat = setInterval(() => {
    for (const reply of clients) {
      reply.raw.write(`: ping ${Date.now()}\n\n`);
    }
  }, 25000);
}

function stopHeartbeatIfIdle() {
  if (clients.size === 0 && heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }
}

export function attachIntegrationStream(request: FastifyRequest, reply: FastifyReply) {
  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  reply.raw.write(
    `data: ${JSON.stringify({
      type: "system.notice",
      timestamp: new Date().toISOString(),
      message: "integration-stream-connected",
    } satisfies IntegrationEvent)}\n\n`,
  );

  clients.add(reply);
  ensureHeartbeat();

  request.raw.on("close", () => {
    clients.delete(reply);
    stopHeartbeatIfIdle();
  });
}

export function broadcastIntegrationEvent(event: IntegrationEvent) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const reply of clients) {
    reply.raw.write(payload);
  }
}

export function closeIntegrationStreams() {
  for (const reply of clients) {
    reply.raw.end();
  }
  clients.clear();
  stopHeartbeatIfIdle();
}
