import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { CheckCircle2, CreditCard, Smartphone, Star, Tag, Gift, Percent, Ticket } from "lucide-react";
import { useState } from "react";
import { LoyaltyProfile } from "./LoyaltyCard";
import { JSX } from "react/jsx-runtime";

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
  total: number;
  loyaltyPoints: number;
  loyaltyProfile: LoyaltyProfile;
}

interface Discount {
  id: string;
  name: string;
  description: string;
  discount: number; // Fixed dollar amount
  pointsCost?: number; // If it requires points
  icon: JSX.Element;
  available: boolean;
  requiresPoints?: boolean;
}

export function PaymentDialog({ open, onClose, onPaymentComplete, total, loyaltyPoints, loyaltyProfile }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mobile" | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<string | null>(null);

  // Safety check for loyaltyProfile
  if (!loyaltyProfile) {
    return null;
  }

  const availableDiscounts: Discount[] = [
    {
      id: "points-5",
      name: "$5 Off",
      description: "Redeem 100 points",
      discount: 5,
      pointsCost: 100,
      icon: <Tag className="w-5 h-5" />,
      available: loyaltyProfile.points >= 100,
      requiresPoints: true,
    },
    {
      id: "points-10",
      name: "$10 Off",
      description: "Redeem 200 points",
      discount: 10,
      pointsCost: 200,
      icon: <Tag className="w-5 h-5" />,
      available: loyaltyProfile.points >= 200,
      requiresPoints: true,
    },
    {
      id: "points-15",
      name: "$15 Off",
      description: "Redeem 300 points",
      discount: 15,
      pointsCost: 300,
      icon: <Tag className="w-5 h-5" />,
      available: loyaltyProfile.points >= 300,
      requiresPoints: true,
    },
    {
      id: "first-time",
      name: "First Time Guest",
      description: "10% off (max $10)",
      discount: Math.min(total * 0.1, 10),
      icon: <Gift className="w-5 h-5" />,
      available: loyaltyProfile.tier === "silver" && loyaltyProfile.points === 0,
      requiresPoints: false,
    },
    {
      id: "referral",
      name: "Referral Bonus",
      description: "$8 off your order",
      discount: 8,
      icon: <Ticket className="w-5 h-5" />,
      available: false, // Can be enabled if user used a referral code
      requiresPoints: false,
    },
  ];

  const selectedDiscountData = availableDiscounts.find(d => d.id === selectedDiscount);
  const discountAmount = selectedDiscountData?.discount || 0;
  const finalTotal = Math.max(0, total - discountAmount);
  const pointsAfterDiscount = loyaltyProfile.points - (selectedDiscountData?.pointsCost || 0);

  const handlePayment = () => {
    // Simulate payment processing
    setTimeout(() => {
      setIsPaid(true);
    }, 1500);
  };

    const handleClose = () => {
    setPaymentMethod(null);
    setIsPaid(false);
    setSelectedDiscount(null);
    onClose();
  };

  const handleDone = () => {
    onPaymentComplete();
    handleClose();
  };

  if (isPaid) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-6">
            <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-4" />
            <h2 className="text-2xl font-bold text-[#0F1729] mb-2">Payment Successful!</h2>
            <p className="text-[#6B7280] mb-4">Your order has been placed</p>
            <div className="bg-gradient-to-r from-[#0F1729] to-[#2D3E5F] p-4 rounded-lg w-full mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-[#D4AF37]" />
                <span className="font-bold text-white">{loyaltyPoints} Points Earned!</span>
              </div>
              <p className="text-sm text-white/70">
                Added to your loyalty account
              </p>
              {selectedDiscountData?.requiresPoints && (
                <p className="text-xs text-white/60 mt-2">
                  -{selectedDiscountData.pointsCost} points used
                </p>
              )}
            </div>
            <p className="text-sm text-[#6B7280] mb-6">
              Your food will be prepared shortly. Estimated time: 15-20 minutes
            </p>

             <Button 
              onClick={handleDone}
              className="w-full bg-[#0F1729] hover:bg-[#1A2642] text-white shadow-md"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#0F1729]">Complete Payment</DialogTitle>
          <DialogDescription>
            Review your order and select a discount
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-[#F9FAFB] rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Subtotal</span>
              <span className="font-semibold text-[#0F1729]">${total.toFixed(2)}</span>
            </div>
            {selectedDiscount && (
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600 flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  {selectedDiscountData?.name}
                </span>
                <span className="font-semibold text-emerald-600">-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="h-px bg-[#E5E7EB] my-2" />
            <div className="flex justify-between">
              <span className="font-bold text-[#0F1729]">Total</span>
              <span className="font-bold text-2xl text-[#0F1729]">${finalTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Points Earned */}
          <div className="bg-gradient-to-r from-[#0F1729] to-[#2D3E5F] p-4 rounded-lg flex items-center gap-3">
            <Star className="w-6 h-6 text-[#D4AF37]" />
            <div className="flex-1">
              <p className="text-sm text-white/90">You'll earn with this order</p>
              <p className="font-bold text-white text-lg">{loyaltyPoints} loyalty points</p>
            </div>
          </div>

          {/* Discount Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#0F1729]">Apply One Discount (Optional)</p>
              {selectedDiscount && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedDiscount(null)}
                  className="text-xs h-auto py-1"
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableDiscounts.map((discount) => (
                <button
                  key={discount.id}
                  onClick={() => discount.available && setSelectedDiscount(discount.id)}
                  disabled={!discount.available}
                  className={`w-full p-3 border-2 rounded-lg flex items-center gap-3 transition-all ${
                    selectedDiscount === discount.id
                      ? "border-[#D4AF37] bg-[#D4AF37]/10"
                      : discount.available
                      ? "border-[#E5E7EB] hover:border-[#D4AF37]/50 hover:bg-[#F9FAFB]"
                      : "border-[#E5E7EB] opacity-40 cursor-not-allowed"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedDiscount === discount.id
                      ? "bg-[#D4AF37] text-white"
                      : discount.available
                      ? "bg-[#F3F4F6] text-[#6B7280]"
                      : "bg-[#F3F4F6] text-[#9CA3AF]"
                  }`}>
                    {discount.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-sm text-[#0F1729]">{discount.name}</p>
                    <p className="text-xs text-[#6B7280]">{discount.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#0F1729]">-${discount.discount.toFixed(2)}</p>
                    {discount.requiresPoints && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          discount.available 
                            ? "border-[#D4AF37] text-[#D4AF37]" 
                            : "border-[#E5E7EB] text-[#9CA3AF]"
                        }`}
                      >
                        {discount.pointsCost} pts
                      </Badge>
                    )}
                  </div>
                  {selectedDiscount === discount.id && (
                    <div className="w-5 h-5 rounded-full bg-[#D4AF37] flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Current Points Balance */}
            <div className="bg-[#F9FAFB] rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-[#6B7280]">Your Points Balance</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0F1729]">{loyaltyProfile.points.toLocaleString()}</span>
                {selectedDiscountData?.requiresPoints && (
                  <>
                    <span className="text-[#6B7280]">→</span>
                    <span className="font-bold text-emerald-600">
                      {pointsAfterDiscount.toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#0F1729]">Select Payment Method</p>
            
            <button
              onClick={() => setPaymentMethod("card")}
              className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                paymentMethod === "card"
                  ? "border-[#D4AF37] bg-[#D4AF37]/5"
                  : "border-[#E5E7EB] hover:border-[#D4AF37]/50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                paymentMethod === "card" ? "bg-[#D4AF37]" : "bg-[#F3F4F6]"
              }`}>
                <CreditCard className={`w-5 h-5 ${paymentMethod === "card" ? "text-white" : "text-[#6B7280]"}`} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#0F1729]">Credit/Debit Card</p>
                <p className="text-xs text-[#6B7280]">Visa, Mastercard, Amex</p>
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod("mobile")}
              className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                paymentMethod === "mobile"
                  ? "border-[#D4AF37] bg-[#D4AF37]/5"
                  : "border-[#E5E7EB] hover:border-[#D4AF37]/50"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                paymentMethod === "mobile" ? "bg-[#D4AF37]" : "bg-[#F3F4F6]"
              }`}>
                <Smartphone className={`w-5 h-5 ${paymentMethod === "mobile" ? "text-white" : "text-[#6B7280]"}`} />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#0F1729]">Mobile Payment</p>
                <p className="text-xs text-[#6B7280]">Apple Pay, Google Pay</p>
              </div>
            </button>
          </div>

          {/* Pay Button */}
          <Button
            onClick={handlePayment}
            disabled={!paymentMethod}
            className="w-full h-12 bg-[#0F1729] hover:bg-[#1A2642] disabled:opacity-50 font-semibold text-white shadow-md"
          >
            {paymentMethod ? `Pay $${finalTotal.toFixed(2)}` : "Select Payment Method"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}