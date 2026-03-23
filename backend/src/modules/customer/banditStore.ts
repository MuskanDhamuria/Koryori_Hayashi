type BanditItemStats = {
  alpha: number;
  beta: number;
  lastUpdatedMs: number;
};

type BanditConfig = {
  explorationRate: number;
  maxUsers: number;
  maxItemsPerUser: number;
  ttlMs: number;
};

const DEFAULT_CONFIG: BanditConfig = {
  explorationRate: 0.2,
  maxUsers: 2500,
  maxItemsPerUser: 2000,
  ttlMs: 1000 * 60 * 60 * 24 * 90, // 90 days
};

let config: BanditConfig = { ...DEFAULT_CONFIG };

// In-memory store (prototype). Keyed by customer phone number.
const userStats = new Map<string, Map<string, BanditItemStats>>();

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number) {
  return clamp(value, 0, 1);
}

function normalizeKey(value: string) {
  return value.trim();
}

function pruneUserStats(nowMs: number) {
  const cutoff = nowMs - config.ttlMs;

  for (const [userKey, statsByItem] of userStats) {
    for (const [itemId, stats] of statsByItem) {
      if (!Number.isFinite(stats.lastUpdatedMs) || stats.lastUpdatedMs < cutoff) {
        statsByItem.delete(itemId);
      }
    }

    if (statsByItem.size === 0) {
      userStats.delete(userKey);
      continue;
    }

    if (statsByItem.size > config.maxItemsPerUser) {
      const ordered = [...statsByItem.entries()].sort((a, b) => a[1].lastUpdatedMs - b[1].lastUpdatedMs);
      const toRemove = ordered.length - config.maxItemsPerUser;
      for (let index = 0; index < toRemove; index += 1) {
        statsByItem.delete(ordered[index]![0]);
      }
    }
  }

  if (userStats.size <= config.maxUsers) {
    return;
  }

  const usersOrdered = [...userStats.entries()].sort((a, b) => {
    let newestA = 0;
    for (const stats of a[1].values()) {
      if (stats.lastUpdatedMs > newestA) newestA = stats.lastUpdatedMs;
    }

    let newestB = 0;
    for (const stats of b[1].values()) {
      if (stats.lastUpdatedMs > newestB) newestB = stats.lastUpdatedMs;
    }
    return newestA - newestB;
  });
  const toRemove = usersOrdered.length - config.maxUsers;
  for (let index = 0; index < toRemove; index += 1) {
    userStats.delete(usersOrdered[index]![0]);
  }
}

export function configureBandit(partial: Partial<BanditConfig>) {
  config = {
    ...config,
    ...partial,
  };
  config.explorationRate = clamp01(config.explorationRate);
  config.maxUsers = Math.max(1, Math.floor(config.maxUsers));
  config.maxItemsPerUser = Math.max(1, Math.floor(config.maxItemsPerUser));
  config.ttlMs = Math.max(0, Math.floor(config.ttlMs));
}

function getOrInitStats(userKeyRaw: string, itemIdRaw: string, nowMs: number) {
  const userKey = normalizeKey(userKeyRaw);
  const itemId = normalizeKey(itemIdRaw);
  if (!userKey || !itemId) {
    return { userKey: "", itemId: "", stats: { alpha: 1, beta: 1, lastUpdatedMs: nowMs } };
  }

  let byItem = userStats.get(userKey);
  if (!byItem) {
    byItem = new Map<string, BanditItemStats>();
    userStats.set(userKey, byItem);
  }

  const existing = byItem.get(itemId);
  if (existing) {
    return { userKey, itemId, stats: existing };
  }

  const stats: BanditItemStats = { alpha: 1, beta: 1, lastUpdatedMs: nowMs };
  byItem.set(itemId, stats);
  pruneUserStats(nowMs);
  return { userKey, itemId, stats };
}

export function shouldExplore() {
  return Math.random() < config.explorationRate;
}

function sampleStandardNormal(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function sampleGamma(shape: number): number {
  const k = Math.max(1e-6, shape);

  if (k < 1) {
    const u = Math.max(Number.EPSILON, Math.random());
    return sampleGamma(k + 1) * u ** (1 / k);
  }

  const d = k - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  for (;;) {
    const x = sampleStandardNormal();
    let v = 1 + c * x;
    if (v <= 0) continue;
    v = v * v * v;

    const u = Math.random();
    if (u < 1 - 0.0331 * (x ** 4)) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

function sampleBeta(alpha: number, beta: number): number {
  const a = Math.max(1e-6, alpha);
  const b = Math.max(1e-6, beta);

  const x = sampleGamma(a);
  const y = sampleGamma(b);
  const sum = x + y;
  if (!Number.isFinite(sum) || sum <= 0) return 0.5;
  return clamp01(x / sum);
}

export function getThompsonScore(userKey: string, itemId: string) {
  const nowMs = Date.now();
  const { stats } = getOrInitStats(userKey, itemId, nowMs);
  return sampleBeta(stats.alpha, stats.beta);
}

export function getUncertaintyScore(userKey: string, itemId: string) {
  const nowMs = Date.now();
  const { stats } = getOrInitStats(userKey, itemId, nowMs);
  const total = stats.alpha + stats.beta;
  if (!Number.isFinite(total) || total <= 0) return 0;
  return (stats.alpha * stats.beta) / (total ** 2 * (total + 1));
}

export function recordView(userKey: string, itemId: string) {
  const nowMs = Date.now();
  const { stats } = getOrInitStats(userKey, itemId, nowMs);
  stats.lastUpdatedMs = nowMs;
}

export function recordSuccess(userKey: string, itemId: string, count = 1) {
  const nowMs = Date.now();
  const { stats } = getOrInitStats(userKey, itemId, nowMs);
  const increment = Math.max(1, Math.floor(count));
  stats.alpha = Math.max(1e-6, stats.alpha + increment);
  stats.lastUpdatedMs = nowMs;
}

export function recordFailure(userKey: string, itemId: string, count = 1) {
  const nowMs = Date.now();
  const { stats } = getOrInitStats(userKey, itemId, nowMs);
  const increment = Math.max(1, Math.floor(count));
  stats.beta = Math.max(1e-6, stats.beta + increment);
  stats.lastUpdatedMs = nowMs;
}
