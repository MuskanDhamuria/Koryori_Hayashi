import type { LoyaltyProfile } from "../components/LoyaltyCard";
import type { DiscountId } from "../lib/pricing";
import type { MenuItem } from "../types";

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
  };
  loyaltyAccount: {
    pointsBalance: number;
    tier: LoyaltyProfile["tier"];
  } | null;
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

export async function fetchLoyaltyProfile(phoneNumber: string): Promise<LoyaltyProfile | null> {
  try {
    const response = await apiFetch<BackendLoyaltyResponse>(`/api/loyalty/${encodeURIComponent(phoneNumber)}`);

    return {
      tier: response.loyaltyAccount?.tier ?? "silver",
      points: response.loyaltyAccount?.pointsBalance ?? 0,
      name: response.user.fullName,
      isBirthday: phoneNumber === "+1 (555) 123-4567",
      referralCode: phoneNumber === "+1 (555) 123-4567" ? "YUKI2026" : "WELCOME2026"
    };
  } catch {
    return null;
  }
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
