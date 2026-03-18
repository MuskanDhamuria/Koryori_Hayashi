import type { LoyaltyProfile } from "../components/LoyaltyCard";
import type {
  AvailableDiscount,
  DiscountId,
  FlavorPreferences,
  GameKey,
  GameLeaderboardEntry,
  MenuItem,
  PricingBreakdown,
  WeatherData,
} from "../types";
import { getFallbackCustomerProfile } from "../lib/customerProfiles";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface BackendMenuCategory {
  id: string;
  name: string;
  items: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    originalPrice: number | null;
    discountPercentage: number | null;
    flashSaleRemaining: number | null;
    surplusIngredient: string | null;
    promotionLabel: string | null;
    category: string;
    categoryLabel: string;
    image: string;
    spicy?: number;
    isHighMargin: boolean;
    isNew: boolean;
    weatherTags: Array<"hot" | "cold" | "rainy" | "sunny">;
    flavorProfile: MenuItem["flavorProfile"];
  }>;
}

interface BackendLoyaltyResponse {
  user: {
    fullName: string;
    phoneNumber: string;
    flavorProfile: FlavorPreferences | null;
    referralCode: string | null;
    isBirthday: boolean;
  };
  loyaltyAccount: {
    pointsBalance: number;
    tier: LoyaltyProfile["tier"];
  } | null;
}

export interface CustomerProfile {
  phoneNumber?: string;
  fullName: string;
  flavorProfile: FlavorPreferences | null;
  loyaltyProfile: LoyaltyProfile | null;
}

export interface CustomerExperienceResponse {
  customer: {
    phoneNumber: string;
    fullName: string;
    flavorProfile: FlavorPreferences | null;
    loyaltyProfile: LoyaltyProfile;
  };
  categories: Array<{
    id: string;
    label: string;
  }>;
  menuItems: MenuItem[];
  orderHistoryItemIds: string[];
  weather: WeatherData;
  availableTables: Array<{
    code: string;
    label: string;
    seatCount: number;
  }>;
}

export interface OrderPricingPreview {
  pricing: PricingBreakdown;
  availableDiscounts: AvailableDiscount[];
  loyaltyProfile: LoyaltyProfile;
}

interface GameScoreResponse {
  score: {
    id: string;
    gameKey: GameKey;
    score: number;
    earnedPoints: number;
    rank: number;
  };
  loyalty: {
    pointsBalance: number;
    tier: LoyaltyProfile["tier"];
  } | null;
  leaderboard: GameLeaderboardEntry[];
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export type BackendMenuItemPairing = {
  sourceMenuItemId: string;
  targetMenuItemId: string;
  weight: number;
  reason: string | null;
};

export async function fetchCustomerOrderHistory(phoneNumber: string): Promise<string[]> {
  const response = await apiFetch<{ itemIds: string[] }>(
    `/api/loyalty/${encodeURIComponent(phoneNumber)}/history`,
  );
  return response.itemIds;
}

export async function fetchMenuItems(): Promise<MenuItem[]> {
  const response = await apiFetch<{ categories: BackendMenuCategory[] }>("/api/menu");

  return response.categories.flatMap((category) =>
    category.items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      originalPrice: item.originalPrice ?? undefined,
      discountPercentage: item.discountPercentage ?? undefined,
      flashSaleRemaining: item.flashSaleRemaining ?? undefined,
      surplusIngredient: item.surplusIngredient ?? undefined,
      promotionLabel: item.promotionLabel ?? undefined,
      category: item.category,
      image: item.image ?? "",
      spicy: item.spicy ?? undefined,
      isHighMargin: item.isHighMargin,
      isNew: item.isNew,
      flavorProfile: item.flavorProfile ?? undefined,
      weatherTags: item.weatherTags ?? []
    }))
  );
}

export async function fetchMenuItemPairings(): Promise<BackendMenuItemPairing[]> {
  const response = await apiFetch<{ pairings: BackendMenuItemPairing[] }>("/api/menu/pairings");
  return response.pairings;
}

export async function fetchLoyaltyProfile(phoneNumber: string): Promise<LoyaltyProfile | null> {
  try {
    const response = await apiFetch<BackendLoyaltyResponse>(`/api/loyalty/${encodeURIComponent(phoneNumber)}`);
    const fallbackProfile = getFallbackCustomerProfile(phoneNumber);

    return {
      tier: response.loyaltyAccount?.tier ?? fallbackProfile.loyaltyProfile.tier,
      points: response.loyaltyAccount?.pointsBalance ?? 0,
      name: response.user.fullName,
      isBirthday: response.user.isBirthday ?? fallbackProfile.loyaltyProfile.isBirthday,
      referralCode: response.user.referralCode ?? fallbackProfile.loyaltyProfile.referralCode,
    };
  } catch {
    return null;
  }
}

