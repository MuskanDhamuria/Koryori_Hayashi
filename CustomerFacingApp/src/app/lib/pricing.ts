import type { CartItem } from "../types";
import type { LoyaltyProfile } from "../components/LoyaltyCard";

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

export interface PricingBreakdown {
  subtotal: number;
  birthdayDiscountPercent: number;
  birthdayDiscountAmount: number;
  subtotalAfterBirthdayDiscount: number;
  taxAmount: number;
  totalBeforeSelectedDiscount: number;
  selectedDiscountId: DiscountId | null;
  selectedDiscountAmount: number;
  selectedDiscountPointsCost: number;
  finalTotal: number;
  pointsMultiplier: number;
  pointsEarned: number;
  projectedPointsBalance: number;
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2));
}

export function getTierMultiplier(tier: LoyaltyProfile["tier"]) {
  if (tier === "platinum") {
    return 2;
  }

  if (tier === "gold") {
    return 1.5;
  }

  return 1;
}

export function getBirthdayDiscountPercent(profile: LoyaltyProfile) {
  if (!profile.isBirthday) {
    return 0;
  }

  if (profile.tier === "platinum") {
    return 15;
  }

  if (profile.tier === "gold") {
    return 10;
  }

  return 5;
}

export function getAvailableDiscounts(
  profile: LoyaltyProfile,
  totalBeforeSelectedDiscount: number,
): AvailableDiscount[] {
  return [
    {
      id: "points-5",
      name: "$5 Off",
      description: "Redeem 100 points",
      discount: 5,
      pointsCost: 100,
      available: profile.points >= 100,
      requiresPoints: true,
    },
    {
      id: "points-10",
      name: "$10 Off",
      description: "Redeem 200 points",
      discount: 10,
      pointsCost: 200,
      available: profile.points >= 200,
      requiresPoints: true,
    },
    {
      id: "points-15",
      name: "$15 Off",
      description: "Redeem 300 points",
      discount: 15,
      pointsCost: 300,
      available: profile.points >= 300,
      requiresPoints: true,
    },
    {
      id: "first-time",
      name: "First Time Guest",
      description: "10% off (max $10)",
      discount: roundCurrency(Math.min(totalBeforeSelectedDiscount * 0.1, 10)),
      available: profile.tier === "silver" && profile.points === 0,
      requiresPoints: false,
    },
    {
      id: "referral",
      name: "Referral Bonus",
      description: "$8 off your order",
      discount: 8,
      available: false,
      requiresPoints: false,
    },
  ];
}

export function calculatePricing(
  subtotal: number,
  profile: LoyaltyProfile,
  selectedDiscountId: DiscountId | null = null,
): PricingBreakdown {
  const birthdayDiscountPercent = getBirthdayDiscountPercent(profile);
  const birthdayDiscountAmount = roundCurrency(
    subtotal * (birthdayDiscountPercent / 100),
  );
  const subtotalAfterBirthdayDiscount = roundCurrency(
    subtotal - birthdayDiscountAmount,
  );
  const taxAmount = roundCurrency(subtotalAfterBirthdayDiscount * 0.1);
  const totalBeforeSelectedDiscount = roundCurrency(
    subtotalAfterBirthdayDiscount + taxAmount,
  );
  const availableDiscounts = getAvailableDiscounts(
    profile,
    totalBeforeSelectedDiscount,
  );
  const selectedDiscount = availableDiscounts.find(
    (discount) =>
      discount.id === selectedDiscountId && discount.available,
  );
  const selectedDiscountAmount = selectedDiscount?.discount ?? 0;
  const selectedDiscountPointsCost = selectedDiscount?.pointsCost ?? 0;
  const finalTotal = roundCurrency(
    Math.max(0, totalBeforeSelectedDiscount - selectedDiscountAmount),
  );
  const pointsMultiplier = getTierMultiplier(profile.tier);
  const pointsEarned = Math.floor(finalTotal * pointsMultiplier);
  const projectedPointsBalance =
    profile.points - selectedDiscountPointsCost + pointsEarned;

  return {
    subtotal: roundCurrency(subtotal),
    birthdayDiscountPercent,
    birthdayDiscountAmount,
    subtotalAfterBirthdayDiscount,
    taxAmount,
    totalBeforeSelectedDiscount,
    selectedDiscountId: selectedDiscount?.id ?? null,
    selectedDiscountAmount,
    selectedDiscountPointsCost,
    finalTotal,
    pointsMultiplier,
    pointsEarned,
    projectedPointsBalance,
  };
}

export function calculateCartSubtotal(items: CartItem[]) {
  return roundCurrency(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
}
