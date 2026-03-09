import type { MenuItem } from "@prisma/client";

export interface SelectedDiscount {
  amount: number;
  pointsCost: number;
}

export interface OrderLineItem {
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
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

export function getSelectedDiscount(payload: {
  selectedDiscountId?: "points-5" | "points-10" | "points-15" | "first-time" | "referral" | null;
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

export function buildOrderLineItems(
  menuItems: MenuItem[],
  requestedItems: Array<{ menuItemId: string; quantity: number }>,
): OrderLineItem[] {
  const itemMap = new Map<string, MenuItem>(menuItems.map((item) => [item.id, item]));

  return requestedItems.map((item) => {
    const menuItem = itemMap.get(item.menuItemId)!;
    const unitPrice = Number(menuItem.price);
    const lineTotal = unitPrice * item.quantity;

    return {
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
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
