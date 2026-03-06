import { MABItemStats } from '../types';

/**
 * Multi-Armed Bandit Service using Thompson Sampling
 * This implements the explore-exploit tradeoff for menu recommendations
 */

// In-memory storage for MAB stats (in production, use database)
const mabStats = new Map<string, MABItemStats>();

/**
 * Initialize or get MAB stats for an item
 */
export function getOrInitializeStats(itemId: string, isNew: boolean = false): MABItemStats {
  if (!mabStats.has(itemId)) {
    // New items get high uncertainty (beta parameter)
    // This forces Thompson Sampling to explore them more
    const stats: MABItemStats = {
      itemId,
      alpha: isNew ? 1 : 2, // Prior successes + 1
      beta: isNew ? 5 : 2,  // Prior failures + 1 (high uncertainty for new items)
      lastUpdated: new Date(),
    };
    mabStats.set(itemId, stats);
  }
  return mabStats.get(itemId)!;
}

/**
 * Sample from Beta distribution using Thompson Sampling
 * This is a simplified version - in production, use a proper stats library
 */
function sampleBeta(alpha: number, beta: number): number {
  // Simple approximation using the mean and adding randomness
  // For a proper implementation, use jStat or similar library
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
  
  // Add random noise based on variance (simplified)
  const noise = (Math.random() - 0.5) * Math.sqrt(variance) * 3;
  return Math.max(0, Math.min(1, mean + noise));
}

/**
 * Get Thompson Sampling score for an item
 * Higher score = higher probability of being recommended
 */
export function getThompsonScore(itemId: string, isNew: boolean = false): number {
  const stats = getOrInitializeStats(itemId, isNew);
  return sampleBeta(stats.alpha, stats.beta);
}

/**
 * Update MAB stats when an item is shown (viewed)
 */
export function recordView(itemId: string): void {
  const stats = mabStats.get(itemId);
  if (stats) {
    stats.lastUpdated = new Date();
  }
}

/**
 * Update MAB stats when an item is added to cart (success)
 */
export function recordSuccess(itemId: string): void {
  const stats = getOrInitializeStats(itemId);
  stats.alpha += 1; // Increment successes
  stats.lastUpdated = new Date();
}

/**
 * Update MAB stats when an item is viewed but not added (failure)
 */
export function recordFailure(itemId: string): void {
  const stats = getOrInitializeStats(itemId);
  stats.beta += 1; // Increment failures
  stats.lastUpdated = new Date();
}

/**
 * Decide whether to explore or exploit (80/20 rule)
 * Returns true if we should explore (show new/uncertain items)
 */
export function shouldExplore(): boolean {
  return Math.random() < 0.2; // 20% exploration rate
}

/**
 * Get success rate for an item (for display purposes)
 */
export function getSuccessRate(itemId: string): number {
  const stats = mabStats.get(itemId);
  if (!stats) return 0;
  
  const total = stats.alpha + stats.beta - 2; // Remove priors
  if (total === 0) return 0;
  
  const successes = stats.alpha - 1;
  return successes / total;
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
  return new Map(mabStats);
}
