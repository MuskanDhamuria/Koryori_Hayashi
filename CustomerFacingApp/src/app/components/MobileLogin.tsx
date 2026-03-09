import { useEffect, useState } from "react";
import { UtensilsCrossed, Phone, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { fetchQuickAccessProfiles, type CustomerProfile } from "../services/api";
import {
  getQuickAccessFallbackProfiles,
  QUICK_ACCESS_NUMBERS,
} from "../lib/customerProfiles";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";

interface MobileLoginProps {
  onLogin: (phoneNumber: string) => Promise<void> | void;
}

const FALLBACK_PROFILES: CustomerProfile[] = getQuickAccessFallbackProfiles().map((profile) => ({
  phoneNumber: profile.phoneNumber,
  fullName: profile.fullName,
  flavorProfile: null,
  loyaltyProfile: profile.loyaltyProfile,
}));

function getTierBadgeClasses(tier: string) {
  if (tier === "platinum") {
    return "bg-[#0F1729] text-[#D4AF37]";
  }

  if (tier === "gold") {
    return "bg-[#D4AF37] text-white";
  }

  return "bg-[#F3F4F6] text-[#6B7280]";
}

function getTierLabel(tier: string) {
  if (tier === "platinum") {
    return "P";
  }

  if (tier === "gold") {
    return "G";
  }

  return "S";
}

export function MobileLogin({ onLogin }: MobileLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickAccessLoading, setIsQuickAccessLoading] = useState(true);
  const [quickAccessProfiles, setQuickAccessProfiles] = useState<CustomerProfile[]>(FALLBACK_PROFILES);

  useEffect(() => {
    const loadQuickAccessProfiles = async () => {
      try {
        const profiles = await fetchQuickAccessProfiles([...QUICK_ACCESS_NUMBERS]);
        if (profiles.length > 0) {
          const profileMap = new Map(
            profiles.map((profile) => [profile.phoneNumber, profile]),
          );
          setQuickAccessProfiles(
            QUICK_ACCESS_NUMBERS.map(
              (phone) =>
                profileMap.get(phone) ??
                FALLBACK_PROFILES.find((profile) => profile.phoneNumber === phone)!,
            ),
          );
        }
      } catch {
        setQuickAccessProfiles(FALLBACK_PROFILES);
      } finally {
        setIsQuickAccessLoading(false);
      }
    };

    void loadQuickAccessProfiles();
  }, []);

  const handleLoginAttempt = async (nextPhoneNumber: string) => {
    if (!nextPhoneNumber || nextPhoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);

    try {
      await onLogin(nextPhoneNumber);
      toast.success("Welcome back!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await handleLoginAttempt(phoneNumber);
  };

  const handleQuickLogin = async (number: string) => {
    setPhoneNumber(number);
    await handleLoginAttempt(number);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#0A0E1A] via-[#0F1729] to-[#1A2642] p-6">
      <div
        className="fixed inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <Card className="relative w-full max-w-md bg-white shadow-2xl">
        <div className="p-10">
          <div className="mb-10 text-center">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#0F1729] to-[#2D3E5F] shadow-lg">
                <UtensilsCrossed className="h-8 w-8 text-[#D4AF37]" strokeWidth={2} />
              </div>
            </div>

            <h1 className="mb-2 text-4xl font-bold tracking-tight text-[#0F1729]">
              Koryori Hayashi
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm text-[#6B7280]">
              <span>Welcome!</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-[#0F1729]">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6B7280]" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  className="h-12 border-2 border-[#E5E7EB] pl-11 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full bg-[#0F1729] text-white shadow-md transition-all hover:bg-[#1A2642]"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-xs uppercase text-[#6B7280]">
                Quick Access
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {isQuickAccessLoading
              ? Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={`quick-access-skeleton-${index}`}
                    className="flex h-[72px] items-center justify-between rounded-lg border-2 border-[#E5E7EB] px-3 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full bg-[#F3F4F6]" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-24 bg-[#F3F4F6]" />
                        <Skeleton className="h-3 w-32 bg-[#F3F4F6]" />
                      </div>
                    </div>
                    <div className="space-y-2 text-right">
                      <Skeleton className="ml-auto h-5 w-16 bg-[#F3F4F6]" />
                      <Skeleton className="ml-auto h-3 w-12 bg-[#F3F4F6]" />
                    </div>
                  </div>
                ))
              : quickAccessProfiles.map((profile) => {
                  const tier = profile.loyaltyProfile?.tier ?? "silver";
                  const points = profile.loyaltyProfile?.points ?? 0;

                  return (
                    <Button
                      key={profile.phoneNumber}
                      type="button"
                      variant="outline"
                      disabled={isLoading}
                      className="h-auto w-full border-2 px-2 py-3 transition-all hover:bg-[#E5E7EB] sm:px-3"
                      onClick={() => void handleQuickLogin(profile.phoneNumber ?? "")}
                    >
                      <div className="flex w-full items-center justify-between gap-1 sm:gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-sm font-semibold text-[#0F1729] sm:h-10 sm:w-10">
                            {getTierLabel(tier)}
                          </div>
                          <div className="min-w-0 text-left">
                            <div className="truncate text-xs font-semibold text-[#0F1729] sm:text-sm">
                              {profile.fullName}
                            </div>
                            <div className="truncate text-[10px] text-[#6B7280] sm:text-xs">
                              {profile.phoneNumber}
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1 sm:gap-1">
                          <span
                            className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:py-1 sm:text-xs ${getTierBadgeClasses(tier)}`}
                          >
                            {tier.charAt(0).toUpperCase() + tier.slice(1)}
                          </span>
                          <span className="whitespace-nowrap text-[10px] text-[#6B7280] sm:text-xs">
                            {points} pts
                          </span>
                        </div>
                      </div>
                    </Button>
                  );
                })}
          </div>

          <div className="mt-8 border-t border-[#E5E7EB] pt-6">
            <p className="text-center text-xs text-[#6B7280]">
              By continuing, you agree to our <span className="font-medium text-[#0F1729]">Terms</span> and{" "}
              <span className="font-medium text-[#0F1729]">Privacy Policy</span>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
