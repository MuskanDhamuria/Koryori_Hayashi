export interface FallbackLoyaltyProfile {
  tier: "silver" | "gold" | "platinum";
  points: number;
  name: string;
  isBirthday: boolean;
  referralCode: string;
}

export interface FallbackCustomerProfile {
  phoneNumber: string;
  fullName: string;
  loyaltyProfile: FallbackLoyaltyProfile;
}

export const QUICK_ACCESS_NUMBERS = [
  "+1 (555) 123-4567",
  "+1 (555) 987-6543",
  "+1 (555) 555-5555",
] as const;

const FALLBACK_CUSTOMER_PROFILES: FallbackCustomerProfile[] = [
  {
    phoneNumber: QUICK_ACCESS_NUMBERS[0],
    fullName: "Yuki Tanaka",
    loyaltyProfile: {
      tier: "gold",
      points: 850,
      name: "Yuki Tanaka",
      isBirthday: true,
      referralCode: "YUKI2026",
    },
  },
  {
    phoneNumber: QUICK_ACCESS_NUMBERS[1],
    fullName: "Akira Sato",
    loyaltyProfile: {
      tier: "platinum",
      points: 2100,
      name: "Akira Sato",
      isBirthday: false,
      referralCode: "AKIRA2026",
    },
  },
  {
    phoneNumber: QUICK_ACCESS_NUMBERS[2],
    fullName: "New Customer",
    loyaltyProfile: {
      tier: "silver",
      points: 0,
      name: "New Customer",
      isBirthday: false,
      referralCode: "WELCOME2026",
    },
  },
];

export function getFallbackCustomerProfile(phoneNumber: string): FallbackCustomerProfile {
  return (
    FALLBACK_CUSTOMER_PROFILES.find((profile) => profile.phoneNumber === phoneNumber) ?? {
      phoneNumber,
      fullName: "Guest",
      loyaltyProfile: {
        tier: "silver",
        points: 0,
        name: "Guest",
        isBirthday: false,
        referralCode: "WELCOME2026",
      },
    }
  );
}

export function getQuickAccessFallbackProfiles(): FallbackCustomerProfile[] {
  return [...FALLBACK_CUSTOMER_PROFILES];
}

export function getFallbackCustomerName(phoneNumber: string): string {
  return getFallbackCustomerProfile(phoneNumber).fullName;
}
