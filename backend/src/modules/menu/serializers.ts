import { getMenuPromotion } from "./pricing.js";

export type SerializedMenuItem = {
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
  flavorProfile?: Record<string, number>;
};

type MenuSerializerInput = {
  id: string;
  sku: string;
  name: string;
  description: string;
  imageUrl: string | null;
  price: unknown;
  isHighMargin: boolean;
  isNew: boolean;
  spicyLevel: number | null;
  weatherTags: string[];
  flavorProfile: unknown;
  category: {
    slug: string;
    name: string;
  };
  inventoryItem: {
    stockOnHand: number;
    reorderPoint: number;
    ingredientName: string;
    expiresInHours: number | null;
  } | null;
};

export function serializeMenuItem(item: MenuSerializerInput): SerializedMenuItem {
  const promotion = getMenuPromotion({
    name: item.name,
    price: item.price,
    inventoryItem: item.inventoryItem,
  });

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: promotion?.effectivePrice ?? Number(item.price),
    originalPrice: promotion?.originalPrice ?? null,
    discountPercentage: promotion?.discountPercentage ?? null,
    flashSaleRemaining: promotion?.flashSaleRemaining ?? null,
    surplusIngredient: promotion?.surplusIngredient ?? null,
    promotionLabel: promotion?.promotionLabel ?? null,
    category: item.category.slug,
    categoryLabel: item.category.name,
    image: item.imageUrl ?? "",
    spicy: item.spicyLevel ?? undefined,
    isHighMargin: item.isHighMargin,
    isNew: item.isNew,
    weatherTags: (item.weatherTags ?? []) as Array<"hot" | "cold" | "rainy" | "sunny">,
    flavorProfile:
      item.flavorProfile && typeof item.flavorProfile === "object"
        ? (item.flavorProfile as Record<string, number>)
        : undefined,
  };
}
