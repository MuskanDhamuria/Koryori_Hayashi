import type { Request, Response } from 'express';
import type { StreamMessage } from '../src/types.js';

const clients = new Set<Response>();
let heartbeat: NodeJS.Timeout | null = null;

function startHeartbeat() {
  if (heartbeat) {
    return;
  }

  heartbeat = setInterval(() => {
    for (const client of clients) {
      client.write(`: ping ${Date.now()}\n\n`);
    }
  }, 25000);
}

function maybeStopHeartbeat() {
  if (clients.size === 0 && heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }
}

export function attachStream(request: Request, response: Response) {
  response.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  response.write(`data: ${JSON.stringify({ type: 'system.notice', timestamp: new Date().toISOString(), message: 'stream-connected' })}\n\n`);
  clients.add(response);
  startHeartbeat();

  request.on('close', () => {
    clients.delete(response);
    maybeStopHeartbeat();
  });
}

export function broadcast(message: StreamMessage) {
  const payload = `data: ${JSON.stringify(message)}\n\n`;
  for (const client of clients) {
    client.write(payload);
  }
}
