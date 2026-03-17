import { useEffect, useState } from "react";
import { ArrowRight, Phone, UtensilsCrossed } from "lucide-react";
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
import { SeigaihaPattern } from "./JapanesePattern";

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
    return "border-[color:var(--ink)] bg-[color:var(--ink)] text-[color:var(--paper)]";
  }

  if (tier === "gold") {
    return "border-[color:var(--gold)] bg-[color:var(--gold)] text-[color:var(--ink)]";
  }

  return "border-[color:var(--border)] bg-white/70 text-[color:var(--ink-soft)]";
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
      toast.success("Welcome back");
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
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <SeigaihaPattern />
      <div className="pointer-events-none absolute left-[-6rem] top-[-6rem] h-56 w-56 rounded-full bg-[color:var(--gold)]/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-7rem] right-[-4rem] h-64 w-64 rounded-full bg-[color:var(--olive)]/16 blur-3xl" />

      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <Card className="paper-panel relative w-full gap-0 overflow-hidden rounded-[36px] border-[color:var(--border)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,rgba(196,163,91,0.08),transparent)]" />
          <div className="pointer-events-none absolute right-[-4rem] top-[-3rem] h-40 w-40 rounded-full bg-[color:var(--gold)]/12 blur-3xl" />

          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[color:var(--ink)] text-[color:var(--gold)] shadow-[0_16px_40px_rgba(40,52,90,0.18)]">
                  <UtensilsCrossed className="h-8 w-8" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="menu-kicker mb-1">Koryori Hayashi</p>
                  <h1 className="menu-title text-5xl leading-none">Welcome Back</h1>
                </div>
              </div>

              <div className="stamp-badge inline-flex w-fit items-center rounded-full px-4 py-2 text-xs uppercase tracking-[0.16em] text-[color:var(--ink)]">
                Lunch Menu
              </div>
            </div>

            <div className="menu-rule mb-8" />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
              <div>
                <div className="mb-8">
                  <p className="menu-kicker mb-2">Customer Sign In</p>
                  <h2 className="menu-title text-4xl leading-none">Enter your mobile number</h2>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-[color:var(--ink-soft)]">
                    Sign in to continue to your table&apos;s menu and saved favourites.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="phone" className="menu-kicker block">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-soft)]" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+65 8123 4567"
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        className="h-14 rounded-full border-[color:var(--border)] bg-white/78 pl-12 pr-4 text-[color:var(--ink)] shadow-[0_8px_30px_rgba(40,52,90,0.05)] focus-visible:border-[color:var(--gold)] focus-visible:ring-[color:var(--gold)]/25"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-14 w-full rounded-full bg-[color:var(--ink)] text-[color:var(--paper)] shadow-[0_18px_38px_rgba(40,52,90,0.18)] transition-all hover:bg-[color:var(--ink)]/92"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                        Signing in
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Continue to Menu
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </div>

              <div className="rounded-[28px] border border-[color:var(--border)] bg-white/58 p-5 sm:p-6">
                <div className="mb-5">
                  <p className="menu-kicker mb-2">Quick Access</p>
                  <h3 className="menu-title text-3xl text-[color:var(--ink)]">Regular Guests</h3>
                </div>

                <div className="space-y-3">
                  {isQuickAccessLoading
                    ? Array.from({ length: 3 }, (_, index) => (
                        <div
                          key={`quick-access-skeleton-${index}`}
                          className="flex h-[82px] items-center justify-between rounded-[24px] border border-[color:var(--border)] bg-white/70 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full bg-[color:var(--paper-strong)]" />
                            <div className="space-y-2">
                              <Skeleton className="h-3 w-24 bg-[color:var(--paper-strong)]" />
                              <Skeleton className="h-3 w-32 bg-[color:var(--paper-strong)]" />
                            </div>
                          </div>
                          <div className="space-y-2 text-right">
                            <Skeleton className="ml-auto h-5 w-16 bg-[color:var(--paper-strong)]" />
                            <Skeleton className="ml-auto h-3 w-12 bg-[color:var(--paper-strong)]" />
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
                            className="h-auto w-full rounded-[24px] border-[color:var(--border)] bg-white/72 px-4 py-3 transition-all hover:border-[color:var(--gold)]/60 hover:bg-white/88"
                            onClick={() => void handleQuickLogin(profile.phoneNumber ?? "")}
                          >
                            <div className="flex w-full items-center justify-between gap-3">
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--ink)]/7 text-sm font-semibold text-[color:var(--ink)]">
                                  {getTierLabel(tier)}
                                </div>
                                <div className="min-w-0 text-left">
                                  <div className="truncate text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--ink)]">
                                    {profile.fullName}
                                  </div>
                                  <div className="truncate text-xs text-[color:var(--ink-soft)]">
                                    {profile.phoneNumber}
                                  </div>
                                </div>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-1">
                                <span
                                  className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${getTierBadgeClasses(tier)}`}
                                >
                                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                </span>
                                <span className="text-[11px] text-[color:var(--ink-soft)]">
                                  {points} pts
                                </span>
                              </div>
                            </div>
                          </Button>
                        );
                      })}
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-[24px] border border-[color:var(--border)] bg-white/52 px-4 py-3">
              <p className="text-center text-xs leading-6 text-[color:var(--ink-soft)]">
                By continuing, you agree to our <span className="font-semibold text-[color:var(--ink)]">Terms</span>{" "}
                and <span className="font-semibold text-[color:var(--ink)]">Privacy Policy</span>.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
