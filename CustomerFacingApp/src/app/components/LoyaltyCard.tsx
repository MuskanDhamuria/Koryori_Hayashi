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
        <Card className="paper-panel relative cursor-pointer overflow-hidden rounded-[30px] border-[color:var(--border)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_56px_rgba(40,52,90,0.1)]">
          <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${tierConfig.panel} opacity-90`} />
          <div className="relative p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="menu-kicker mb-2">Member Profile</p>
                <div className="flex items-center gap-2">
                  <Badge className={`rounded-full border ${tierConfig.badge}`}>
                    {tierConfig.name}
                  </Badge>
                </div>
                <p className="mt-3 text-sm text-[color:var(--ink-soft)]">Hello, {profile.name}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-[color:var(--ink)]">
                  <Star className="h-5 w-5 fill-[color:var(--gold)] text-[color:var(--gold)]" />
                  <span className="text-2xl font-bold">{profile.points}</span>
                </div>
                <p className="text-xs text-[color:var(--ink-soft)]">Points</p>
              </div>
            </div>

            {profile.isBirthday ? (
              <div className="mb-4 flex items-center gap-2 rounded-[20px] border border-[color:var(--rose)]/25 bg-[color:var(--rose)]/12 px-4 py-3">
                <Gift className="h-4 w-4 text-[color:var(--rose)]" />
                <p className="text-sm font-semibold text-[color:var(--rose)]">
                  Birthday special is active for this visit.
                </p>
              </div>
            ) : null}

            {nextTier ? (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-[color:var(--ink-soft)]">
                  <span>Next tier: {TIER_CONFIG[profile.tier === "silver" ? "gold" : "platinum"].name}</span>
                  <span>{nextTier - profile.points} points to go</span>
                </div>
                <Progress value={progressToNext} className="h-2" />
              </div>
            ) : null}

            <div className="mt-4 flex items-center justify-between border-t border-[color:var(--border)] pt-4">
              <div className="flex items-center gap-1 text-xs text-[color:var(--ink-soft)]">
                <Users className="h-3 w-3" />
                <span>Referral: {profile.referralCode}</span>
              </div>
              <Button variant="ghost" size="sm" className="h-auto rounded-full px-3 py-1 text-xs">
                View Details
              </Button>
            </div>
          </div>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto border-[color:var(--border)] bg-[color:var(--popover)] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="menu-title flex items-center gap-2 text-4xl text-[color:var(--ink)]">
            <Sparkles className="h-6 w-6 text-[color:var(--gold)]" />
            Loyalty Program
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className={`overflow-hidden border-[color:var(--border)] bg-gradient-to-r ${tierConfig.panel} p-6 ${tierConfig.text}`}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge className={`rounded-full border ${tierConfig.badge}`}>
                    {tierConfig.name} Member
                  </Badge>
                </div>
                <h3 className="menu-title text-4xl">Current Status</h3>
                <p className="mt-2 text-sm opacity-78">{profile.name}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{profile.points}</div>
                <p className="text-sm opacity-78">Points</p>
              </div>
            </div>

            {nextTier ? (
              <div className="rounded-[20px] border border-white/14 bg-white/12 p-3 backdrop-blur-sm">
                <p className="mb-2 text-sm opacity-82">
                  {nextTier - profile.points} points until {TIER_CONFIG[profile.tier === "silver" ? "gold" : "platinum"].name}
                </p>
                <Progress value={progressToNext} className="h-2 bg-white/30" />
              </div>
            ) : null}
          </Card>

          <Card className="paper-panel rounded-[28px] border-[color:var(--border)]">
            <div className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-[color:var(--gold)]" />
                <h4 className="menu-title text-3xl text-[color:var(--ink)]">Refer a Friend</h4>
              </div>
              <p className="mb-3 text-sm leading-6 text-[color:var(--ink-soft)]">
                Share your referral code and both of you get 100 bonus points!
              </p>
              <div className="rounded-[22px] border border-dashed border-[color:var(--gold)]/42 bg-white/72 p-4">
                <p className="text-xs text-[color:var(--ink-soft)]">Your Referral Code</p>
                <p className="mt-1 text-2xl font-bold uppercase tracking-[0.24em] text-[color:var(--ink)]">{profile.referralCode}</p>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <h4 className="menu-title text-3xl text-[color:var(--ink)]">Membership Tiers</h4>
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
                  <div className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h5 className="text-lg font-semibold uppercase tracking-[0.12em] text-[color:var(--ink)]">{config.name}</h5>
                        <p className="text-xs text-[color:var(--ink-soft)]">
                          {config.pointsRequired === 0
                            ? "Starting tier"
                            : `${config.pointsRequired}+ points`}
                        </p>
                      </div>
                      {isCurrentTier ? (
                        <Badge className="rounded-full bg-[color:var(--gold)] text-[color:var(--ink)]">Current</Badge>
                      ) : null}
                    </div>
                    <ul className="space-y-2">
                      {config.benefits.map((benefit) => (
                        <li key={benefit} className="flex items-start gap-2 text-sm">
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

          <Card className="paper-panel rounded-[28px] border-[color:var(--border)]">
            <div className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <Gift className="h-5 w-5 text-[color:var(--gold)]" />
                <h4 className="menu-title text-3xl text-[color:var(--ink)]">Redeem Points</h4>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  { label: "$5 Off", points: "100 pts" },
                  { label: "$10 Off", points: "200 pts" },
                  { label: "$15 Off", points: "300 pts" },
                  { label: "Free Appetizer", points: "250 pts" },
                ].map((reward) => (
                  <div
                    key={reward.label}
                    className="rounded-[20px] border border-[color:var(--border)] bg-white/74 p-4"
                  >
                    <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--ink)]">
                      {reward.label}
                    </p>
                    <p className="mt-2 text-xs text-[color:var(--ink-soft)]">{reward.points}</p>
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
