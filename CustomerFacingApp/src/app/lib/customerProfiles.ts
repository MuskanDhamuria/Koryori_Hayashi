export const QUICK_ACCESS_NUMBERS = [
  "+1 (555) 123-4567",
  "+1 (555) 987-6543",
  "+1 (555) 555-5555",
] as const;

export function getFallbackCustomerName(phoneNumber: string): string {
  return phoneNumber.trim() ? "Guest" : "Guest";
}
