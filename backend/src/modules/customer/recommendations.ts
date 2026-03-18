import type { FlavorPreferences } from "../loyalty/routes.js";
import type { CustomerWeather } from "./weather.js";

type RecommendationMenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  spicy?: number | undefined;
  isHighMargin?: boolean | undefined;
  isNew?: boolean | undefined;
  originalPrice?: number | null;
  discountPercentage?: number | null;
  flashSaleRemaining?: number | null;
  surplusIngredient?: string | null;
  promotionLabel?: string | null;
  flavorProfile?: {
    umami?: number;
    citrus?: number;
    refreshing?: number;
    hearty?: number;
  } | null;
  weatherTags?: Array<"hot" | "cold" | "rainy" | "sunny">;
};

export type RecommendationPairingRule = {
  sourceMenuItemId: string;
  targetMenuItemId: string;
  weight: number;
  reason: string | null;
};

export type CustomerRecommendation = {
  item: RecommendationMenuItem;
  reason: string;
};

type RecommendationContext = {
  menuItems: RecommendationMenuItem[];
  cartItemIds: string[];
  flavorPreferences?: FlavorPreferences | null;
  weather: CustomerWeather;
  menuItemPairings: RecommendationPairingRule[];
  userHistory: string[];
  popularityByItemId: Map<string, number>;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number) {
  return clamp(value, 0, 1);
}

function getWeatherBoostScore(
  weather: CustomerWeather,
  itemWeatherTags?: Array<"hot" | "cold" | "rainy" | "sunny">,
) {
  if (!itemWeatherTags || itemWeatherTags.length === 0) {
    return 0.5;
  }

  let score = 0.5;

  if (weather.condition === "rainy" && itemWeatherTags.includes("rainy")) {
    score += 0.35;
  }

  if (weather.condition === "sunny" && weather.temperature > 75 && itemWeatherTags.includes("hot")) {
    score += 0.35;
  }

  if (weather.temperature < 65 && itemWeatherTags.includes("cold")) {
    score += 0.3;
  }

  if (weather.condition === "sunny" && itemWeatherTags.includes("sunny")) {
    score += 0.2;
  }

  if (weather.condition !== "sunny" && itemWeatherTags.includes("hot")) {
    score -= 0.2;
  }

  if (weather.condition !== "rainy" && itemWeatherTags.includes("rainy")) {
    score -= 0.1;
  }

  return clamp01(score);
}

function calculateFlavorMatchScore(
  item: RecommendationMenuItem,
  preferences?: FlavorPreferences | null,
) {
  if (!preferences || !item.flavorProfile) {
    return 0.5;
  }

  let score = 0.5;
  const profile = item.flavorProfile;

  if (preferences.umamiVsCitrus === "umami" && profile.umami) {
    score += profile.umami * 0.2;
  } else if (preferences.umamiVsCitrus === "citrus" && profile.citrus) {
    score += profile.citrus * 0.2;
  }

  if (preferences.refreshingVsHearty === "refreshing" && profile.refreshing) {
    score += profile.refreshing * 0.2;
  } else if (preferences.refreshingVsHearty === "hearty" && profile.hearty) {
    score += profile.hearty * 0.2;
  }

  if (item.spicy) {
    if (preferences.spicyTolerance === "very-spicy") {
      score += 0.1;
    } else if (preferences.spicyTolerance === "mild" && item.spicy > 2) {
      score -= 0.3;
    }
  }

  return clamp01(score);
}

function buildPairingIndex(rules: RecommendationPairingRule[]) {
  const index = new Map<string, Map<string, { weight: number; reason?: string | null }>>();

  for (const rule of rules) {
    if (!rule.sourceMenuItemId || !rule.targetMenuItemId) {
      continue;
    }

    if (!index.has(rule.sourceMenuItemId)) {
      index.set(rule.sourceMenuItemId, new Map());
    }

    index.get(rule.sourceMenuItemId)!.set(rule.targetMenuItemId, {
      weight: rule.weight,
      reason: rule.reason,
    });
  }

  return index;
}

