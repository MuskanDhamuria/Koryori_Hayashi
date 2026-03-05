import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Star, Gift, Users, Sparkles } from "lucide-react";
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
    color: "bg-gradient-to-br from-slate-400 to-slate-600",
    textColor: "text-slate-700",
    icon: "🌸",
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
    color: "bg-gradient-to-br from-amber-400 to-amber-600",
    textColor: "text-amber-700",
    icon: "⭐",
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
    color: "bg-gradient-to-br from-purple-400 to-purple-600",
    textColor: "text-purple-700",
    icon: "💎",
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
        <Card className="relative overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-amber-200">
          <div className={`absolute inset-0 ${tierConfig.color} opacity-10`} />
          <div className="relative p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{tierConfig.icon}</span>
                  <Badge className={`${tierConfig.color} text-white`}>
                    {tierConfig.name}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">Hello, {profile.name}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-amber-700">
                  <Star className="w-5 h-5 fill-amber-500" />
                  <span className="text-2xl font-bold">{profile.points}</span>
                </div>
                <p className="text-xs text-gray-500">Points</p>
              </div>
            </div>

            {profile.isBirthday && (
              <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-2 mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4 text-pink-600" />
                <p className="text-sm font-semibold text-pink-700">
                  🎉 Birthday Special Active!
                </p>
              </div>
            )}

            {nextTier && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Next tier: {TIER_CONFIG[profile.tier === "silver" ? "gold" : "platinum"].name}</span>
                  <span>{nextTier - profile.points} points to go</span>
                </div>
                <Progress value={progressToNext} className="h-2" />
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Users className="w-3 h-3" />
                <span>Referral: {profile.referralCode}</span>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2">
                View Details
              </Button>
            </div>
          </div>
        </Card>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-600" />
            Loyalty Program
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <Card className={`${tierConfig.color} text-white p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-4xl">{tierConfig.icon}</span>
                  <h3 className="text-2xl font-bold">{tierConfig.name} Member</h3>
                </div>
                <p className="text-white/90">{profile.name}</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{profile.points}</div>
                <p className="text-white/90">Points</p>
              </div>
            </div>
            
            {nextTier && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <p className="text-sm mb-2 text-white/90">
                  {nextTier - profile.points} points until {TIER_CONFIG[profile.tier === "silver" ? "gold" : "platinum"].name}
                </p>
                <Progress value={progressToNext} className="h-2 bg-white/30" />
              </div>
            )}
          </Card>

          {/* Referral Section */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-blue-600" />
                <h4 className="font-bold text-lg">Refer a Friend</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Share your referral code and both of you get 100 bonus points!
              </p>
              <div className="bg-white rounded-lg p-4 border-2 border-dashed border-blue-300">
                <p className="text-xs text-gray-500 mb-1">Your Referral Code</p>
                <p className="text-2xl font-bold text-blue-600 tracking-wider">{profile.referralCode}</p>
              </div>
            </div>
          </Card>

          {/* All Tiers */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg">Membership Tiers</h4>
            {(Object.keys(TIER_CONFIG) as LoyaltyTier[]).map((tier) => {
              const config = TIER_CONFIG[tier];
              const isCurrentTier = tier === profile.tier;
              
              return (
                <Card
                  key={tier}
                  className={`${
                    isCurrentTier
                      ? "border-2 border-amber-400 shadow-lg"
                      : "border border-gray-200"
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{config.icon}</span>
                        <div>
                          <h5 className="font-bold">{config.name}</h5>
                          <p className="text-xs text-gray-500">
                            {config.pointsRequired === 0
                              ? "Starting tier"
                              : `${config.pointsRequired}+ points`}
                          </p>
                        </div>
                      </div>
                      {isCurrentTier && (
                        <Badge className="bg-amber-500">Current</Badge>
                      )}
                    </div>
                    <ul className="space-y-2">
                      {config.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-green-500 mt-0.5">✓</span>
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Rewards Redemption */}
          <Card className="bg-amber-50 border-2 border-amber-200">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-amber-600" />
                <h4 className="font-bold text-lg">Redeem Points</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <p className="font-semibold text-sm mb-1">$5 Off</p>
                  <p className="text-xs text-gray-600 mb-2">Your next order</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-amber-700">100 pts</Badge>
                    <Button size="sm" variant="outline" disabled={profile.points < 100}>
                      Redeem
                    </Button>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <p className="font-semibold text-sm mb-1">Free Appetizer</p>
                  <p className="text-xs text-gray-600 mb-2">Any appetizer under $10</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-amber-700">250 pts</Badge>
                    <Button size="sm" variant="outline" disabled={profile.points < 250}>
                      Redeem
                    </Button>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <p className="font-semibold text-sm mb-1">Free Main Dish</p>
                  <p className="text-xs text-gray-600 mb-2">Any main under $20</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-amber-700">500 pts</Badge>
                    <Button size="sm" variant="outline" disabled={profile.points < 500}>
                      Redeem
                    </Button>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-amber-200">
                  <p className="font-semibold text-sm mb-1">VIP Experience</p>
                  <p className="text-xs text-gray-600 mb-2">Private dining for 2</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-amber-700">1000 pts</Badge>
                    <Button size="sm" variant="outline" disabled={profile.points < 1000}>
                      Redeem
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
