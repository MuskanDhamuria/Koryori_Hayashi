export interface QueueEntry {
  id: string;
  phoneNumber: string;
  groupSize: number;
  joinedAt: Date;
  estimatedWait: number; // in minutes
  position: number;
  status: "waiting" | "ready" | "seated" | "cancelled";
  predictedDiningDuration?: number; // minutes
  assignedTable?: number;
}

export interface Table {
  id: number;
  capacity: number;
  status: "available" | "occupied" | "reserved";
  currentParty?: {
    size: number;
    seatedAt: Date;
    estimatedFinish: Date;
  };
}

type StaffLoginResponse = {
  token: string;
  user: { id: string; email: string | null; fullName: string; role: string };
};

type QueueEntryDto = {
  id: string;
  phoneNumber: string;
  groupSize: number;
  joinedAt: string | null;
  estimatedWait: number;
  position: number;
  status: QueueEntry["status"];
  predictedDiningDuration: number | null;
  assignedTable: number | null;
};

type TableDto = {
  id: number;
  capacity: number;
  status: Table["status"];
  currentParty: null | {
    size: number;
    seatedAt: string | null;
    estimatedFinish: string | null;
  };
};

function getApiBaseUrl() {
  const apiUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;
  return apiUrl?.trim() ? apiUrl.trim().replace(/\/+$/, "") : "http://localhost:4000";
}

const staffTokenKey = "koryori.staffToken";

function readStaffToken(): string | null {
  try {
    const token = localStorage.getItem(staffTokenKey);
    return token?.trim() ? token : null;
  } catch {
    return null;
  }
}

function writeStaffToken(token: string | null) {
  try {
    if (!token) localStorage.removeItem(staffTokenKey);
    else localStorage.setItem(staffTokenKey, token);
  } catch {
    // ignore (e.g. private mode)
  }
}

function parseEntry(dto: QueueEntryDto): QueueEntry {
  return {
    id: dto.id,
    phoneNumber: dto.phoneNumber,
    groupSize: dto.groupSize,
    joinedAt: dto.joinedAt ? new Date(dto.joinedAt) : new Date(),
    estimatedWait: dto.estimatedWait ?? 0,
    position: dto.position ?? 0,
    status: dto.status,
    predictedDiningDuration: dto.predictedDiningDuration ?? undefined,
    assignedTable: dto.assignedTable ?? undefined,
  };
}

function parseTable(dto: TableDto): Table {
  return {
    id: dto.id,
    capacity: dto.capacity,
    status: dto.status,
    currentParty: dto.currentParty
      ? {
          size: dto.currentParty.size,
          seatedAt: dto.currentParty.seatedAt ? new Date(dto.currentParty.seatedAt) : new Date(),
          estimatedFinish: dto.currentParty.estimatedFinish
            ? new Date(dto.currentParty.estimatedFinish)
            : new Date(),
        }
      : undefined,
  };
}

async function parseErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { message?: string };
    return data?.message ?? "";
  } catch {
    return "";
  }
}

