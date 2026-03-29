import { randomUUID } from "crypto";

export type QueueEntryStatus = "waiting" | "ready" | "seated" | "cancelled";
export type TableStatus = "available" | "occupied" | "reserved";

export interface QueueEntry {
  id: string;
  phoneNumber: string;
  groupSize: number;
  joinedAt: Date;
  estimatedWait: number; // minutes
  position: number;
  status: QueueEntryStatus;
  predictedDiningDuration?: number; // minutes
  assignedTable?: number;
  readyAt?: Date | null;
  seatedAt?: Date | null;
  cancelledAt?: Date | null;
}

export interface Table {
  id: number;
  capacity: number;
  status: TableStatus;
  currentParty?: {
    size: number;
    seatedAt: Date;
    estimatedFinish: Date;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function predictDiningDurationMinutes(groupSize: number) {
  // Simple baseline model (kept deterministic for demo + avoids DB/ML deps).
  // Roughly matches the prior used in the frontend demo store.
  const raw = 35 + 8 * groupSize;
  return Math.round(clamp(raw, 25, 120));
}

export class QueueManager {
  private readonly maxEstimatedWaitMinutes = 30;
  private readonly averageDiningMinutes = 45;
  private queue: QueueEntry[] = [];
  private tables: Table[] = [];

  constructor() {
    // Seed demo tables (matches the original frontend-only store).
    this.tables = [
      { id: 1, capacity: 2, status: "available" },
      { id: 2, capacity: 2, status: "available" },
      {
        id: 3,
        capacity: 4,
        status: "occupied",
        currentParty: {
          size: 3,
          seatedAt: new Date(Date.now() - 25 * 60_000),
          estimatedFinish: new Date(Date.now() + 20 * 60_000),
        },
      },
      { id: 4, capacity: 4, status: "available" },
      {
        id: 5,
        capacity: 6,
        status: "occupied",
        currentParty: {
          size: 5,
          seatedAt: new Date(Date.now() - 40 * 60_000),
          estimatedFinish: new Date(Date.now() + 5 * 60_000),
        },
      },
      { id: 6, capacity: 6, status: "available" },
      { id: 7, capacity: 8, status: "available" },
      {
        id: 8,
        capacity: 2,
        status: "occupied",
        currentParty: {
          size: 2,
          seatedAt: new Date(Date.now() - 15 * 60_000),
          estimatedFinish: new Date(Date.now() + 30 * 60_000),
        },
      },
    ];

    // Seed demo queue entries.
    this.queue = [
      {
        id: "1",
        phoneNumber: "555-0101",
        groupSize: 2,
        joinedAt: new Date(Date.now() - 10 * 60_000),
        estimatedWait: 0,
        position: 1,
        status: "waiting",
        predictedDiningDuration: predictDiningDurationMinutes(2),
      },
      {
        id: "2",
        phoneNumber: "555-0102",
        groupSize: 4,
        joinedAt: new Date(Date.now() - 8 * 60_000),
        estimatedWait: 0,
        position: 2,
        status: "waiting",
        predictedDiningDuration: predictDiningDurationMinutes(4),
      },
      {
        id: "3",
        phoneNumber: "555-0103",
        groupSize: 6,
        joinedAt: new Date(Date.now() - 5 * 60_000),
        estimatedWait: 0,
        position: 3,
        status: "waiting",
        predictedDiningDuration: predictDiningDurationMinutes(6),
      },
    ];

    this.refreshDerivedFields();
  }

  private refreshExpiredTables(now = new Date()) {
    for (const table of this.tables) {
      if (table.status !== "occupied" || !table.currentParty) continue;
      if (table.currentParty.estimatedFinish.getTime() <= now.getTime()) {
        table.status = "available";
        table.currentParty = undefined;
      }
    }
  }

  private refreshDerivedFields(now = new Date()) {
    this.refreshExpiredTables(now);

    const waiting = this.queue
      .filter((entry) => entry.status === "waiting")
      .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());

    const totalTables = Math.max(1, this.tables.length);
    const minutesPerParty = this.averageDiningMinutes / totalTables;

    for (let index = 0; index < waiting.length; index += 1) {
      const entry = waiting[index];
      const position = index + 1;
      entry.position = position;
      entry.estimatedWait = Math.round(
        clamp((position - 1) * minutesPerParty, 0, this.maxEstimatedWaitMinutes),
      );
    }

    for (const entry of this.queue) {
      if (entry.status !== "waiting") {
        entry.position = entry.position || 0;
        entry.estimatedWait = 0;
      }
    }
  }

  getState(now = new Date()) {
    this.refreshDerivedFields(now);
    const queue = [...this.queue].sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime());
    const tables = [...this.tables].sort((a, b) => a.id - b.id);
    return { queue, tables };
  }

  getEntry(id: string, now = new Date()) {
    this.refreshDerivedFields(now);
    return this.queue.find((entry) => entry.id === id) ?? null;
  }

  addToQueue(phoneNumber: string, groupSize: number, now = new Date()) {
    const entry: QueueEntry = {
      id: randomUUID(),
      phoneNumber,
      groupSize,
      joinedAt: now,
      estimatedWait: 0,
      position: 0,
      status: "waiting",
      predictedDiningDuration: predictDiningDurationMinutes(groupSize),
    };

    this.queue.push(entry);
    this.refreshDerivedFields(now);
    return entry;
  }

  markAsReady(id: string, now = new Date()) {
    const entry = this.queue.find((candidate) => candidate.id === id);
    if (!entry) return null;
    if (entry.status === "cancelled" || entry.status === "seated") return entry;
    entry.status = "ready";
    entry.readyAt = now;
    entry.estimatedWait = 0;
    entry.position = 0;
    this.refreshDerivedFields(now);
    return entry;
  }

  seatParty(id: string, tableId: number, now = new Date()) {
    const entry = this.queue.find((candidate) => candidate.id === id);
    if (!entry)
      return {
        entry: null,
        table: null,
        error: "NOT_FOUND" as const,
      };

    if (entry.status === "cancelled") return { entry, table: null, error: "CANCELLED" as const };

    const table = this.tables.find((candidate) => candidate.id === tableId) ?? null;
    if (!table) return { entry, table: null, error: "TABLE_NOT_FOUND" as const };
    if (table.status !== "available") return { entry, table, error: "TABLE_NOT_AVAILABLE" as const };
    if (table.capacity < entry.groupSize) return { entry, table, error: "TABLE_TOO_SMALL" as const };

    const durationMinutes = entry.predictedDiningDuration ?? predictDiningDurationMinutes(entry.groupSize);
    const estimatedFinish = new Date(now.getTime() + durationMinutes * 60_000);

    table.status = "occupied";
    table.currentParty = { size: entry.groupSize, seatedAt: now, estimatedFinish };

    entry.status = "seated";
    entry.assignedTable = tableId;
    entry.seatedAt = now;
    entry.estimatedWait = 0;
    entry.position = 0;

    this.refreshDerivedFields(now);
    return { entry, table, error: null };
  }

  clearTable(tableId: number, now = new Date()) {
    const table = this.tables.find((candidate) => candidate.id === tableId);
    if (!table) return null;
    table.status = "available";
    table.currentParty = undefined;
    this.refreshDerivedFields(now);
    return table;
  }

  cancelEntry(id: string, now = new Date()) {
    const entry = this.queue.find((candidate) => candidate.id === id);
    if (!entry) return null;
    entry.status = "cancelled";
    entry.cancelledAt = now;
    entry.estimatedWait = 0;
    entry.position = 0;
    this.refreshDerivedFields(now);
    return entry;
  }
}

export const queueManager = new QueueManager();
