import { clamp, mean } from './ai/math';
import { fitArima210, forecastArima210 } from './ai/arima';
import { OnlineRlsRegressor } from './ai/rls';
import { mmcWaitTime } from './ai/mmc';
import { greedyAssignment, optimalAssignment } from './ai/assignment';

// Global in-memory state for queue management (demo-only; no backend persistence)
export interface QueueEntry {
  id: string;
  phoneNumber: string;
  groupSize: number;
  joinedAt: Date;
  estimatedWait: number; // in minutes
  position: number;
  status: 'waiting' | 'ready' | 'seated' | 'cancelled';
  predictedDiningDuration?: number; // AI prediction
  assignedTable?: number;
}

export interface Table {
  id: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  currentParty?: {
    size: number;
    seatedAt: Date;
    estimatedFinish: Date;
  };
}

class QueueStore {
  private readonly maxEstimatedWaitMinutes = 30;
  private queue: QueueEntry[] = [];
  private tables: Table[] = [];
  private listeners: Set<() => void> = new Set();
  private historicalData: { timestamp: Date; queueLength: number; avgWait: number }[] = [];
  private readonly arrivalBucketMs = 5 * 60 * 1000;
  private arrivalsByBucketStartMs = new Map<number, number>();
  private diningDurationModel = new OnlineRlsRegressor(4, { forgetting: 0.995, initialVariance: 36 });
  private lastMetricsBucketStartMs: number | null = null;