export async function fetchCustomerProfile(phoneNumber: string): Promise<CustomerProfile | null> {
  try {
    const response = await apiFetch<BackendLoyaltyResponse>(`/api/loyalty/${encodeURIComponent(phoneNumber)}`);
    const fallbackProfile = getFallbackCustomerProfile(phoneNumber);

    return {
      phoneNumber,
      fullName: response.user.fullName,
      flavorProfile: response.user.flavorProfile,
      loyaltyProfile: {
        tier: response.loyaltyAccount?.tier ?? fallbackProfile.loyaltyProfile.tier,
        points: response.loyaltyAccount?.pointsBalance ?? 0,
        name: response.user.fullName,
        isBirthday: response.user.isBirthday ?? fallbackProfile.loyaltyProfile.isBirthday,
        referralCode: response.user.referralCode ?? fallbackProfile.loyaltyProfile.referralCode,
      },
    };
  } catch {
    return null;
  }
}

export async function saveCustomerPreferences(input: {
  phoneNumber: string;
  fullName: string;
  flavorProfile: FlavorPreferences;
}): Promise<CustomerProfile> {
  const fallbackProfile = getFallbackCustomerProfile(input.phoneNumber);
  const response = await apiFetch<BackendLoyaltyResponse>(
    `/api/loyalty/${encodeURIComponent(input.phoneNumber)}/preferences`,
    {
      method: "PUT",
      body: JSON.stringify({
        fullName: input.fullName,
        flavorProfile: input.flavorProfile,
      }),
    },
  );

  return {
    phoneNumber: input.phoneNumber,
    fullName: response.user.fullName,
    flavorProfile: response.user.flavorProfile,
    loyaltyProfile: {
      tier: response.loyaltyAccount?.tier ?? fallbackProfile.loyaltyProfile.tier,
      points: response.loyaltyAccount?.pointsBalance ?? 0,
      name: response.user.fullName,
      isBirthday: response.user.isBirthday ?? fallbackProfile.loyaltyProfile.isBirthday,
      referralCode: response.user.referralCode ?? fallbackProfile.loyaltyProfile.referralCode,
    },
  };
}

export async function fetchQuickAccessProfiles(phoneNumbers: string[]): Promise<CustomerProfile[]> {
  const profiles = await Promise.all(
    phoneNumbers.map((phoneNumber) => fetchCustomerProfile(phoneNumber)),
  );

  return profiles.filter((profile): profile is CustomerProfile => profile !== null);
}

export async function createOrder(input: {
  customerName: string;
  phoneNumber: string;
  tableCode: string;
  items: Array<{ menuItemId: string; quantity: number }>;
  paymentMethod: "CARD" | "MOBILE";
  selectedDiscountId: DiscountId | null;
}): Promise<{
  loyalty: {
    earnedPoints: number;
    pointsBalance: number;
    tier: LoyaltyProfile["tier"];
  } | null;
}> {
  return apiFetch("/api/orders", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function fetchCustomerExperience(phoneNumber: string): Promise<CustomerExperienceResponse> {
  return apiFetch<CustomerExperienceResponse>(
    `/api/customer/experience?phoneNumber=${encodeURIComponent(phoneNumber)}`,
  );
}

export async function fetchCustomerRecommendations(input: {
  phoneNumber: string;
  cartItemIds: string[];
  flavorPreferences?: FlavorPreferences;
}): Promise<{
  recommendations: Array<{ item: MenuItem; reason: string }>;
  weather: WeatherData;
}> {
  return apiFetch("/api/customer/recommendations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchAvailableTables(): Promise<
  Array<{ code: string; label: string; seatCount: number }>
> {
  const response = await apiFetch<{
    tables: Array<{ code: string; label: string; seatCount: number }>;
  }>("/api/tables/active");
  return response.tables;
}

export async function fetchOrderPreview(input: {
  customerName: string;
  phoneNumber: string;
  tableCode: string;
  items: Array<{ menuItemId: string; quantity: number }>;
  selectedDiscountId: DiscountId | null;
}): Promise<OrderPricingPreview> {
  return apiFetch<OrderPricingPreview>("/api/orders/preview", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchGameLeaderboards(): Promise<Record<GameKey, GameLeaderboardEntry[]>> {
  const response = await apiFetch<{ leaderboards: Record<GameKey, GameLeaderboardEntry[]> }>(
    "/api/games/leaderboards",
  );

  return response.leaderboards;
}

export async function submitGameScore(input: {
  phoneNumber: string;
  fullName: string;
  gameKey: GameKey;
  score: number;
  rewardPoints: number;
  rewardReason: string;
}): Promise<GameScoreResponse> {
  return apiFetch<GameScoreResponse>("/api/games/score", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
