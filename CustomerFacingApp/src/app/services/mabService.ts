import { MABItemStats } from '../types';

/**
 * Multi-Armed Bandit Service using Thompson Sampling
 * This implements the explore-exploit tradeoff for menu recommendations
 */

type PersistedMABItemStatsV1 = {
  itemId: string;
  alpha: number;
  beta: number;
  lastUpdated: string; // ISO
};

type MABConfig = {
  explorationRate: number;
  storageKey: string;
  maxItems: number;
  ttlMs: number;
};

const DEFAULT_CONFIG: MABConfig = {
  explorationRate: 0.2,
  storageKey: 'koryori:mabStats:v1',
  maxItems: 2000,
  ttlMs: 1000 * 60 * 60 * 24 * 90, // 90 days
};

let config: MABConfig = { ...DEFAULT_CONFIG };

// In-memory cache. Persisted to localStorage when available.
const mabStats = new Map<string, MABItemStats>();

let persistQueued = false;
let hydrated = false;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function normalizeItemId(itemId: string): string {
  return itemId.trim();
}

function hasStorage(): boolean {
  // Guard for non-browser environments.
  return typeof window !== 'undefined' && !!window.localStorage;
}

function pruneInPlace(nowMs: number): void {
  if (mabStats.size === 0) return;

  const cutoff = nowMs - config.ttlMs;
  for (const [itemId, stats] of mabStats) {
    const updatedMs = stats.lastUpdated instanceof Date ? stats.lastUpdated.getTime() : 0;
    if (!Number.isFinite(updatedMs) || updatedMs < cutoff) {
      mabStats.delete(itemId);
    }
  }

  if (mabStats.size <= config.maxItems) return;

  // Evict least-recently-updated until under cap.
  const ordered = [...mabStats.entries()].sort(
    (a, b) => a[1].lastUpdated.getTime() - b[1].lastUpdated.getTime(),
  );
  const toRemove = ordered.length - config.maxItems;
  for (let i = 0; i < toRemove; i += 1) {
    mabStats.delete(ordered[i]![0]);
  }
}

function hydrateFromStorage(): void {
  if (hydrated) return;
  hydrated = true;

  if (!hasStorage()) return;

  try {
    const raw = window.localStorage.getItem(config.storageKey);
    if (!raw) return;

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return;

    const nowMs = Date.now();
    for (const entry of parsed) {
      if (!entry || typeof entry !== 'object') continue;

      const candidate = entry as Partial<PersistedMABItemStatsV1>;
      if (typeof candidate.itemId !== 'string') continue;
      if (!isFiniteNumber(candidate.alpha) || !isFiniteNumber(candidate.beta)) continue;
      if (typeof candidate.lastUpdated !== 'string') continue;

      const lastUpdated = new Date(candidate.lastUpdated);
      if (Number.isNaN(lastUpdated.getTime())) continue;

      const itemId = normalizeItemId(candidate.itemId);
      if (!itemId) continue;

      const alpha = Math.max(1e-6, candidate.alpha);
      const beta = Math.max(1e-6, candidate.beta);

      mabStats.set(itemId, { itemId, alpha, beta, lastUpdated });
    }

    pruneInPlace(nowMs);
  } catch {
    // Ignore corrupted storage.
  }
}

function persistToStorage(): void {
  if (!hasStorage()) return;

  pruneInPlace(Date.now());

  const payload: PersistedMABItemStatsV1[] = [];
  for (const stats of mabStats.values()) {
    payload.push({
      itemId: stats.itemId,
      alpha: stats.alpha,
      beta: stats.beta,
      lastUpdated: stats.lastUpdated.toISOString(),
    });
  }

  try {
    window.localStorage.setItem(config.storageKey, JSON.stringify(payload));
  } catch {
    // Quota exceeded or storage blocked; keep in-memory only.
  }
}

function queuePersist(): void {
  if (persistQueued) return;
  persistQueued = true;

  // Microtask-batched persistence to avoid repeated synchronous writes.
  Promise.resolve().then(() => {
    persistQueued = false;
    persistToStorage();
  });
}

export function configureMAB(partial: Partial<MABConfig>): void {
  config = {
    ...config,
    ...partial,
  };

  config.explorationRate = clamp01(config.explorationRate);
  config.maxItems = Math.max(1, Math.floor(config.maxItems));
  config.ttlMs = Math.max(0, Math.floor(config.ttlMs));
  config.storageKey = config.storageKey.trim() || DEFAULT_CONFIG.storageKey;

  // Re-hydrate using the new storage key if configured early.
  hydrated = false;
  hydrateFromStorage();
}

/**
 * Initialize or get MAB stats for an item
 */
