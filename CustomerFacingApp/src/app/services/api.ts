import type { LoyaltyProfile } from "../components/LoyaltyCard";
import type { DiscountId } from "../lib/pricing";
import type {
  FlavorPreferences,
  GameKey,
  GameLeaderboardEntry,
  MenuItem,
} from "../types";
import { getFallbackCustomerProfile } from "../lib/customerProfiles";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

interface BackendMenuCategory {
  id: string;
  slug: string;
  name: string;
  items: Array<{
    id: string;
    sku: string;
    name: string;
    description: string;
    imageUrl: string | null;
    price: string | number;
    isHighMargin: boolean;
    isNew: boolean;
    spicyLevel: number | null;
    weatherTags: Array<"hot" | "cold" | "rainy" | "sunny">;
    flavorProfile: MenuItem["flavorProfile"];
  }>;
}

interface BackendLoyaltyResponse {
  user: {
    fullName: string;
    flavorProfile: FlavorPreferences | null;
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
      category: category.slug,
      image: item.imageUrl ?? "",
      spicy: item.spicyLevel ?? undefined,
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
      isBirthday: fallbackProfile.loyaltyProfile.isBirthday,
      referralCode: fallbackProfile.loyaltyProfile.referralCode,
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
        isBirthday: fallbackProfile.loyaltyProfile.isBirthday,
        referralCode: fallbackProfile.loyaltyProfile.referralCode,
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
      isBirthday: fallbackProfile.loyaltyProfile.isBirthday,
      referralCode: fallbackProfile.loyaltyProfile.referralCode,
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
  birthdayDiscountPercent: number;
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