class QueueStore {
  private listeners: Set<() => void> = new Set();
  private queue: QueueEntry[] = [];
  private tables: Table[] = [];
  private entriesById: Map<string, QueueEntry> = new Map();
  private pollTimer: number | null = null;
  private watchedEntryIds: Map<string, number> = new Map();
  private staffToken: string | null = readStaffToken();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    this.ensurePolling();
    return () => {
      this.listeners.delete(listener);
      this.teardownPollingIfIdle();
    };
  }

  private notify() {
    for (const listener of this.listeners) listener();
  }

  getQueue() {
    return [...this.queue].sort((a, b) => a.position - b.position);
  }

  getTables() {
    return [...this.tables];
  }

  getEntry(id: string) {
    return this.entriesById.get(id) ?? this.queue.find((entry) => entry.id === id);
  }

  getStaffToken() {
    return this.staffToken;
  }

  setStaffToken(token: string | null) {
    this.staffToken = token?.trim() ? token.trim() : null;
    writeStaffToken(this.staffToken);
    this.ensurePolling();
    if (this.staffToken) {
      void this.refreshStaffState().catch(() => {
        // ignore (UI will prompt for re-login)
      });
    } else {
      this.queue = [];
      this.tables = [];
      this.notify();
    }
  }

  async staffLogin(email: string, password: string) {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/auth/staff-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const detail = await parseErrorMessage(response);
      throw new Error(detail || `Login failed (${response.status})`);
    }

    const data = (await response.json()) as StaffLoginResponse;
    this.setStaffToken(data.token);
    await this.refreshStaffState();
    return data;
  }

  async addToQueue(phoneNumber: string, groupSize: number) {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/queue/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, groupSize }),
    });

    if (!response.ok) {
      const detail = await parseErrorMessage(response);
      throw new Error(detail || `Unable to join queue (${response.status})`);
    }

    const data = (await response.json()) as { entry: QueueEntryDto };
    const entry = parseEntry(data.entry);
    this.entriesById.set(entry.id, entry);
    this.notify();
    return entry;
  }

  watchEntry(id: string) {
    const existing = this.watchedEntryIds.get(id) ?? 0;
    this.watchedEntryIds.set(id, existing + 1);
    void this.refreshEntry(id);
    this.ensurePolling();

    return () => {
      const current = this.watchedEntryIds.get(id) ?? 0;
      if (current <= 1) this.watchedEntryIds.delete(id);
      else this.watchedEntryIds.set(id, current - 1);
      this.teardownPollingIfIdle();
    };
  }

  async refreshEntry(id: string) {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/queue/entry/${encodeURIComponent(id)}`);
    if (!response.ok) return null;
    const data = (await response.json()) as { entry: QueueEntryDto };
    const entry = parseEntry(data.entry);
    this.entriesById.set(entry.id, entry);
    this.notify();
    return entry;
  }

  private async refreshStaffState() {
    if (!this.staffToken) return null;
    const baseUrl = getApiBaseUrl();

    const response = await fetch(`${baseUrl}/api/queue/state`, {
      headers: { Authorization: `Bearer ${this.staffToken}` },
    });

    if (!response.ok) {
      const detail = await parseErrorMessage(response);
      throw new Error(detail || `Unable to load queue state (${response.status})`);
    }

    const data = (await response.json()) as { queue: QueueEntryDto[]; tables: TableDto[] };
    this.queue = data.queue.map(parseEntry);
    this.tables = data.tables.map(parseTable);
    for (const entry of this.queue) this.entriesById.set(entry.id, entry);
    this.notify();
    return data;
  }

  async markAsReady(queueId: string) {
    if (!this.staffToken) throw new Error("Staff login required");
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/queue/entry/${encodeURIComponent(queueId)}/ready`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${this.staffToken}` },
    });

    if (!response.ok) {
      const detail = await parseErrorMessage(response);
      throw new Error(detail || `Unable to mark ready (${response.status})`);
    }

    await this.refreshStaffState();
  }

  async seatParty(queueId: string, tableId: number) {
    if (!this.staffToken) throw new Error("Staff login required");
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/queue/entry/${encodeURIComponent(queueId)}/seat`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${this.staffToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tableId }),
    });

    if (!response.ok) {
      const detail = await parseErrorMessage(response);
      throw new Error(detail || `Unable to seat party (${response.status})`);
    }

    await this.refreshStaffState();
  }

  async clearTable(tableId: number) {
    if (!this.staffToken) throw new Error("Staff login required");
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/queue/tables/${tableId}/clear`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.staffToken}` },
    });

    if (!response.ok) {
      const detail = await parseErrorMessage(response);
      throw new Error(detail || `Unable to clear table (${response.status})`);
    }

    await this.refreshStaffState();
  }

  async removeFromQueue(queueId: string) {
    if (!this.staffToken) throw new Error("Staff login required");
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/queue/entry/${encodeURIComponent(queueId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${this.staffToken}` },
    });

    if (!response.ok) {
      const detail = await parseErrorMessage(response);
      throw new Error(detail || `Unable to remove from queue (${response.status})`);
    }

    await this.refreshStaffState();
  }

  getOptimalTableAssignment(groupSize: number, _queueId?: string) {
    const available = this.tables
      .filter((table) => table.status === "available" && table.capacity >= groupSize)
      .sort((a, b) => a.capacity - b.capacity || a.id - b.id);

    const selected = available[0] ?? null;

    if (!selected) {
      return {
        table: null as Table | null,
        score: 0,
        reasoning: "No available tables can fit this party right now.",
      };
    }

    const wastedSeats = selected.capacity - groupSize;
    const score = Math.max(0, 100 - wastedSeats * 12);
    const reasoning =
      wastedSeats === 0
        ? "Perfect fit: minimal wasted seats."
        : `Best fit among available tables: wastes ${wastedSeats} seat${wastedSeats === 1 ? "" : "s"}.`;

    return { table: selected, score, reasoning };
  }

  private ensurePolling() {
    if (this.pollTimer != null) return;
    if (this.listeners.size === 0) return;

    const intervalMs = 2000;
    this.pollTimer = window.setInterval(() => {
      if (this.staffToken) {
        void this.refreshStaffState().catch(() => {
          // Avoid toast loops; UI will surface auth errors on actions.
        });
        return;
      }

      for (const id of this.watchedEntryIds.keys()) {
        void this.refreshEntry(id);
      }
    }, intervalMs);

    // Prime the state immediately when we start polling.
    if (this.staffToken) void this.refreshStaffState();
    else for (const id of this.watchedEntryIds.keys()) void this.refreshEntry(id);
  }

  private teardownPollingIfIdle() {
    if (this.listeners.size > 0) return;
    if (this.pollTimer == null) return;
    window.clearInterval(this.pollTimer);
    this.pollTimer = null;
  }
}

export const queueStore = new QueueStore();