function buildHistoryInsights(userHistory: string[]) {
  const counts = new Map<string, number>();
  const recencyRank = new Map<string, number>();

  for (const itemId of userHistory.slice(-500)) {
    counts.set(itemId, (counts.get(itemId) ?? 0) + 1);
  }

  let rank = 1;
  for (let index = userHistory.length - 1; index >= 0; index -= 1) {
    const itemId = userHistory[index]!;
    if (!recencyRank.has(itemId)) {
      recencyRank.set(itemId, rank);
      rank += 1;
    }
  }

  const maxCount = Math.max(0, ...counts.values());
  return { counts, recencyRank, maxCount };
}

function getHistoryScore(
  itemId: string,
  insights: ReturnType<typeof buildHistoryInsights>,
) {
  const count = insights.counts.get(itemId) ?? 0;
  if (count <= 0 || insights.maxCount <= 0) {
    return 0;
  }

  const countScore = clamp01(count / insights.maxCount);
  const rank = insights.recencyRank.get(itemId);
  const recencyScore = rank ? clamp01(1 - (rank - 1) / 25) : 0.25;

  return clamp01(countScore * 0.65 + recencyScore * 0.35);
}

function getPopularityScore(itemId: string, popularityByItemId: Map<string, number>, maxPopularity: number) {
  if (maxPopularity <= 0) {
    return 0;
  }

  return clamp01((popularityByItemId.get(itemId) ?? 0) / maxPopularity);
}

function buildReason(payload: {
  pairingReason?: string | null;
  historyScore: number;
  weatherScore: number;
  flavorScore: number;
  item: RecommendationMenuItem;
  promotionLabel?: string | null;
}) {
  if (payload.pairingReason) {
    return `Pairing: ${payload.pairingReason}`;
  }

  if (payload.promotionLabel) {
    return `Today: ${payload.promotionLabel}`;
  }

  if (payload.historyScore >= 0.65) {
    return "History: a strong repeat favorite";
  }

  if (payload.weatherScore >= 0.75) {
    return `Weather: ${payload.item.name} fits today's conditions`;
  }

  if (payload.flavorScore >= 0.7) {
    return "Flavor: a strong match for your taste profile";
  }

  if (payload.item.isNew) {
    return "Chef's pick: a new dish worth trying";
  }

  if (payload.item.isHighMargin) {
    return "Chef's pick: one of our highlighted dishes";
  }

  return "Chef's recommendation";
}

export function buildRecommendations(context: RecommendationContext): CustomerRecommendation[] {
  const cartItemIds = new Set(context.cartItemIds);
  const pairingIndex = buildPairingIndex(context.menuItemPairings);
  const historyInsights = buildHistoryInsights(context.userHistory);
  const maxPopularity = Math.max(0, ...context.popularityByItemId.values());

  const ranked = context.menuItems
    .filter((item) => !cartItemIds.has(item.id))
    .map((item) => {
      let pairingScore = 0;
      let pairingReason: string | null = null;

      for (const cartItemId of context.cartItemIds) {
        const pairing = pairingIndex.get(cartItemId)?.get(item.id);
        if (!pairing) {
          continue;
        }

        pairingScore += pairing.weight;
        pairingReason = pairing.reason ?? `Pairs well with ${cartItemId}`;
      }

      const weatherScore = getWeatherBoostScore(context.weather, item.weatherTags);
      const flavorScore = calculateFlavorMatchScore(item, context.flavorPreferences);
      const historyScore = getHistoryScore(item.id, historyInsights);
      const popularityScore = getPopularityScore(item.id, context.popularityByItemId, maxPopularity);
      const marginScore = item.isHighMargin ? 0.12 : 0;
      const noveltyScore = item.isNew ? 0.08 : 0;
      const promotionScore = item.discountPercentage ? item.discountPercentage / 100 : 0;

      const combinedScore =
        pairingScore * 0.28 +
        weatherScore * 0.16 +
        flavorScore * 0.2 +
        historyScore * 0.16 +
        popularityScore * 0.12 +
        marginScore +
        noveltyScore +
        promotionScore * 0.08;

      return {
        item,
        pairingReason,
        weatherScore,
        flavorScore,
        historyScore,
        combinedScore,
      };
    })
    .sort((left, right) => right.combinedScore - left.combinedScore)
    .slice(0, 6);

  return ranked.map((entry) => ({
    item: entry.item,
    reason: buildReason({
      pairingReason: entry.pairingReason,
      historyScore: entry.historyScore,
      weatherScore: entry.weatherScore,
      flavorScore: entry.flavorScore,
      item: entry.item,
      promotionLabel: entry.item.promotionLabel,
    }),
  }));
}
