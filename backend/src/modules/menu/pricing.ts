type MenuPricingInventory = {
  stockOnHand: number;
  reorderPoint: number;
  ingredientName: string;
  expiresInHours: number | null;
} | null;

type MenuPricingInput = {
  name: string;
  price: unknown;
  inventoryItem: MenuPricingInventory;
};

export type MenuPromotion = {
  effectivePrice: number;
  originalPrice: number;
  discountPercentage: number;
  flashSaleRemaining: number | null;
  surplusIngredient: string | null;
  promotionLabel: string | null;
};

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getMenuPromotion(input: MenuPricingInput): MenuPromotion | null {
  const basePrice = Number(input.price);
  const inventory = input.inventoryItem;

  if (!inventory || !Number.isFinite(basePrice) || basePrice <= 0) {
    return null;
  }

  const reorderPoint = Math.max(1, inventory.reorderPoint);
  const overstockRatio = inventory.stockOnHand / reorderPoint;
  const hasOverstock = overstockRatio >= 2.5;
  const hasUrgency =
    typeof inventory.expiresInHours === "number" && inventory.expiresInHours <= 8 && inventory.stockOnHand > reorderPoint;

  if (!hasOverstock && !hasUrgency) {
    return null;
  }

  const overstockBonus = clamp((overstockRatio - 2.5) * 3, 0, 5);
  const urgencyBonus =
    typeof inventory.expiresInHours === "number"
      ? clamp((8 - inventory.expiresInHours) * 0.8, 0, 4)
      : 0;
  const discountPercentage = clamp(Math.round(8 + overstockBonus + urgencyBonus), 8, 15);
  const effectivePrice = roundCurrency(basePrice * (1 - discountPercentage / 100));
  const flashSaleRemaining = hasOverstock
    ? Math.max(1, Math.min(6, inventory.stockOnHand - reorderPoint * 2))
    : null;

  return {
    effectivePrice,
    originalPrice: roundCurrency(basePrice),
    discountPercentage,
    flashSaleRemaining,
    surplusIngredient: inventory.ingredientName,
    promotionLabel: `Fresh ${inventory.ingredientName} spotlight`,
  };
}

export function getEffectiveMenuPrice(input: MenuPricingInput) {
  return getMenuPromotion(input)?.effectivePrice ?? Number(input.price);
}
