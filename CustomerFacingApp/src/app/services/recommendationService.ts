import { MenuItem, CartItem, FlavorPreferences, WeatherData } from '../types';
import { getThompsonScore, shouldExplore, getUncertaintyScore } from './mabService';
import { getWeatherBoostScore } from './weatherService';

export type MenuItemPairingRule = {
  sourceMenuItemId: string;
  targetMenuItemId: string;
  weight?: number;
  reason?: string | null;
};

interface RecommendationContext {
  cartItems: CartItem[];
  flavorPreferences?: FlavorPreferences;
  weather?: WeatherData;
  userHistory?: string[]; // Past ordered item IDs (most-recent last)
  menuItemPairings?: MenuItemPairingRule[];
}

type PairingIndex = Map<string, Map<string, { weight: number; reason?: string | null }>>;

function buildPairingIndex(rules?: MenuItemPairingRule[]): PairingIndex | undefined {
  if (!rules || rules.length === 0) return undefined;
  const index: PairingIndex = new Map();

  for (const rule of rules) {
    const source = rule.sourceMenuItemId?.trim();
    const target = rule.targetMenuItemId?.trim();
    if (!source || !target) continue;

    const weight = typeof rule.weight === 'number' && Number.isFinite(rule.weight) ? rule.weight : 0.3;
    if (!index.has(source)) index.set(source, new Map());
    index.get(source)!.set(target, { weight, reason: rule.reason });
  }

  return index;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

/**
 * Calculate flavor match score based on user preferences
 */
function calculateFlavorMatchScore(
  item: MenuItem,
  preferences?: FlavorPreferences
): number {
  if (!preferences || !item.flavorProfile) return 0.5;

  let score = 0.5;
  const profile = item.flavorProfile;

  // Umami vs Citrus preference
  if (preferences.umamiVsCitrus === 'umami' && profile.umami) {
    score += profile.umami * 0.2;
  } else if (preferences.umamiVsCitrus === 'citrus' && profile.citrus) {
    score += profile.citrus * 0.2;
  }

  // Refreshing vs Hearty preference
  if (preferences.refreshingVsHearty === 'refreshing' && profile.refreshing) {
    score += profile.refreshing * 0.2;
  } else if (preferences.refreshingVsHearty === 'hearty' && profile.hearty) {
    score += profile.hearty * 0.2;
  }

  // Spicy tolerance
  if (item.spicy) {
    if (preferences.spicyTolerance === 'very-spicy') {
      score += 0.1;
    } else if (preferences.spicyTolerance === 'mild' && item.spicy > 2) {
      score -= 0.3; // Penalize very spicy items for mild preference
    }
  }

  return Math.max(0, Math.min(1, score));
}

type UserHistoryInsights = {
  counts: Map<string, number>;
  maxCount: number;
  recencyRank: Map<string, number>; // 1 = most recent
};

function buildUserHistoryInsights(userHistory: string[]): UserHistoryInsights {
  const counts = new Map<string, number>();
  const recencyRank = new Map<string, number>();

  // Only the most recent N entries matter for recency signals.
  const recentWindow = 25;
  const normalized = userHistory
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .slice(-recentWindow);

  // Count affinity across all provided history (bounded to avoid untrusted payload sizes).
  const countWindow = 500;
  const countNormalized = userHistory
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .slice(-countWindow);

  let maxCount = 0;
  for (const id of countNormalized) {
    const next = (counts.get(id) ?? 0) + 1;
    counts.set(id, next);
    if (next > maxCount) maxCount = next;
  }

  // Most-recent last: assign ranks starting at 1 for last item.
  for (let i = normalized.length - 1, rank = 1; i >= 0; i -= 1, rank += 1) {
    const id = normalized[i]!;
    if (!recencyRank.has(id)) recencyRank.set(id, rank);
  }

  return { counts, maxCount, recencyRank };
}

function getHistoryScore(
  itemId: string,
  insights: UserHistoryInsights | undefined
): number {
  if (!insights || !itemId) return 0;

  const count = insights.counts.get(itemId) ?? 0;
  if (count <= 0) return 0;

  const countScore =
    insights.maxCount > 0 ? clamp01(count / insights.maxCount) : 0;

  // Recency: rank 1 = most recent. Map to [0,1] with a soft drop-off.
  const rank = insights.recencyRank.get(itemId);
  const recencyScore = rank ? clamp01(1 - (rank - 1) / 25) : 0.25;

  // Keep this as a mild nudge; other signals should dominate.
  return clamp01(countScore * 0.65 + recencyScore * 0.35);
}

type Candidate = {
  item: MenuItem;
  pairingScore: number;
  thompsonScore: number;
  flavorScore: number;
  weatherScore: number;
  uncertaintyScore: number;
  historyScore: number;
  mabScore: number;
  thompsonRankScore: number;
  weatherRankScore: number;
  flavorRankScore: number;
  combinedScore: number;
  pairingReason?: string;
};

/**
 * Generate recommendations with guaranteed strategy coverage:
 * 1 MAB, 1 Thompson, 1 Weather-aware, 1 Flavor-matched, 1 Pairing, 1 History
 */
export function generateRecommendations(
  allItems: MenuItem[],
  context: RecommendationContext,
  maxRecommendations: number = 6
): Array<{ item: MenuItem; reason: string }> {
  const { cartItems, flavorPreferences, weather, userHistory = [], menuItemPairings } = context;
  const historyInsights = userHistory.length ? buildUserHistoryInsights(userHistory) : undefined;
  const targetCount = Math.max(1, Math.floor(maxRecommendations));
  const pairingIndex = buildPairingIndex(menuItemPairings);

  const cartItemIds = cartItems.map((item) => item.id);
  const candidates: Candidate[] = [];

  allItems.forEach((item) => {
    if (cartItemIds.includes(item.id)) return;

    let pairingScore = 0;
    let pairingReason: string | undefined;

    cartItems.forEach((cartItem) => {
      const pairing = pairingIndex?.get(cartItem.id)?.get(item.id);
      if (!pairing) return;

      pairingScore += pairing.weight;
      pairingReason =
        pairing.reason?.trim() ||
        `Pairs perfectly with ${cartItem.name}`;
    });

    const thompsonScore = getThompsonScore(item.id, item.isNew);
    const flavorScore = calculateFlavorMatchScore(item, flavorPreferences);
    const weatherScore = weather ? getWeatherBoostScore(weather, item.weatherTags) : 0.5;
    const uncertaintyScore = getUncertaintyScore(item.id);
    const marginScore = item.isHighMargin ? 0.15 : 0;
    const historyScore = getHistoryScore(item.id, historyInsights);

    // MAB emphasis = uncertainty + exploration value
    const mabScore =
      uncertaintyScore * 0.55 +
      (item.isNew ? 0.25 : 0) +
      pairingScore * 0.1 +
      flavorScore * 0.05 +
      weatherScore * 0.05;

    // Thompson emphasis = highest sampled conversion probability
    const thompsonRankScore =
      thompsonScore * 0.65 +
      pairingScore * 0.15 +
      flavorScore * 0.1 +
      weatherScore * 0.1 +
      historyScore * 0.08;

    // Weather emphasis = weather alignment (prefer explicit weather-tagged dishes)
    const weatherTagBonus = item.weatherTags?.length ? 0.1 : -0.2;
    const weatherRankScore =
      weatherScore * 0.7 +
      thompsonScore * 0.1 +
      flavorScore * 0.1 +
      pairingScore * 0.1 +
      weatherTagBonus +
      historyScore * 0.05;

    // Flavor emphasis = flavor profile alignment
    const flavorRankScore =
      flavorScore * 0.7 +
      thompsonScore * 0.15 +
      pairingScore * 0.1 +
      weatherScore * 0.05 +
      historyScore * 0.05;

    const combinedScore =
      thompsonScore * 0.3 +
      pairingScore * 0.25 +
      flavorScore * 0.2 +
      weatherScore * 0.15 +
      marginScore * 0.1 +
      historyScore * 0.05;

    candidates.push({
      item,
      pairingScore,
      thompsonScore,
      flavorScore,
      weatherScore,
      uncertaintyScore,
      historyScore,
      mabScore,
      thompsonRankScore,
      weatherRankScore,
      flavorRankScore,
      combinedScore,
      pairingReason,
    });
  });

  const isExplorationRound = shouldExplore();
  const usedIds = new Set<string>();
  const results: Array<{ item: MenuItem; reason: string }> = [];

  const historyReason = (candidate: Candidate): string | undefined => {
    if (candidate.historyScore < 0.65) return undefined;
    return 'strong repeat favorite';
  };

  const pushIfAvailable = (
    sorted: Candidate[],
    reasonBuilder: (candidate: Candidate) => string,
    predicate?: (candidate: Candidate) => boolean
  ) => {
    if (results.length >= targetCount) return;
    const candidate = sorted.find((entry) => {
      if (usedIds.has(entry.item.id)) return false;
      if (predicate && !predicate(entry)) return false;
      return true;
    });
    if (!candidate) return;

    usedIds.add(candidate.item.id);
    results.push({ item: candidate.item, reason: reasonBuilder(candidate) });
  };

  const mabSorted = [...candidates].sort((a, b) => b.mabScore - a.mabScore);
  const thompsonSorted = [...candidates].sort((a, b) => b.thompsonRankScore - a.thompsonRankScore);
  const weatherSorted = [...candidates].sort((a, b) => b.weatherRankScore - a.weatherRankScore);
  const flavorSorted = [...candidates].sort((a, b) => b.flavorRankScore - a.flavorRankScore);
  const pairingSorted = [...candidates].sort((a, b) => b.pairingScore - a.pairingScore);
  const historySorted = [...candidates].sort((a, b) => b.historyScore - a.historyScore);

  // Always prioritize MAB + Thompson when space is limited.
  pushIfAvailable(mabSorted, (candidate) => {
    const detail =
      candidate.pairingReason ??
      historyReason(candidate) ??
      (candidate.item.isNew
        ? 'explore this new dish with high learning value'
        : 'New dish worth exploring');
    return `MAB: ${detail}`;
  });

  pushIfAvailable(thompsonSorted, (candidate) => {
    const detail =
      candidate.pairingReason ??
      historyReason(candidate) ??
      `strongest conversion estimate (${Math.round(candidate.thompsonScore * 100)}%)`;
    return `Thompson: ${detail}`;
  });

  // Add weather / flavor coverage when the caller provides the required context.
  if (weather) {
    pushIfAvailable(weatherSorted, (candidate) => {
      if (weather.condition === 'rainy' && candidate.item.weatherTags?.includes('rainy')) {
        return 'Weather: ideal for rainy weather';
      }

      if (
        weather.condition === 'sunny' &&
        weather.temperature > 75 &&
        candidate.item.weatherTags?.includes('hot')
      ) {
        return `Weather: refreshing for ${weather.temperature}F weather`;
      }

      return `Weather: aligned with ${weather.description.toLowerCase()}`;
    });
  } else if (targetCount >= 4) {
    pushIfAvailable(weatherSorted, () => 'Weather: suitable for current conditions');
  }

  if (flavorPreferences) {
    pushIfAvailable(flavorSorted, (candidate) =>
      `Flavor: ${candidate.pairingReason ?? historyReason(candidate) ?? 'strong fit for your taste profile'}`
    );
  } else if (!flavorPreferences && targetCount >= 4) {
    // Preserve the original “coverage” slot when the caller expects 4 items.
    pushIfAvailable(flavorSorted, () => 'Flavor: balanced flavor profile');
  }

  // 5) Menu-item pairing suggestion (only when cart has known pairings)
  pushIfAvailable(
    pairingSorted,
    (candidate) => `Pairing: ${candidate.pairingReason ?? 'complements your current cart'}`,
    (candidate) => candidate.pairingScore > 0
  );

  // 6) History-based suggestion (only when we have order history)
  pushIfAvailable(
    historySorted,
    (candidate) => `History: ${historyReason(candidate) ?? 'a repeat favorite from your past orders'}`,
    (candidate) => candidate.historyScore > 0
  );

  // Fill remaining slots if caller asks for >4 or collisions occur.
  const fallbackSorted = [...candidates].sort((a, b) => {
    if (isExplorationRound) {
      const exploreA = a.uncertaintyScore * 0.6 + (a.item.isNew ? 0.25 : 0) + a.pairingScore * 0.15;
      const exploreB = b.uncertaintyScore * 0.6 + (b.item.isNew ? 0.25 : 0) + b.pairingScore * 0.15;
      return exploreB - exploreA;
    }
    return b.combinedScore - a.combinedScore;
  });

  while (results.length < targetCount) {
    const candidate = fallbackSorted.find((entry) => !usedIds.has(entry.item.id));
    if (!candidate) break;

    usedIds.add(candidate.item.id);
    results.push({
      item: candidate.item,
      reason:
        ` ${candidate.pairingReason ?? historyReason(candidate) ?? "Chef's special recommendation"}`,
    });
  }

  return results.slice(0, targetCount);
}

/**
 * Filter menu items based on flavor preferences
 * Returns items sorted by match score (highest first)
 */
export function filterMenuByFlavorProfile(
  menuItems: MenuItem[],
  preferences: FlavorPreferences
): MenuItem[] {
  const scored = menuItems.map(item => ({
    item,
    score: calculateFlavorMatchScore(item, preferences),
  }));

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Filter out poor matches (score < 0.3)
  return scored
    .filter(s => s.score >= 0.3)
    .map(s => s.item);
}

/**
 * Get weather-appropriate menu items
 */
export function getWeatherAppropriateItems(
  menuItems: MenuItem[],
  weather: WeatherData
): MenuItem[] {
  return menuItems.filter(item => {
    const weatherScore = getWeatherBoostScore(weather, item.weatherTags);
    return weatherScore >= 0.6; // Only show items with good weather match
  });
}