  constructor() {
    // Prior (minutes): duration ≈ 35 + 8 * groupSize + mild time-of-day component
    this.diningDurationModel.setPriorWeights([35, 8, 5, -3]);

    // Initialize tables
    this.tables = [
      { id: 1, capacity: 2, status: 'available' },
      { id: 2, capacity: 2, status: 'available' },
      { id: 3, capacity: 4, status: 'occupied', currentParty: { size: 3, seatedAt: new Date(Date.now() - 25 * 60000), estimatedFinish: new Date(Date.now() + 20 * 60000) } },
      { id: 4, capacity: 4, status: 'available' },
      { id: 5, capacity: 6, status: 'occupied', currentParty: { size: 5, seatedAt: new Date(Date.now() - 40 * 60000), estimatedFinish: new Date(Date.now() + 5 * 60000) } },
      { id: 6, capacity: 6, status: 'available' },
      { id: 7, capacity: 8, status: 'available' },
      { id: 8, capacity: 2, status: 'occupied', currentParty: { size: 2, seatedAt: new Date(Date.now() - 15 * 60000), estimatedFinish: new Date(Date.now() + 30 * 60000) } },
    ];

    // Add some initial queue entries
    this.queue = [
      {
        id: '1',
        phoneNumber: '555-0101',
        groupSize: 2,
        joinedAt: new Date(Date.now() - 10 * 60000),
        estimatedWait: 0,
        position: 1,
        status: 'waiting',
        predictedDiningDuration: 0,
      },
      {
        id: '2',
        phoneNumber: '555-0102',
        groupSize: 4,
        joinedAt: new Date(Date.now() - 8 * 60000),
        estimatedWait: 0,
        position: 2,
        status: 'waiting',
        predictedDiningDuration: 0,
      },
      {
        id: '3',
        phoneNumber: '555-0103',
        groupSize: 6,
        joinedAt: new Date(Date.now() - 5 * 60000),
        estimatedWait: 0,
        position: 3,
        status: 'waiting',
        predictedDiningDuration: 0,
      },
    ];

    // Prime arrivals history from seeded queue.
    for (const entry of this.queue) this.recordArrival(entry.joinedAt);

    // Initialize metrics and AI estimates.
    this.generateInitialHistoricalData();
    this.refreshAllEstimates();

    // Simulate real-time updates
    this.startSimulation();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  getQueue() {
    return [...this.queue].sort((a, b) => a.position - b.position);
  }

  getTables() {
    return [...this.tables];
  }

  getEntry(id: string) {
    return this.queue.find(entry => entry.id === id);
  }

  addToQueue(phoneNumber: string, groupSize: number): QueueEntry {
    const position = this.queue.filter(e => e.status === 'waiting').length + 1;
    const joinedAt = new Date();
    const predictedDiningDuration = this.predictDiningDuration(groupSize, joinedAt);
    const estimatedWait = this.estimateRemainingWaitMinutes({ groupSize, position, joinedAt }, joinedAt);

    const entry: QueueEntry = {
      id: Date.now().toString(),
      phoneNumber,
      groupSize,
      joinedAt,
      estimatedWait,
      position,
      status: 'waiting',
      predictedDiningDuration,
    };

    this.queue.push(entry);
    this.recordArrival(joinedAt);
    this.captureMetrics(joinedAt);
    this.notify();
    return entry;
  }

  private diningFeatures(groupSize: number, at: Date) {
    const hour = at.getHours() + at.getMinutes() / 60;
    const angle = (2 * Math.PI * hour) / 24;
    return [1, groupSize, Math.sin(angle), Math.cos(angle)];
  }

  // Regression: online RLS model updated from observed dining durations (table clear events).
  private predictDiningDuration(groupSize: number, at: Date) {
    const prediction = this.diningDurationModel.predict(this.diningFeatures(groupSize, at));
    return Math.round(clamp(prediction.mean, 20, 180));
  }

  private bucketStartMs(at: Date) {
    const ms = at.getTime();
    return Math.floor(ms / this.arrivalBucketMs) * this.arrivalBucketMs;
  }

  private recordArrival(at: Date) {
    const bucket = this.bucketStartMs(at);
    this.arrivalsByBucketStartMs.set(bucket, (this.arrivalsByBucketStartMs.get(bucket) ?? 0) + 1);
  }

  private baselineArrivalRatePerMin(now: Date) {
    const hour = now.getHours() + now.getMinutes() / 60;
    const lunchPeak = hour >= 12 && hour <= 14;
    const dinnerPeak = hour >= 18 && hour <= 20.5;
    if (lunchPeak || dinnerPeak) return 0.08; // parties/min (~1 every 12.5 min)
    if (hour >= 11 && hour <= 22) return 0.04; // open hours baseline
    return 0.01;
  }

  // ARIMA(2,1,0) on arrival counts per 5-minute bucket. Returns parties/min.
  private forecastArrivalRatePerMin(now: Date) {
    const nowBucket = this.bucketStartMs(now);
    const bucketCount = 48; // 4 hours of 5-min buckets
    const series: number[] = [];
    for (let i = bucketCount - 1; i >= 0; i--) {
      const bucket = nowBucket - i * this.arrivalBucketMs;
      series.push(this.arrivalsByBucketStartMs.get(bucket) ?? 0);
    }

    const recentMean = mean(series.slice(-12));
    const hasSignal = series.some(v => v > 0);
    if (!hasSignal) return this.baselineArrivalRatePerMin(now);

    const model = fitArima210(series);
    const intervalMin = this.arrivalBucketMs / 60000;
    if (!model) return clamp(recentMean / intervalMin, 0.001, 0.5);

    const forecastBuckets = forecastArima210(model, 6).map(v => clamp(v, 0, 50));
    const forecastMean = mean(forecastBuckets);
    const forecastRate = clamp(forecastMean / intervalMin, 0.001, 0.5);

    // Blend with baseline to keep forecasts reasonable with limited data.
    const baseline = this.baselineArrivalRatePerMin(now);
    return clamp(0.7 * forecastRate + 0.3 * baseline, 0.001, 0.5);
  }

  // Queue Theory: M/M/c using Erlang C for Wq, with lambda from ARIMA and mu from regression.
  // Returns remaining wait minutes for an existing entry (total estimate minus time already waited).
  private estimateRemainingWaitMinutes(
    input: { groupSize: number; position: number; joinedAt: Date },
    now: Date,
  ) {
    const eligibleTables = this.tables.filter(t => t.capacity >= input.groupSize);
    const servers = eligibleTables.length;
    if (servers <= 0) return 999;

    const lambda = this.forecastArrivalRatePerMin(now);
    const predictedServiceMinutes = clamp(
      this.diningDurationModel.predict(this.diningFeatures(input.groupSize, now)).mean,
      20,
      180,
    );
    const mu = 1 / predictedServiceMinutes; // parties/min/table

    // Apply an "operational constraint" to keep the model stable and the UX bounded:
    // assume the effective arrival rate is throttled when it would exceed capacity.
    const effectiveLambda = Math.min(lambda, servers * mu * 0.9);

    const metrics = mmcWaitTime(effectiveLambda, mu, servers);
    const positionDelay = (input.position - 1) / Math.max(1e-6, servers * mu);
    const totalWait = clamp(metrics.wqMinutes + positionDelay, 0, this.maxEstimatedWaitMinutes);
    const waitedAlready = Math.max(0, (now.getTime() - input.joinedAt.getTime()) / 60000);

    return Math.round(clamp(totalWait - waitedAlready, 0, this.maxEstimatedWaitMinutes));
  }

  // AI: Constraint Optimization for table allocation
  getOptimalTableAssignment(groupSize: number, queueId?: string): {
    table: Table | null;
    score: number;
    reasoning: string;
  } {
    const availableTables = this.tables.filter(t => t.status === 'available');

    if (availableTables.length === 0) {
      return { table: null, score: 0, reasoning: 'No tables available' };
    }

    const now = new Date();
    const activeParties = this.queue
      .filter(e => e.status === 'ready' || e.status === 'waiting')
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'ready' ? -1 : 1;
        return a.position - b.position;
      });

