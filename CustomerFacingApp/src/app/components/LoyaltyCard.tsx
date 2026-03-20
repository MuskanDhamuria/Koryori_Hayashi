import { Gift, Sparkles, Star, Users } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Progress } from "./ui/progress";

export type LoyaltyTier = "silver" | "gold" | "platinum";

export interface LoyaltyProfile {
  tier: LoyaltyTier;
  points: number;
  name: string;
  isBirthday: boolean;
  referralCode: string;
}

interface LoyaltyCardProps {
  profile: LoyaltyProfile;
}

const TIER_CONFIG = {
  silver: {
    name: "Silver",
    panel: "from-[#f7f4ef] to-[#ebe5dc]",
    text: "text-[color:var(--ink)]",
    badge: "bg-white/75 text-[color:var(--ink)] border-[color:var(--border)]",
    pointsRequired: 0,
    nextTier: 500,
    benefits: [
      "Earn 1 point per $1 spent",
      "5% birthday discount",
      "Early access to seasonal menu",
    ],
  },
  gold: {
    name: "Gold",
    panel: "from-[#f5e8c4] to-[#e3c17f]",
    text: "text-[color:var(--ink)]",
    badge: "bg-[color:var(--gold)]/16 text-[color:var(--ink)] border-[color:var(--gold)]/35",
    pointsRequired: 500,
    nextTier: 1500,
    benefits: [
      "Earn 1.5 points per $1 spent",
      "10% birthday discount",
      "Free appetizer on birthday",
      "Priority seating",
    ],
  },
  platinum: {
    name: "Platinum",
    panel: "from-[#384562] to-[#28345a]",
    text: "text-[color:var(--paper)]",
    badge: "bg-white/12 text-[color:var(--paper)] border-white/10",
    pointsRequired: 1500,
    nextTier: null,
    benefits: [
      "Earn 2 points per $1 spent",
      "15% birthday discount",
      "Free meal on birthday",
      "Exclusive VIP events",
      "Personal chef recommendations",
    ],
  },
};

