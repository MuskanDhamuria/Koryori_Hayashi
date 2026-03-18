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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--card-bg)" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl" style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--navy)" }}>
              <Star className="w-5 h-5" style={{ color: "var(--gold)" }} />
            </div>
            Loyalty Program
          </DialogTitle>
          <DialogDescription style={{ color: "var(--text-muted)" }}>
            Earn points, unlock rewards, and enjoy exclusive benefits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-xl p-5 text-white" style={{ background: "linear-gradient(135deg, var(--navy), var(--navy-light))" }}>
            <h3 className="text-base font-bold mb-3" style={{ fontFamily: "'Georgia', serif" }}>How It Works</h3>
            {[
              { n: "1", title: "Order & Earn", desc: "Earn points automatically with every purchase" },
              { n: "2", title: "Level Up", desc: "Reach Silver, Gold, and Platinum tiers" },
              { n: "3", title: "Redeem Rewards", desc: "Use points for discounts and exclusive items" },
            ].map((step) => (
              <div key={step.n} className="flex items-start gap-3 mb-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold" style={{ background: "var(--gold)", color: "var(--navy)" }}>{step.n}</div>
                <div><p className="font-semibold text-sm">{step.title}</p><p className="text-xs text-white/75">{step.desc}</p></div>
              </div>
            ))}
            <Button onClick={onUpdateFlavorPreferences} variant="outline" className="mt-2 border-white/30 bg-white/10 text-white hover:bg-white/20 text-sm">
              Update My Taste Profile
            </Button>
          </div>

          <div>
            <h3 className="text-base font-bold mb-3" style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}>Membership Tiers</h3>
            <div className="space-y-3">
              {[
                { tier: "silver", emoji: "🌸", label: "Silver", sub: "Starting tier", benefits: ["Earn 1 point per $1 spent", "5% birthday discount", "Early access to seasonal menu"] },
                { tier: "gold", emoji: "⭐", label: "Gold", sub: "500+ points", benefits: ["Earn 1.5 points per $1 spent", "10% birthday discount", "Free appetizer on birthday", "Priority seating"] },
                { tier: "platinum", emoji: "💎", label: "Platinum", sub: "1500+ points", benefits: ["Earn 2 points per $1 spent", "15% birthday discount", "Free meal on birthday", "Exclusive VIP events", "Personal chef recommendations"] },
              ].map((tierInfo) => (
                <div key={tierInfo.tier} className="border-2 rounded-xl p-4" style={loyaltyProfile.tier === tierInfo.tier ? { borderColor: "var(--gold)", background: "var(--gold-bg)" } : { borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{tierInfo.emoji}</span>
                      <div><h4 className="font-bold text-sm" style={{ color: "var(--navy)" }}>{tierInfo.label}</h4><p className="text-xs" style={{ color: "var(--text-muted)" }}>{tierInfo.sub}</p></div>
                    </div>
                    {loyaltyProfile.tier === tierInfo.tier && <Badge style={{ background: "var(--gold)", color: "var(--navy)" }}>Current</Badge>}
                  </div>
                  <ul className="space-y-1">
                    {tierInfo.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-center gap-2 text-xs"><span className="text-emerald-600">✓</span><span style={{ color: "var(--text-muted)" }}>{benefit}</span></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ background: "var(--gold-bg)", border: "1px solid var(--border)" }}>
            <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}>
              <Gift className="w-4 h-4" style={{ color: "var(--gold-dark)" }} /> Redeem Your Points
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[["$5 Off", "100 pts"], ["$10 Off", "200 pts"], ["$15 Off", "300 pts"], ["Free Appetizer", "250 pts"]].map(([label, pts]) => (
                <div key={label} className="rounded-lg p-3" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                  <p className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{label}</p>
                  <Badge variant="outline" className="text-xs mt-1" style={{ borderColor: "var(--gold)", color: "var(--gold-dark)" }}>{pts}</Badge>
                </div>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>Redeem points at checkout when placing your order</p>
          </div>

          <div className="rounded-xl p-5 border-2 bg-blue-50 border-blue-200">
            <h3 className="text-base font-bold mb-2 flex items-center gap-2" style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}>
              <Users className="w-4 h-4 text-blue-600" /> Refer a Friend
            </h3>
            <p className="text-xs text-blue-700/70 mb-3">Share your referral code and both of you get 100 bonus points!</p>
            <div className="rounded-lg p-3 bg-white border-2 border-dashed border-blue-300">
              <p className="text-xs text-blue-400 mb-1">Your Referral Code</p>
              <p className="text-lg font-bold text-blue-600 tracking-widest">{loyaltyProfile.referralCode}</p>
            </div>
          </div>

          <Button onClick={() => onOpenChange(false)} className="w-full text-white" style={{ background: "var(--navy)" }}>Got it!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
