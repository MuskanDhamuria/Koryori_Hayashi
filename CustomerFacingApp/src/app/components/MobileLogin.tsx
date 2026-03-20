import { useEffect, useState } from "react";
import { ArrowRight, Phone, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { fetchQuickAccessProfiles, type CustomerProfile } from "../services/api";
import { QUICK_ACCESS_NUMBERS } from "../lib/customerProfiles";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { SeigaihaPattern } from "./JapanesePattern";

interface MobileLoginProps {
  onLogin: (phoneNumber: string) => Promise<void> | void;
}

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
  const [quickAccessProfiles, setQuickAccessProfiles] = useState<CustomerProfile[]>([]);

  useEffect(() => {
    const loadQuickAccessProfiles = async () => {
      try {
        const profiles = await fetchQuickAccessProfiles([...QUICK_ACCESS_NUMBERS]);
        const profileMap = new Map(profiles.map((profile) => [profile.phoneNumber, profile]));
        setQuickAccessProfiles(
          QUICK_ACCESS_NUMBERS.map((phone) => profileMap.get(phone)).filter(
            (profile): profile is CustomerProfile => Boolean(profile),
          ),
        );
      } catch {
        setQuickAccessProfiles([]);
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
    <div className="relative min-h-screen overflow-hidden px-3 py-4 sm:px-4 sm:py-8 lg:px-8">
      <SeigaihaPattern />
      <div className="pointer-events-none absolute left-[-8rem] top-[-8rem] h-48 w-48 rounded-full bg-[color:var(--gold)]/15 blur-3xl sm:left-[-6rem] sm:top-[-6rem] sm:h-56 sm:w-56" />
      <div className="pointer-events-none absolute bottom-[-8rem] right-[-6rem] h-56 w-56 rounded-full bg-[color:var(--olive)]/16 blur-3xl sm:bottom-[-7rem] sm:right-[-4rem] sm:h-64 sm:w-64" />

      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <Card className="paper-panel relative w-full gap-0 overflow-hidden rounded-3xl border-[color:var(--border)] sm:rounded-[36px]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(196,163,91,0.08),transparent)] sm:h-28" />
          <div className="pointer-events-none absolute right-[-5rem] top-[-4rem] h-32 w-32 rounded-full bg-[color:var(--gold)]/12 blur-3xl sm:right-[-4rem] sm:top-[-3rem] sm:h-40 sm:w-40" />

          <div className="relative p-4 sm:p-6 lg:p-10">
            <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--ink)] text-[color:var(--gold)] shadow-[0_12px_32px_rgba(40,52,90,0.16)] sm:h-16 sm:w-16 sm:rounded-[20px] sm:shadow-[0_16px_40px_rgba(40,52,90,0.18)]">
                  <UtensilsCrossed className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="menu-kicker mb-0.5 text-xs sm:mb-1 sm:text-sm">Koryori Hayashi</p>
                  <h1 className="menu-title text-3xl leading-none sm:text-4xl lg:text-5xl">Welcome Back</h1>
                </div>
              </div>

              <div className="stamp-badge inline-flex w-fit items-center rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-[color:var(--ink)] sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.16em]">
                Lunch Menu
              </div>
            </div>

            <div className="menu-rule mb-6 sm:mb-8" />

            <div className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:items-start">
              <div>
                <div className="mb-6 sm:mb-8">
                  <p className="menu-kicker mb-1.5 text-xs sm:mb-2 sm:text-sm">Customer Sign In</p>
                  <h2 className="menu-title text-2xl leading-none sm:text-3xl lg:text-4xl">Enter your mobile number</h2>
                  <p className="mt-2 max-w-lg text-xs leading-5 text-[color:var(--ink-soft)] sm:mt-3 sm:text-sm sm:leading-6">
                    Sign in to continue to your table&apos;s menu and saved favourites.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label htmlFor="phone" className="menu-kicker block text-xs sm:text-sm">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--ink-soft)] sm:left-4" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+65 8123 4567"
                        value={phoneNumber}
                        onChange={(event) => setPhoneNumber(event.target.value)}
                        className="h-12 rounded-full border-[color:var(--border)] bg-white/78 pl-10 pr-4 text-sm text-[color:var(--ink)] shadow-[0_6px_24px_rgba(40,52,90,0.04)] focus-visible:border-[color:var(--gold)] focus-visible:ring-[color:var(--gold)]/25 sm:h-14 sm:pl-12 sm:text-base sm:shadow-[0_8px_30px_rgba(40,52,90,0.05)]"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 w-full rounded-full bg-[color:var(--ink)] text-sm text-[color:var(--paper)] shadow-[0_14px_32px_rgba(40,52,90,0.16)] transition-all hover:bg-[color:var(--ink)]/92 sm:h-14 sm:text-base sm:shadow-[0_18px_38px_rgba(40,52,90,0.18)]"
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

              <div className="rounded-3xl border border-[color:var(--border)] bg-white/58 p-4 sm:rounded-[28px] sm:p-5 lg:p-6">
                <div className="mb-4 sm:mb-5">
                  <p className="menu-kicker mb-1.5 text-xs sm:mb-2 sm:text-sm">Quick Access</p>
                  <h3 className="menu-title text-2xl text-[color:var(--ink)] sm:text-3xl">Regular Guests</h3>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  {isQuickAccessLoading
                    ? Array.from({ length: 3 }, (_, index) => (
                        <div
                          key={`quick-access-skeleton-${index}`}
                          className="flex h-[72px] items-center justify-between rounded-2xl border border-[color:var(--border)] bg-white/70 px-3 py-2.5 sm:h-[82px] sm:rounded-[24px] sm:px-4 sm:py-3"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <Skeleton className="h-9 w-9 rounded-full bg-[color:var(--paper-strong)] sm:h-10 sm:w-10" />
                            <div className="space-y-1.5 sm:space-y-2">
                              <Skeleton className="h-2.5 w-20 bg-[color:var(--paper-strong)] sm:h-3 sm:w-24" />
                              <Skeleton className="h-2.5 w-28 bg-[color:var(--paper-strong)] sm:h-3 sm:w-32" />
                            </div>
                          </div>
                          <div className="space-y-1.5 text-right sm:space-y-2">
                            <Skeleton className="ml-auto h-4 w-14 bg-[color:var(--paper-strong)] sm:h-5 sm:w-16" />
                            <Skeleton className="ml-auto h-2.5 w-10 bg-[color:var(--paper-strong)] sm:h-3 sm:w-12" />
                          </div>
                        </div>
                      ))
                    : quickAccessProfiles.length > 0
                      ? quickAccessProfiles.map((profile) => {
                        const tier = profile.loyaltyProfile?.tier ?? "silver";
                        const points = profile.loyaltyProfile?.points ?? 0;

                        return (
                          <Button
                            key={profile.phoneNumber}
                            type="button"
                            variant="outline"
                            disabled={isLoading}
                            className="h-auto w-full rounded-2xl border-[color:var(--border)] bg-white/72 px-3 py-2.5 transition-all hover:border-[color:var(--gold)]/60 hover:bg-white/88 sm:rounded-[24px] sm:px-4 sm:py-3"
                            onClick={() => void handleQuickLogin(profile.phoneNumber ?? "")}
                          >
                            <div className="flex w-full items-center justify-between gap-2 sm:gap-3">
                              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--ink)]/7 text-xs font-semibold text-[color:var(--ink)] sm:h-11 sm:w-11 sm:text-sm">
                                  {getTierLabel(tier)}
                                </div>
                                <div className="min-w-0 text-left">
                                  <div className="truncate text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--ink)] sm:text-sm sm:tracking-[0.12em]">
                                    {profile.fullName}
                                  </div>
                                  <div className="truncate text-[11px] text-[color:var(--ink-soft)] sm:text-xs">
                                    {profile.phoneNumber}
                                  </div>
                                </div>
                              </div>
                              <div className="flex shrink-0 flex-col items-end gap-0.5 sm:gap-1">
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.16em] ${getTierBadgeClasses(tier)}`}
                                >
                                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                                </span>
                                <span className="text-[10px] text-[color:var(--ink-soft)] sm:text-[11px]">
                                  {points} pts
                                </span>
                              </div>
                            </div>
                          </Button>
                        );
                      })
                      : (
                        <div className="rounded-2xl border border-[color:var(--border)] bg-white/60 px-3 py-4 text-xs text-[color:var(--ink-soft)] sm:rounded-[24px] sm:px-4 sm:py-5 sm:text-sm">
                          No quick-access guests were returned by the backend.
                        </div>
                      )}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-[color:var(--border)] bg-white/52 px-3 py-2.5 sm:mt-8 sm:rounded-[24px] sm:px-4 sm:py-3">
              <p className="text-center text-[11px] leading-5 text-[color:var(--ink-soft)] sm:text-xs sm:leading-6">
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