    // Keep the optimization problem small and real-time.
    const maxParties = 12;
    const selected = queueId ? activeParties.find(p => p.id === queueId) : null;
    const parties = selected
      ? [selected, ...activeParties.filter(p => p.id !== queueId)].slice(0, maxParties)
      : activeParties.slice(0, maxParties);

    // Add a "hypothetical party" when no queue context is provided.
    const partiesForOptimization = parties.length > 0
      ? parties
      : [{ id: '__hypothetical__', groupSize, position: 1, status: 'waiting', joinedAt: now } as unknown as QueueEntry];

    // Assignment ILP equivalent:
    // Maximize Σ x_{p,t} * score(p,t) subject to each party/table used ≤ 1.
    const scoreFor = (partyIndex: number, tableIndex: number) => {
      const party = partiesForOptimization[partyIndex];
      const table = availableTables[tableIndex];
      if (table.capacity < party.groupSize) return null;
      const waste = table.capacity - party.groupSize;
      const utilization = party.groupSize / table.capacity;
      const perfectFitBonus = waste === 0 ? 25 : waste === 1 ? 10 : 0;
      const assignedBonus = 60 - Math.min(50, party.position); // favors earlier parties in the queue
      return assignedBonus + utilization * 100 - waste * 15 + perfectFitBonus;
    };

    const optimal = optimalAssignment(
      partiesForOptimization.map(p => ({ id: p.id })),
      availableTables.map(t => ({ id: t.id })),
      scoreFor,
    );
    const greedy = greedyAssignment(
      partiesForOptimization.map(p => ({ id: p.id })),
      availableTables.map(t => ({ id: t.id })),
      scoreFor,
    );

    const targetId = queueId ?? partiesForOptimization[0].id;
    const assignedTableId = optimal.assignment.get(targetId as never) ?? greedy.assignment.get(targetId as never);
    if (!assignedTableId) {
      return { table: null, score: 0, reasoning: 'No feasible table for this party' };
    }

    const table = this.tables.find(t => t.id === assignedTableId) ?? null;
    if (!table) return { table: null, score: 0, reasoning: 'No feasible table for this party' };

    const waste = table.capacity - groupSize;
    const utilizationPct = Math.round((groupSize / table.capacity) * 100);
    const reasoning = `Optimal assignment (exact) — ${utilizationPct}% utilization, ${waste} wasted seat${waste === 1 ? '' : 's'}`;

