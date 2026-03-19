import { Gift, Star, Users } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import type { LoyaltyProfile } from "../LoyaltyCard";

type OrderingLoyaltyInfoDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loyaltyProfile: LoyaltyProfile;
  onUpdateFlavorPreferences: () => void;
};

export function OrderingLoyaltyInfoDialog({
  open,
  onOpenChange,
  loyaltyProfile,
  onUpdateFlavorPreferences,
}: OrderingLoyaltyInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0F1729] to-[#2D3E5F] rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-[#D4AF37]" />
            </div>
            Loyalty Program
          </DialogTitle>
          <DialogDescription>
            Earn points, unlock rewards, and enjoy exclusive benefits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-[#0F1729] to-[#2D3E5F] rounded-xl p-6 text-white">
            <h3 className="text-lg font-bold mb-4">How It Works</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-[#0F1729]">1</span>
                </div>
                <div>
                  <p className="font-semibold">Order & Earn</p>
                  <p className="text-sm text-white/80">Earn points automatically with every purchase</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-[#0F1729]">2</span>
                </div>
                <div>
                  <p className="font-semibold">Level Up</p>
                  <p className="text-sm text-white/80">Reach Silver, Gold, and Platinum tiers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-[#0F1729]">3</span>
                </div>
                <div>
                  <p className="font-semibold">Redeem Rewards</p>
                  <p className="text-sm text-white/80">Use points for discounts and exclusive items</p>
                </div>
              </div>
            </div>
            <Button
              onClick={onUpdateFlavorPreferences}
              variant="outline"
              className="mt-4 border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              Update My Taste Profile
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#0F1729] mb-4">Membership Tiers</h3>
            <div className="space-y-4">
              <div className={`border-2 rounded-xl p-4 ${loyaltyProfile.tier === "silver" ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB]"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🌸</span>
                    <div>
                      <h4 className="font-bold text-[#0F1729]">Silver</h4>
                      <p className="text-xs text-[#6B7280]">Starting tier</p>
                    </div>
                  </div>
                  {loyaltyProfile.tier === "silver" && (
                    <Badge className="bg-[#D4AF37] text-white">Current</Badge>
                  )}
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-600">✓</span>
                    <span className="text-[#6B7280]">Earn 1 point per $1 spent</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-600">✓</span>
                    <span className="text-[#6B7280]">5% birthday discount</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-600">✓</span>
                    <span className="text-[#6B7280]">Early access to seasonal menu</span>
                  </li>
                </ul>
              </div>

              <div className={`border-2 rounded-xl p-4 ${loyaltyProfile.tier === "gold" ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB]"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    <div>
                      <h4 className="font-bold text-[#0F1729]">Gold</h4>
                      <p className="text-xs text-[#6B7280]">500+ points</p>
                    </div>
                  </div>
                  {loyaltyProfile.tier === "gold" && (
                    <Badge className="bg-[#D4AF37] text-white">Current</Badge>
                  )}
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-600">✓</span>
                    <span className="text-[#6B7280]">Earn 1.5 points per $1 spent</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-600">✓</span>
                    <span className="text-[#6B7280]">10% birthday discount</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-600">✓</span>
                    <span className="text-[#6B7280]">Free appetizer on birthday</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-600">✓</span>
                    <span className="text-[#6B7280]">Priority seating</span>
                  </li>
                </ul>
              </div>

              <div className={`border-2 rounded-xl p-4 ${loyaltyProfile.tier === "platinum" ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB]"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💎</span>
                    <div>
                      <h4 className="font-bold text-[#0F1729]">Platinum</h4>
                      <p className="text-xs text-[#6B7280]">1500+ points</p>
                    </div>
                  </div>
                  {loyaltyProfile.tier === "platinum" && (
                    <Badge className="bg-[#D4AF37] text-white">Current</Badge>
                  )}
                </div>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-600">✓</span>
                    <span className="text-[#6B7280]">Earn 2 points per $1 spent</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-600">✓</span>
                    <span className="text-[#6B7280]">15% birthday discount</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-600">✓</span>
                    <span className="text-[#6B7280]">Free meal on birthday</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-600">✓</span>
                    <span className="text-[#6B7280]">Exclusive VIP events</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-600">✓</span>
                    <span className="text-[#6B7280]">Personal chef recommendations</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-[#F9FAFB] rounded-xl p-6">
            <h3 className="text-lg font-bold text-[#0F1729] mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#D4AF37]" />
              Redeem Your Points
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg p-3 border border-[#E5E7EB]">
                <p className="font-semibold text-sm text-[#0F1729]">$5 Off</p>
                <Badge variant="outline" className="text-xs border-[#D4AF37] text-[#D4AF37] mt-1">100 pts</Badge>
              </div>
              <div className="bg-white rounded-lg p-3 border border-[#E5E7EB]">
                <p className="font-semibold text-sm text-[#0F1729]">$10 Off</p>
                <Badge variant="outline" className="text-xs border-[#D4AF37] text-[#D4AF37] mt-1">200 pts</Badge>
              </div>
              <div className="bg-white rounded-lg p-3 border border-[#E5E7EB]">
                <p className="font-semibold text-sm text-[#0F1729]">$15 Off</p>
                <Badge variant="outline" className="text-xs border-[#D4AF37] text-[#D4AF37] mt-1">300 pts</Badge>
              </div>
              <div className="bg-white rounded-lg p-3 border border-[#E5E7EB]">
                <p className="font-semibold text-sm text-[#0F1729]">Free Appetizer</p>
                <Badge variant="outline" className="text-xs border-[#D4AF37] text-[#D4AF37] mt-1">250 pts</Badge>
              </div>
            </div>
            <p className="text-xs text-[#6B7280] mt-4">
              Redeem points at checkout when placing your order
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
            <h3 className="text-lg font-bold text-[#0F1729] mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Refer a Friend
            </h3>
            <p className="text-sm text-[#6B7280] mb-4">
              Share your referral code and both of you get 100 bonus points!
            </p>
            <div className="bg-white rounded-lg p-4 border-2 border-dashed border-blue-300">
              <p className="text-xs text-[#6B7280] mb-1">Your Referral Code</p>
              <p className="text-xl font-bold text-blue-600 tracking-wider">{loyaltyProfile.referralCode}</p>
            </div>
          </div>

          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-[#0F1729] hover:bg-[#1A2642] text-white"
          >
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
