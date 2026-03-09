import { MenuItem, CartItem, FlavorPreferences, WeatherData } from '../types';
import { getThompsonScore, shouldExplore, getUncertaintyScore } from './mabService';
import { getWeatherBoostScore } from './weatherService';

interface RecommendationContext {
  cartItems: CartItem[];
  flavorPreferences?: FlavorPreferences;
  weather?: WeatherData;
  userHistory?: string[]; // Past order IDs
}

// Basic pairing rules
const PAIRING_RULES: Record<string, string[]> = {
  '1': ['12', '13'], // Deluxe Sushi -> Green Tea, Sake
  '2': ['12', '10'], // California Roll -> Green Tea, Miso Soup
  '3': ['13', '10'], // Salmon Sashimi -> Sake, Miso Soup
  '4': ['7', '8'],   // Tonkotsu Ramen -> Gyoza, Edamame
  '5': ['7', '8'],   // Spicy Miso Ramen -> Gyoza, Edamame
  '6': ['9', '7'],   // Udon -> Shrimp Tempura, Gyoza
  '11': ['10', '12'], // Teriyaki Chicken -> Miso Soup, Green Tea
};

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

type Candidate = {
  item: MenuItem;
  pairingScore: number;
  thompsonScore: number;
  flavorScore: number;
  weatherScore: number;
  uncertaintyScore: number;
  mabScore: number;
  thompsonRankScore: number;
  weatherRankScore: number;
  flavorRankScore: number;
  combinedScore: number;
  pairingReason?: string;
};

/**
 * Generate recommendations with guaranteed strategy coverage:
 * 1 MAB, 1 Thompson, 1 Weather-aware, 1 Flavor-matched
 */
export function generateRecommendations(
  allItems: MenuItem[],
  context: RecommendationContext,
  maxRecommendations: number = 4
): Array<{ item: MenuItem; reason: string }> {
  const { cartItems, flavorPreferences, weather, userHistory = [] } = context;
  void userHistory;

  const cartItemIds = cartItems.map((item) => item.id);
  const candidates: Candidate[] = [];

  allItems.forEach((item) => {
    if (cartItemIds.includes(item.id)) return;

    let pairingScore = 0;
    let pairingReason: string | undefined;

    cartItems.forEach((cartItem) => {
      const pairings = PAIRING_RULES[cartItem.id];
      if (pairings?.includes(item.id)) {
        pairingScore += 0.3;
        pairingReason = `Pairs perfectly with ${cartItem.name}`;
      }
    });

    const thompsonScore = getThompsonScore(item.id, item.isNew);
    const flavorScore = calculateFlavorMatchScore(item, flavorPreferences);
    const weatherScore = weather ? getWeatherBoostScore(weather, item.weatherTags) : 0.5;
    const uncertaintyScore = getUncertaintyScore(item.id);
    const marginScore = item.isHighMargin ? 0.15 : 0;

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
      weatherScore * 0.1;

    // Weather emphasis = weather alignment (prefer explicit weather-tagged dishes)
    const weatherTagBonus = item.weatherTags?.length ? 0.1 : -0.2;
    const weatherRankScore =
      weatherScore * 0.7 +
      thompsonScore * 0.1 +
      flavorScore * 0.1 +
      pairingScore * 0.1 +
      weatherTagBonus;

    // Flavor emphasis = flavor profile alignment
    const flavorRankScore =
      flavorScore * 0.7 +
      thompsonScore * 0.15 +
      pairingScore * 0.1 +
      weatherScore * 0.05;

    const combinedScore =
      thompsonScore * 0.3 +
      pairingScore * 0.25 +
      flavorScore * 0.2 +
      weatherScore * 0.15 +
      marginScore * 0.1;

    candidates.push({
      item,
      pairingScore,
      thompsonScore,
      flavorScore,
      weatherScore,
      uncertaintyScore,
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

  const pushIfAvailable = (
    sorted: Candidate[],
    reasonBuilder: (candidate: Candidate) => string
  ) => {
    const candidate = sorted.find((entry) => !usedIds.has(entry.item.id));
    if (!candidate) return;

    usedIds.add(candidate.item.id);
    results.push({ item: candidate.item, reason: reasonBuilder(candidate) });
  };

  // 1) MAB recommendation
  pushIfAvailable(
    [...candidates].sort((a, b) => b.mabScore - a.mabScore),
    (candidate) =>
      candidate.pairingReason ??
      (candidate.item.isNew
        ? 'MAB pick: explore this new dish with high learning value'
        : 'MAB pick: high-uncertainty dish worth exploring')
  );

  // 2) Thompson Sampling recommendation
  pushIfAvailable(
    [...candidates].sort((a, b) => b.thompsonRankScore - a.thompsonRankScore),
    (candidate) =>
      candidate.pairingReason ??
      `Thompson pick: strongest conversion estimate (${Math.round(candidate.thompsonScore * 100)}%)`
  );

  // 3) Weather-aware recommendation
  pushIfAvailable(
    [...candidates].sort((a, b) => b.weatherRankScore - a.weatherRankScore),
    (candidate) => {
      if (!weather) return 'Weather-aware pick: suitable for current conditions';

      if (weather.condition === 'rainy' && candidate.item.weatherTags?.includes('rainy')) {
        return 'Weather-aware pick: ideal for rainy weather';
      }

      if (
        weather.condition === 'sunny' &&
        weather.temperature > 75 &&
        candidate.item.weatherTags?.includes('hot')
      ) {
        return `Weather-aware pick: refreshing for ${weather.temperature}F weather`;
      }

      return `Weather-aware pick: aligned with ${weather.description.toLowerCase()}`;
    }
  );

  // 4) Flavor-matched recommendation
  pushIfAvailable(
    [...candidates].sort((a, b) => b.flavorRankScore - a.flavorRankScore),
    () =>
      flavorPreferences
        ? 'Flavor-matched pick: strong fit for your taste profile'
        : 'Flavor-matched pick: balanced flavor profile'
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

  while (results.length < maxRecommendations) {
    const candidate = fallbackSorted.find((entry) => !usedIds.has(entry.item.id));
    if (!candidate) break;

    usedIds.add(candidate.item.id);
    results.push({
      item: candidate.item,
      reason: candidate.pairingReason ?? "Chef's special recommendation",
    });
  }

  return results.slice(0, maxRecommendations);
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