    return { table, score: optimal.totalScore, reasoning };
  }

  seatParty(queueId: string, tableId: number) {
    const entry = this.queue.find(e => e.id === queueId);
    const table = this.tables.find(t => t.id === tableId);

    if (entry && table) {
      entry.status = 'seated';
      entry.assignedTable = tableId;
      table.status = 'occupied';
      const now = new Date();
      const predictedDuration = this.predictDiningDuration(entry.groupSize, now);
      entry.predictedDiningDuration = predictedDuration;
      table.currentParty = {
        size: entry.groupSize,
        seatedAt: now,
        estimatedFinish: new Date(now.getTime() + predictedDuration * 60000),
      };

      // Update positions
      this.updatePositions();
      this.captureMetrics(now);
      this.notify();
    }
  }

  markAsReady(queueId: string) {
    const entry = this.queue.find(e => e.id === queueId);
    if (entry) {
      entry.status = 'ready';
      this.captureMetrics(new Date());
      this.notify();
    }
  }

  removeFromQueue(queueId: string) {
    const index = this.queue.findIndex(e => e.id === queueId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.updatePositions();
      this.captureMetrics(new Date());
      this.notify();
    }
  }

  clearTable(tableId: number, opts?: { silent?: boolean }) {
    const table = this.tables.find(t => t.id === tableId);
    if (table) {
      const now = new Date();
      if (table.currentParty) {
        const durationMin = Math.max(5, (now.getTime() - table.currentParty.seatedAt.getTime()) / 60000);
        this.diningDurationModel.update(
          this.diningFeatures(table.currentParty.size, table.currentParty.seatedAt),
          durationMin,
        );
      }
      table.status = 'available';
      table.currentParty = undefined;
      this.captureMetrics(now);
      if (!opts?.silent) this.notify();
    }
  }

  private updatePositions() {
    const waiting = this.queue.filter(e => e.status === 'waiting');
    waiting.forEach((entry, index) => {
      entry.position = index + 1;
      entry.estimatedWait = this.estimateRemainingWaitMinutes(entry, new Date());
    });
  }

  private generateInitialHistoricalData() {
    // Start with empty metrics (filled in over time as real events occur).
    this.historicalData = [];
    for (let i = 12; i > 0; i--) {
      const timestamp = new Date(Date.now() - i * 60 * 60000);
      this.historicalData.push({ timestamp, queueLength: 0, avgWait: 0 });
    }
  }

  getHistoricalData() {
    return this.historicalData;
  }

  private refreshAllEstimates() {
    const now = new Date();
    for (const entry of this.queue) {
      if (entry.status !== 'waiting') continue;
      entry.estimatedWait = this.estimateRemainingWaitMinutes(entry, now);
      entry.predictedDiningDuration = this.predictDiningDuration(entry.groupSize, now);
    }
    this.captureMetrics(now);
  }

  private captureMetrics(now: Date) {
    const bucket = this.bucketStartMs(now);
    if (this.lastMetricsBucketStartMs === bucket) return;
    this.lastMetricsBucketStartMs = bucket;

    const waiting = this.queue.filter(e => e.status === 'waiting');
    const avgWait = waiting.length === 0 ? 0 : mean(waiting.map(e => e.estimatedWait));

    this.historicalData.push({
      timestamp: new Date(bucket),
      queueLength: waiting.length,
      avgWait: Math.round(avgWait),
    });

    // Keep ~48 hours of 5-min buckets.
    const maxPoints = (48 * 60) / 5;
    if (this.historicalData.length > maxPoints) {
      this.historicalData.splice(0, this.historicalData.length - maxPoints);
    }
  }

  private startSimulation() {
    // Refresh estimates and clear tables every 30 seconds.
    setInterval(() => {
      const now = new Date();

      for (const entry of this.queue) {
        if (entry.status === 'waiting') {
          entry.estimatedWait = this.estimateRemainingWaitMinutes(entry, now);
        }
      }

      for (const table of this.tables) {
        if (table.currentParty && table.currentParty.estimatedFinish <= now) {
          this.clearTable(table.id, { silent: true });
        }
      }

      this.captureMetrics(now);
      this.notify();
    }, 30000);
  }
}

export const queueStore = new QueueStore();
