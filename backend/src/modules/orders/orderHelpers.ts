import { getEffectiveMenuPrice, getMenuPromotion } from "../menu/pricing.js";

export interface SelectedDiscount {
  amount: number;
  pointsCost: number;
}

export type DiscountId =
  | "points-5"
  | "points-10"
  | "points-15"
  | "first-time"
  | "referral";

export interface AvailableDiscount {
  id: DiscountId;
  name: string;
  description: string;
  discount: number;
  pointsCost?: number;
  available: boolean;
  requiresPoints?: boolean;
}

export interface OrderLineItem {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  discountPercent: number;
}

export function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export function getTierMultiplier(tier: string | null | undefined) {
  if (tier === "platinum") {
    return 2;
  }

  if (tier === "gold") {
    return 1.5;
  }

  return 1;
}

export function getTierFromPoints(points: number) {
  if (points >= 1500) {
    return "platinum";
  }

  if (points >= 500) {
    return "gold";
  }

  return "silver";
}

export function getBirthdayDiscountPercent(payload: {
  tier: string | null | undefined;
  isBirthday: boolean;
}) {
  if (!payload.isBirthday) {
    return 0;
  }

  if (payload.tier === "platinum") {
    return 15;
  }

  if (payload.tier === "gold") {
    return 10;
  }

  return 5;
}

export function getSelectedDiscount(payload: {
  selectedDiscountId?: DiscountId | null;
  totalBeforeSelectedDiscount: number;
  currentPoints: number;
  currentTier: string;
}): SelectedDiscount {
  switch (payload.selectedDiscountId) {
    case "points-5":
      return payload.currentPoints >= 100
        ? { amount: 5, pointsCost: 100 }
        : { amount: 0, pointsCost: 0 };
    case "points-10":
      return payload.currentPoints >= 200
        ? { amount: 10, pointsCost: 200 }
        : { amount: 0, pointsCost: 0 };
    case "points-15":
      return payload.currentPoints >= 300
        ? { amount: 15, pointsCost: 300 }
        : { amount: 0, pointsCost: 0 };
    case "first-time":
      return payload.currentTier === "silver" && payload.currentPoints === 0
        ? {
            amount: roundCurrency(Math.min(payload.totalBeforeSelectedDiscount * 0.1, 10)),
            pointsCost: 0,
          }
        : { amount: 0, pointsCost: 0 };
    default:
      return { amount: 0, pointsCost: 0 };
  }
}

export function getAvailableDiscounts(payload: {
  currentPoints: number;
  currentTier: string;
  totalBeforeSelectedDiscount: number;
  referralEligible?: boolean;
}): AvailableDiscount[] {
  return [
    {
      id: "points-5",
      name: "$5 Off",
      description: "Redeem 100 points",
      discount: 5,
      pointsCost: 100,
      available: payload.currentPoints >= 100,
      requiresPoints: true,
    },
    {
      id: "points-10",
      name: "$10 Off",
      description: "Redeem 200 points",
      discount: 10,
      pointsCost: 200,
      available: payload.currentPoints >= 200,
      requiresPoints: true,
    },
    {
      id: "points-15",
      name: "$15 Off",
      description: "Redeem 300 points",
      discount: 15,
      pointsCost: 300,
      available: payload.currentPoints >= 300,
      requiresPoints: true,
    },
    {
      id: "first-time",
      name: "First Time Guest",
      description: "10% off (max $10)",
      discount: roundCurrency(Math.min(payload.totalBeforeSelectedDiscount * 0.1, 10)),
      available: payload.currentTier === "silver" && payload.currentPoints === 0,
      requiresPoints: false,
    },
    {
      id: "referral",
      name: "Referral Bonus",
      description: "$8 off your order",
      discount: 8,
      available: payload.referralEligible ?? false,
      requiresPoints: false,
    },
  ];
}

export function buildOrderLineItems(
  menuItems: Array<{
    id: string;
    price: unknown;
    inventoryItem: {
      stockOnHand: number;
      reorderPoint: number;
      ingredientName: string;
      expiresInHours: number | null;
    } | null;
  }>,
  requestedItems: Array<{ menuItemId: string; quantity: number }>,
): OrderLineItem[] {
  const itemMap = new Map(menuItems.map((item) => [item.id, item]));

  return requestedItems.map((item) => {
    const menuItem = itemMap.get(item.menuItemId)!;
    const unitPrice = getEffectiveMenuPrice({
      name: "",
      price: menuItem.price,
      inventoryItem: menuItem.inventoryItem,
    });
    const lineTotal = unitPrice * item.quantity;
    const promotion = getMenuPromotion({
      name: "",
      price: menuItem.price,
      inventoryItem: menuItem.inventoryItem,
    });

    return {
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      discountPercent: promotion?.discountPercentage ?? 0,
    };
  });
}

export function calculateOrderPricing(payload: {
  lineItems: OrderLineItem[];
  birthdayDiscountPercent: 0 | 5 | 10 | 15;
  selectedDiscount: SelectedDiscount;
}) {
  const subtotal = roundCurrency(
    payload.lineItems.reduce((sum, item) => sum + item.lineTotal, 0),
  );
  const birthdayDiscountAmount = roundCurrency(
    subtotal * (payload.birthdayDiscountPercent / 100),
  );
  const subtotalAfterBirthdayDiscount = roundCurrency(subtotal - birthdayDiscountAmount);
  const taxAmount = roundCurrency(subtotalAfterBirthdayDiscount * 0.1);
  const totalBeforeSelectedDiscount = roundCurrency(
    subtotalAfterBirthdayDiscount + taxAmount,
  );
  const totalAmount = roundCurrency(
    Math.max(0, totalBeforeSelectedDiscount - payload.selectedDiscount.amount),
  );
  const discountAmount = roundCurrency(
    birthdayDiscountAmount + payload.selectedDiscount.amount,
  );

  return {
    subtotal,
    birthdayDiscountAmount,
    subtotalAfterBirthdayDiscount,
    taxAmount,
    totalBeforeSelectedDiscount,
    totalAmount,
    discountAmount,
  };
}
