export type LoyaltyTier = "silver" | "gold" | "platinum";

type DemoCustomerMetadata = {
  fullName: string;
  isBirthday: boolean;
  referralCode?: string;
};

const DEMO_CUSTOMERS: Record<string, DemoCustomerMetadata> = {
  "+1 (555) 123-4567": {
    fullName: "Yuki Tanaka",
    isBirthday: true,
    referralCode: "YUKI2026",
  },
  "+1 (555) 987-6543": {
    fullName: "Akira Sato",
    isBirthday: false,
    referralCode: "AKIRA2026",
  },
  "+1 (555) 555-5555": {
    fullName: "New Customer",
    isBirthday: false,
    referralCode: "WELCOME2026",
  },
};

const DEFAULT_METADATA: DemoCustomerMetadata = {
  fullName: "Guest",
  isBirthday: false,
};

export function normalizeTier(tier: string | null | undefined): LoyaltyTier {
  if (tier === "platinum" || tier === "gold") {
    return tier;
  }

  return "silver";
}

export function getDemoCustomerMetadata(phoneNumber: string | null | undefined): DemoCustomerMetadata {
  if (!phoneNumber) {
    return DEFAULT_METADATA;
  }

  return DEMO_CUSTOMERS[phoneNumber] ?? DEFAULT_METADATA;
}

function fnv1a32(input: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function generateReferralCode(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  const tail = digits.slice(-6).padStart(6, "0");
  const hash = fnv1a32(phoneNumber).toString(36).toUpperCase().slice(-4).padStart(4, "0");
  return `KH${tail}${hash}`.toUpperCase();
}

export function resolveCustomerMetadata(payload: {
  phoneNumber?: string | null;
  fullName?: string | null;
  referralCode?: string | null;
}) {
  const demo = getDemoCustomerMetadata(payload.phoneNumber);
  const referralFromPayload = payload.referralCode?.trim();
  const referralFromDemo = demo.referralCode?.trim();
  const referralFromPhone = payload.phoneNumber ? generateReferralCode(payload.phoneNumber) : null;

  return {
    fullName: payload.fullName?.trim() || demo.fullName,
    isBirthday: demo.isBirthday,
    referralCode: referralFromPayload || referralFromDemo || referralFromPhone,
  };
}

export function getBirthdayDiscountPercent(tier: LoyaltyTier, isBirthday: boolean) {
  if (!isBirthday) {
    return 0 as const;
  }

  if (tier === "platinum") {
    return 15 as const;
  }

  if (tier === "gold") {
    return 10 as const;
  }

  return 5 as const;
}
