import type { FlavorPreferences } from "../loyalty/routes.js";
import type { CustomerWeather } from "./weather.js";
import { getThompsonScore, getUncertaintyScore, shouldExplore } from "./banditStore.js";

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

type ReasonType =
  | "Bandit"
  | "Pairing"
  | "Today"
  | "History"
  | "Weather"
  | "Flavor"
  | "New"
  | "Popular"
  | "Chef";

type RecommendationContext = {
  phoneNumber: string;
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

function formatReason(reasonType: ReasonType, payload: {
  item: RecommendationMenuItem;
  pairingReason: string | null;
  historyScore: number;
  weatherScore: number;
  flavorScore: number;
  popularityScore: number;
  thompsonScore: number;
  normalizedUncertaintyScore: number;
}) {
  switch (reasonType) {
    case "Bandit": {
      const conversion = Math.round(payload.thompsonScore * 100);
      const learning = Math.round(payload.normalizedUncertaintyScore * 100);
      if (payload.item.isNew) {
        return `Multi-Armed Bandit Suggestion`;
      }
      return `Multi-Armed Bandit Suggestion`;
    }
    case "Pairing":
      return payload.pairingReason ? `Pairing: ${payload.pairingReason}` : "Pairing: complements your table's order";
    case "Today":
      return payload.item.promotionLabel ? `Today: ${payload.item.promotionLabel}` : "Today: featured special";
    case "History":
      if (payload.historyScore >= 0.65) {
        return "History: a strong repeat favorite";
      }
      return "History: inspired by past favorites";
    case "Weather":
      if (payload.weatherScore >= 0.7) {
        return `Weather: ${payload.item.name} fits today's conditions`;
      }
      return "Weather: a solid pick for today's conditions";
    case "Flavor":
      if (payload.flavorScore >= 0.7) {
        return "Flavor: a strong match for your taste profile";
      }
      return "Flavor: a balanced fit for most tastes";
    case "New":
      return "Chef's pick: a new dish worth trying";
    case "Popular":
      return payload.popularityScore >= 0.7 ? "Popular: a top pick with other guests" : "Popular: trending today";
    case "Chef":
    default:
      if (payload.item.isHighMargin) {
        return "Chef's pick: one of our highlighted dishes";
      }
      return "Chef's recommendation";
  }
}

function hasUniqueReasonType(
  candidate: {
    pairingScore: number;
    pairingReason: string | null;
    historyScore: number;
    weatherScore: number;
    flavorScore: number;
    popularityScore: number;
    item: RecommendationMenuItem;
  },
  reasonType: ReasonType,
  hasCartItems: boolean,
) {
  switch (reasonType) {
    case "Bandit":
      return true;
    case "Pairing":
      return hasCartItems;
    case "Today":
      return true;
    case "History":
      return true;
    case "Weather":
      // We guarantee at least one weather-based recommendation; prefer strong matches but don't block.
      return true;
    case "Flavor":
      return true;
    case "New":
      return candidate.item.isNew === true;
    case "Popular":
      return candidate.popularityScore >= 0.7;
    case "Chef":
    default:
      return true;
  }
}

export function buildRecommendations(context: RecommendationContext): CustomerRecommendation[] {
  const cartItemIds = new Set(context.cartItemIds);
  const pairingIndex = buildPairingIndex(context.menuItemPairings);
  const historyInsights = buildHistoryInsights(context.userHistory);
  const maxPopularity = Math.max(0, ...context.popularityByItemId.values());
  const userKey = context.phoneNumber;
  const isExplorationRound = shouldExplore();

  const candidates = context.menuItems
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

      // Thompson Sampling (exploit) + uncertainty/newness (explore) combined with context signals.
      const thompsonScore = getThompsonScore(userKey, item.id);
      const uncertaintyScore = getUncertaintyScore(userKey, item.id);
      const normalizedUncertaintyScore = clamp01(uncertaintyScore * 12);

      const thompsonWeight = isExplorationRound ? 0.35 : 0.55;
      const uncertaintyWeight = isExplorationRound ? 0.35 : 0.2;
      const newItemBonus = item.isNew ? (isExplorationRound ? 0.15 : 0.05) : 0;

      const banditScore =
        thompsonScore * thompsonWeight +
        normalizedUncertaintyScore * uncertaintyWeight +
        newItemBonus +
        pairingScore * 0.15 +
        flavorScore * 0.06 +
        weatherScore * 0.06 +
        historyScore * 0.05 +
        popularityScore * 0.05 +
        marginScore * 0.05 +
        promotionScore * 0.03;

      const combinedScore = banditScore;

      return {
        item,
        pairingScore,
        pairingReason,
        weatherScore,
        flavorScore,
        historyScore,
        popularityScore,
        thompsonScore,
        normalizedUncertaintyScore,
        combinedScore,
      };
    });

  const ranked = [...candidates].sort((left, right) => right.combinedScore - left.combinedScore);
  const maxRecommendations = 6;

  const usedItemIds = new Set<string>();
  const usedReasonTypes = new Set<ReasonType>();
  const selected: Array<(typeof candidates)[number] & { reasonType: ReasonType }> = [];
  const hasCartItems = context.cartItemIds.length > 0;

  const pickBest = (reasonType: ReasonType) => {
    const remaining = ranked.filter((entry) => !usedItemIds.has(entry.item.id));

    const candidate = (() => {
      if (remaining.length === 0) return undefined;
      switch (reasonType) {
        case "Bandit":
          return remaining[0];
        case "Weather":
          return [...remaining].sort((left, right) => right.weatherScore - left.weatherScore)[0];
        case "Flavor":
          return [...remaining].sort((left, right) => right.flavorScore - left.flavorScore)[0];
        case "Pairing":
          if (!hasCartItems) return undefined;
          return [...remaining].sort((left, right) => right.pairingScore - left.pairingScore)[0];
        case "History":
          return [...remaining].sort((left, right) => right.historyScore - left.historyScore)[0];
        case "Today":
          return [...remaining].sort((left, right) => {
            const hasPromoLeft = left.item.promotionLabel ? 1 : 0;
            const hasPromoRight = right.item.promotionLabel ? 1 : 0;
            return hasPromoRight - hasPromoLeft;
          })[0];
        default:
          return remaining.find((entry) => hasUniqueReasonType(entry, reasonType, hasCartItems));
      }
    })();
    if (!candidate) return;

    usedItemIds.add(candidate.item.id);
    usedReasonTypes.add(reasonType);
    selected.push({ ...candidate, reasonType });
  };

  // Always show one of each "strategy" reason in the hero section.
  (["Bandit", "Weather", "Flavor", "History", "Today"] as const).forEach((reasonType) => {
    if (selected.length >= maxRecommendations) return;
    pickBest(reasonType);
  });

  if (hasCartItems) {
    pickBest("Pairing");
  }

  const fallbackReasonOrder: ReasonType[] = [
    ...(hasCartItems ? (["Pairing"] as const) : []),
    "Today",
    "History",
    "Weather",
    "Flavor",
    "New",
    "Popular",
    "Chef",
  ];
  while (selected.length < maxRecommendations) {
    const next = ranked.find((entry) => !usedItemIds.has(entry.item.id));
    if (!next) break;

    const reasonType =
      fallbackReasonOrder.find(
        (candidateType) =>
          !usedReasonTypes.has(candidateType) && hasUniqueReasonType(next, candidateType, hasCartItems),
      ) ?? "Chef";

    usedItemIds.add(next.item.id);
    usedReasonTypes.add(reasonType);
    selected.push({ ...next, reasonType });
  }

  return selected.map((entry) => ({
    item: entry.item,
    reason: formatReason(entry.reasonType, {
      item: entry.item,
      pairingReason: entry.pairingReason,
      historyScore: entry.historyScore,
      weatherScore: entry.weatherScore,
      flavorScore: entry.flavorScore,
      popularityScore: entry.popularityScore,
      thompsonScore: entry.thompsonScore,
      normalizedUncertaintyScore: entry.normalizedUncertaintyScore,
    }),
  }));
}