export function LoyaltyCard({ profile }: LoyaltyCardProps) {
  const tierConfig = TIER_CONFIG[profile.tier];
  const nextTier = tierConfig.nextTier;
  const progressToNext = nextTier
    ? ((profile.points - tierConfig.pointsRequired) / (nextTier - tierConfig.pointsRequired)) * 100
    : 100;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="paper-panel relative cursor-pointer overflow-hidden rounded-3xl border-[color:var(--border)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_56px_rgba(40,52,90,0.1)] sm:rounded-[30px]">
          <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-r ${tierConfig.panel} opacity-90 sm:h-24`} />
          <div className="relative p-4 sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4 sm:gap-4">
              <div>
                <p className="menu-kicker mb-1.5 text-xs sm:mb-2 sm:text-sm">Member Profile</p>
                <div className="flex items-center gap-2">
                  <Badge className={`rounded-full border text-xs ${tierConfig.badge}`}>
                    {tierConfig.name}
                  </Badge>
                </div>
                <p className="mt-2.5 text-xs text-[color:var(--ink-soft)] sm:mt-3 sm:text-sm">Hello, {profile.name}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-[color:var(--ink)]">
                  <Star className="h-4 w-4 fill-[color:var(--gold)] text-[color:var(--gold)] sm:h-5 sm:w-5" />
                  <span className="text-xl font-bold sm:text-2xl">{profile.points}</span>
                </div>
                <p className="text-[10px] text-[color:var(--ink-soft)] sm:text-xs">Points</p>
              </div>
            </div>

            {profile.isBirthday ? (
              <div className="mb-3 flex items-center gap-2 rounded-2xl border border-[color:var(--rose)]/25 bg-[color:var(--rose)]/12 px-3 py-2.5 sm:mb-4 sm:rounded-[20px] sm:px-4 sm:py-3">
                <Gift className="h-3.5 w-3.5 shrink-0 text-[color:var(--rose)] sm:h-4 sm:w-4" />
                <p className="text-xs font-semibold text-[color:var(--rose)] sm:text-sm">
                  Birthday special is active for this visit.
                </p>
              </div>
            ) : null}

            {nextTier ? (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-[color:var(--ink-soft)] sm:text-xs">
                  <span>Next tier: {TIER_CONFIG[profile.tier === "silver" ? "gold" : "platinum"].name}</span>
                  <span>{nextTier - profile.points} points to go</span>
                </div>
                <Progress value={progressToNext} className="h-1.5 sm:h-2" />
              </div>
            ) : null}

            <div className="mt-3 flex items-center justify-between border-t border-[color:var(--border)] pt-3 sm:mt-4 sm:pt-4">
              <div className="flex items-center gap-1 text-[10px] text-[color:var(--ink-soft)] sm:text-xs">
                <Users className="h-3 w-3" />
                <span>Referral: {profile.referralCode}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-auto rounded-full px-2.5 py-1 text-[10px] sm:px-3 sm:text-xs">
                View Details
              </Button>
            </div>
          </div>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto border-[color:var(--border)] bg-[color:var(--popover)] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="menu-title flex items-center gap-2 text-2xl text-[color:var(--ink)] sm:text-3xl lg:text-4xl">
            <Sparkles className="h-5 w-5 text-[color:var(--gold)] sm:h-6 sm:w-6" />
            Loyalty Program
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          <Card className={`overflow-hidden border-[color:var(--border)] bg-gradient-to-r ${tierConfig.panel} p-4 ${tierConfig.text} sm:p-6`}>
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge className={`rounded-full border text-xs sm:text-sm ${tierConfig.badge}`}>
                    {tierConfig.name} Member
                  </Badge>
                </div>
                <h3 className="menu-title text-2xl sm:text-3xl lg:text-4xl">Current Status</h3>
                <p className="mt-2 text-xs opacity-78 sm:text-sm">{profile.name}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold sm:text-3xl lg:text-4xl">{profile.points}</div>
                <p className="text-xs opacity-78 sm:text-sm">Points</p>
              </div>
            </div>

            {nextTier ? (
              <div className="rounded-2xl border border-white/14 bg-white/12 p-2.5 backdrop-blur-sm sm:rounded-[20px] sm:p-3">
                <p className="mb-2 text-xs opacity-82 sm:text-sm">
                  {nextTier - profile.points} points until {TIER_CONFIG[profile.tier === "silver" ? "gold" : "platinum"].name}
                </p>
                <Progress value={progressToNext} className="h-1.5 bg-white/30 sm:h-2" />
              </div>
            ) : null}
          </Card>

          <Card className="paper-panel rounded-3xl border-[color:var(--border)] sm:rounded-[28px]">
            <div className="p-4 sm:p-6">
              <div className="mb-2.5 flex items-center gap-2 sm:mb-3">
                <Users className="h-4 w-4 text-[color:var(--gold)] sm:h-5 sm:w-5" />
                <h4 className="menu-title text-2xl text-[color:var(--ink)] sm:text-3xl">Refer a Friend</h4>
              </div>
              <p className="mb-2.5 text-xs leading-5 text-[color:var(--ink-soft)] sm:mb-3 sm:text-sm sm:leading-6">
                Share your referral code and both of you get 100 bonus points!
              </p>
              <div className="rounded-2xl border border-dashed border-[color:var(--gold)]/42 bg-white/72 p-3 sm:rounded-[22px] sm:p-4">
                <p className="text-[10px] text-[color:var(--ink-soft)] sm:text-xs">Your Referral Code</p>
                <p className="mt-1 text-xl font-bold uppercase tracking-[0.2em] text-[color:var(--ink)] sm:text-2xl sm:tracking-[0.24em]">{profile.referralCode}</p>
              </div>
            </div>
          </Card>

          <div className="space-y-3 sm:space-y-4">
            <h4 className="menu-title text-2xl text-[color:var(--ink)] sm:text-3xl">Membership Tiers</h4>
            {(Object.keys(TIER_CONFIG) as LoyaltyTier[]).map((tier) => {
              const config = TIER_CONFIG[tier];
              const isCurrentTier = tier === profile.tier;

              return (
                <Card
                  key={tier}
                  className={`${
                    isCurrentTier
                      ? "paper-panel border-[color:var(--gold)]/55 shadow-[0_22px_50px_rgba(40,52,90,0.08)]"
                      : "paper-panel border-[color:var(--border)]"
                  }`}
                >
                  <div className="p-3.5 sm:p-4">
                    <div className="mb-2.5 flex items-center justify-between sm:mb-3">
                      <div>
                        <h5 className="text-base font-semibold uppercase tracking-[0.1em] text-[color:var(--ink)] sm:text-lg sm:tracking-[0.12em]">{config.name}</h5>
                        <p className="text-[10px] text-[color:var(--ink-soft)] sm:text-xs">
                          {config.pointsRequired === 0
                            ? "Starting tier"
                            : `${config.pointsRequired}+ points`}
                        </p>
                      </div>
                      {isCurrentTier ? (
                        <Badge className="rounded-full bg-[color:var(--gold)] text-xs text-[color:var(--ink)]">Current</Badge>
                      ) : null}
                    </div>
                    <ul className="space-y-1.5 sm:space-y-2">
                      {config.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2 text-xs sm:text-sm">
                          <span className="mt-0.5 text-[color:var(--gold)]">+</span>
                          <span className="text-[color:var(--ink-soft)]">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="paper-panel rounded-3xl border-[color:var(--border)] sm:rounded-[28px]">
            <div className="p-4 sm:p-6">
              <div className="mb-2.5 flex items-center gap-2 sm:mb-3">
                <Gift className="h-4 w-4 text-[color:var(--gold)] sm:h-5 sm:w-5" />
                <h4 className="menu-title text-2xl text-[color:var(--ink)] sm:text-3xl">Redeem Points</h4>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  { label: "$5 Off", points: "100 pts" },
                  { label: "$10 Off", points: "200 pts" },
                  { label: "$15 Off", points: "300 pts" },
                  { label: "Free Appetizer", points: "250 pts" },
                ].map((reward) => (
                  <div
                    key={reward.label}
                    className="rounded-2xl border border-[color:var(--border)] bg-white/74 p-3 sm:rounded-[20px] sm:p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--ink)] sm:text-sm sm:tracking-[0.12em]">
                      {reward.label}
                    </p>
                    <p className="mt-1.5 text-[10px] text-[color:var(--ink-soft)] sm:mt-2 sm:text-xs">{reward.points}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