export function getOrInitializeStats(itemId: string, isNew: boolean = false): MABItemStats {
  hydrateFromStorage();

  const normalizedItemId = normalizeItemId(itemId);
  if (!normalizedItemId) {
    // Defensive: avoid throwing in UI code paths if data is malformed.
    void isNew;
    return { itemId: '', alpha: 1, beta: 1, lastUpdated: new Date() };
  }

  const existing = mabStats.get(normalizedItemId);
  if (existing) return existing;

  // Prior: Beta(1,1) (uniform). For "new" items we keep the same prior but downstream
  // code already adds explicit new-item exploration boosts.
  void isNew;

  const stats: MABItemStats = {
    itemId: normalizedItemId,
    alpha: 1,
    beta: 1,
    lastUpdated: new Date(),
  };

  mabStats.set(normalizedItemId, stats);
  pruneInPlace(Date.now());
  queuePersist();

  return stats;
}

/**
 * Sample from Beta distribution using Thompson Sampling
 * Production-grade Beta sampling via Gamma sampling (Marsaglia & Tsang).
 */
function sampleStandardNormal(): number {
  // Box-Muller transform.
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function sampleGamma(shape: number): number {
  // shape must be > 0
  const k = Math.max(1e-6, shape);

  if (k < 1) {
    // Use Johnk's method: Gamma(k) = Gamma(k+1) * U^(1/k)
    const u = Math.max(Number.EPSILON, Math.random());
    return sampleGamma(k + 1) * u ** (1 / k);
  }

  // Marsaglia & Tsang for k >= 1
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

/**
 * Get Thompson Sampling score for an item
 * Higher score = higher probability of being recommended
 */
export function getThompsonScore(itemId: string, isNew: boolean = false): number {
  if (!normalizeItemId(itemId)) return 0.5;
  const stats = getOrInitializeStats(itemId, isNew);
  return sampleBeta(stats.alpha, stats.beta);
}

/**
 * Update MAB stats when an item is shown (viewed)
 */
export function recordView(itemId: string, isNew: boolean = false): void {
  if (!normalizeItemId(itemId)) return;
  const stats = getOrInitializeStats(itemId, isNew);
  stats.lastUpdated = new Date();
  queuePersist();
}

/**
 * Update MAB stats when an item is added to cart (success)
 */
export function recordSuccess(itemId: string, isNew: boolean = false): void {
  if (!normalizeItemId(itemId)) return;
  const stats = getOrInitializeStats(itemId, isNew);
  stats.alpha = Math.max(1e-6, stats.alpha + 1);
  stats.lastUpdated = new Date();
  queuePersist();
}

/**
 * Update MAB stats when an item is viewed but not added (failure)
 */
export function recordFailure(itemId: string, isNew: boolean = false): void {
  if (!normalizeItemId(itemId)) return;
  const stats = getOrInitializeStats(itemId, isNew);
  stats.beta = Math.max(1e-6, stats.beta + 1);
  stats.lastUpdated = new Date();
  queuePersist();
}

/**
 * Decide whether to explore or exploit (80/20 rule)
 * Returns true if we should explore (show new/uncertain items)
 */
export function shouldExplore(): boolean {
  return Math.random() < config.explorationRate;
}

/**
 * Get success rate for an item (for display purposes)
 */
export function getSuccessRate(itemId: string): number {
  hydrateFromStorage();

  const stats = mabStats.get(normalizeItemId(itemId));
  if (!stats) return 0;
  
  // Return posterior mean (stable and always defined).
  const total = stats.alpha + stats.beta;
  if (!Number.isFinite(total) || total <= 0) return 0;
  return clamp01(stats.alpha / total);
}

/**
 * Get uncertainty score for an item
 * Higher uncertainty = needs more exploration
 */
export function getUncertaintyScore(itemId: string): number {
  const stats = getOrInitializeStats(itemId);
  const total = stats.alpha + stats.beta;
  
  // Variance of Beta distribution
  const variance = (stats.alpha * stats.beta) / (total ** 2 * (total + 1));
  
  return variance;
}

/**
 * Get all stats (for debugging/analytics)
 */
export function getAllStats(): Map<string, MABItemStats> {
  hydrateFromStorage();

  const copy = new Map<string, MABItemStats>();
  for (const [itemId, stats] of mabStats) {
    copy.set(itemId, {
      itemId: stats.itemId,
      alpha: stats.alpha,
      beta: stats.beta,
      lastUpdated: new Date(stats.lastUpdated.getTime()),
    });
  }
  return copy;
}

export function resetMABStats(): void {
  mabStats.clear();
  if (hasStorage()) {
    try {
      window.localStorage.removeItem(config.storageKey);
    } catch {
      // ignore
    }
  }
}
