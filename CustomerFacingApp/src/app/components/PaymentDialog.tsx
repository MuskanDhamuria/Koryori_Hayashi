import { useEffect, useState } from "react";
import { JSX } from "react/jsx-runtime";
import {
  CheckCircle2,
  CreditCard,
  Gift,
  Smartphone,
  Star,
  Tag,
  Ticket,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { LoyaltyProfile } from "./LoyaltyCard";
import type { AvailableDiscount, DiscountId, PricingBreakdown } from "../types";

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onDiscountChange: (discountId: DiscountId | null) => void;
  onPaymentComplete: (
    paymentMethod: "card" | "mobile",
    selectedDiscountId: DiscountId | null,
  ) => Promise<{ earnedPoints: number; pointsBalance: number } | void>;
  loyaltyProfile: LoyaltyProfile;
  pricing: PricingBreakdown | null;
  availableDiscounts: AvailableDiscount[];
  isSubmittingOrder?: boolean;
}

const discountIcons: Record<DiscountId, JSX.Element> = {
  "points-5": <Tag className="w-5 h-5" />,
  "points-10": <Tag className="w-5 h-5" />,
  "points-15": <Tag className="w-5 h-5" />,
  "first-time": <Gift className="w-5 h-5" />,
  referral: <Ticket className="w-5 h-5" />,
};

export function PaymentDialog({
  open,
  onClose,
  onDiscountChange,
  onPaymentComplete,
  loyaltyProfile,
  pricing,
  availableDiscounts,
  isSubmittingOrder = false,
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mobile" | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountId | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [completedEarnedPoints, setCompletedEarnedPoints] = useState<number | null>(null);
  const [completedPointsBalance, setCompletedPointsBalance] = useState<number | null>(null);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    setSelectedDiscount(pricing?.selectedDiscountId ?? null);
  }, [pricing?.selectedDiscountId]);

  const selectedDiscountData = availableDiscounts.find(
    (discount) => discount.id === (pricing?.selectedDiscountId ?? selectedDiscount),
  );

  const handleClose = () => {
    setPaymentMethod(null);
    setSelectedDiscount(null);
    setIsCompleting(false);
    setIsPaid(false);
    setCompletedEarnedPoints(null);
    setCompletedPointsBalance(null);
    setPaymentError("");
    onDiscountChange(null);
    onClose();
  };

  const handlePayment = async () => {
    if (!paymentMethod || !pricing) {
      return;
    }

    setIsCompleting(true);
    setPaymentError("");

    try {
      await new Promise((resolve) => {
        setTimeout(resolve, 1500);
      });

      const result = await onPaymentComplete(paymentMethod, pricing.selectedDiscountId);

      setCompletedEarnedPoints(result?.earnedPoints ?? pricing.pointsEarned);
      setCompletedPointsBalance(result?.pointsBalance ?? pricing.projectedPointsBalance);
      setIsPaid(true);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Unable to complete payment.");
    } finally {
      setIsCompleting(false);
    }
  };

  if (isPaid) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="mb-4 h-20 w-20 text-emerald-500" />
            <h2 className="mb-2 text-2xl font-bold text-[#0F1729]">Payment Successful!</h2>
            <p className="mb-4 text-[#6B7280]">Your order has been placed</p>
            <div className="mb-6 w-full rounded-lg bg-gradient-to-r from-[#0F1729] to-[#2D3E5F] p-4">
              <div className="mb-2 flex items-center justify-center gap-2">
                <Star className="h-5 w-5 text-[#D4AF37]" />
                <span className="font-bold text-white">
                  {completedEarnedPoints ?? pricing?.pointsEarned ?? 0} Points Earned!
                </span>
              </div>
              <p className="text-sm text-white/70">
                New balance: {(completedPointsBalance ?? pricing?.projectedPointsBalance ?? loyaltyProfile.points).toLocaleString()} points
              </p>
              {pricing && selectedDiscountData?.requiresPoints ? (
                <p className="mt-2 text-xs text-white/60">
                  -{pricing.selectedDiscountPointsCost} points used
                </p>
              ) : null}
            </div>
            <p className="mb-6 text-sm text-[#6B7280]">
              Your food will be prepared shortly. Estimated time: 15-20 minutes
            </p>

            <Button
              onClick={handleClose}
              className="w-full bg-[#0F1729] text-white shadow-md hover:bg-[#1A2642]"
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#0F1729]">Complete Payment</DialogTitle>
          <DialogDescription>Review your order and select a discount</DialogDescription>
        </DialogHeader>

        {!pricing ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
            Calculating live order total...
          </div>
        ) : (
        <div className="space-y-6">
          <div className="space-y-2 rounded-xl bg-[#F9FAFB] p-4">
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Subtotal</span>
              <span className="font-semibold text-[#0F1729]">${pricing.subtotal.toFixed(2)}</span>
            </div>
            {pricing.birthdayDiscountPercent > 0 ? (
              <div className="flex justify-between text-sm">
                <span className="text-pink-600">
                  Birthday Discount ({pricing.birthdayDiscountPercent}%)
                </span>
                <span className="font-semibold text-pink-600">
                  -${pricing.birthdayDiscountAmount.toFixed(2)}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between text-sm">
              <span className="text-[#6B7280]">Tax (10%)</span>
              <span className="font-semibold text-[#0F1729]">${pricing.taxAmount.toFixed(2)}</span>
            </div>
            {pricing.selectedDiscountId ? (
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1 text-emerald-600">
                  <Tag className="h-4 w-4" />
                  {selectedDiscountData?.name}
                </span>
                <span className="font-semibold text-emerald-600">
                  -${pricing.selectedDiscountAmount.toFixed(2)}
                </span>
              </div>
            ) : null}
            <div className="my-2 h-px bg-[#E5E7EB]" />
            <div className="flex justify-between">
              <span className="font-bold text-[#0F1729]">Total</span>
              <span className="text-2xl font-bold text-[#0F1729]">
                ${pricing.finalTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-[#0F1729] to-[#2D3E5F] p-4">
            <Star className="h-6 w-6 text-[#D4AF37]" />
            <div className="flex-1">
              <p className="text-sm text-white/90">You'll earn with this order</p>
              <p className="text-lg font-bold text-white">{pricing.pointsEarned} loyalty points</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#0F1729]">Apply One Discount (Optional)</p>
              {selectedDiscount ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedDiscount(null);
                    onDiscountChange(null);
                  }}
                  className="h-auto py-1 text-xs"
                >
                  Clear
                </Button>
              ) : null}
            </div>

            <div className="max-h-60 space-y-2 overflow-y-auto">
              {availableDiscounts.map((discount) => (
                <button
                  key={discount.id}
                  onClick={() => {
                    if (!discount.available) {
                      return;
                    }

                    const nextDiscount = selectedDiscount === discount.id ? null : discount.id;
                    setSelectedDiscount(nextDiscount);
                    onDiscountChange(nextDiscount);
                  }}
                  disabled={!discount.available}
                  className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 transition-all ${
                    selectedDiscount === discount.id
                      ? "border-[#D4AF37] bg-[#D4AF37]/10"
                      : discount.available
                        ? "border-[#E5E7EB] hover:border-[#D4AF37]/50 hover:bg-[#F9FAFB]"
                        : "cursor-not-allowed border-[#E5E7EB] opacity-40"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      selectedDiscount === discount.id
                        ? "bg-[#D4AF37] text-white"
                        : discount.available
                          ? "bg-[#F3F4F6] text-[#6B7280]"
                          : "bg-[#F3F4F6] text-[#9CA3AF]"
                    }`}
                  >
                    {discountIcons[discount.id]}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-[#0F1729]">{discount.name}</p>
                    <p className="text-xs text-[#6B7280]">{discount.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#0F1729]">-${discount.discount.toFixed(2)}</p>
                    {discount.requiresPoints ? (
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
                    ) : null}
                  </div>
                  {selectedDiscount === discount.id ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#D4AF37]" />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-[#F9FAFB] p-3">
              <span className="text-sm text-[#6B7280]">Your Points Balance</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0F1729]">{loyaltyProfile.points.toLocaleString()}</span>
                {pricing.selectedDiscountPointsCost > 0 ? (
                  <>
                    <span className="text-[#6B7280]">-&gt;</span>
                    <span className="font-bold text-emerald-600">
                      {(loyaltyProfile.points - pricing.selectedDiscountPointsCost).toLocaleString()}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {paymentError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {paymentError}
            </div>
          ) : null}

          <div className="space-y-3">
            <p className="text-sm font-semibold text-[#0F1729]">Select Payment Method</p>

            <button
              onClick={() => setPaymentMethod("card")}
              className={`flex w-full items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                paymentMethod === "card"
                  ? "border-[#D4AF37] bg-[#D4AF37]/5"
                  : "border-[#E5E7EB] hover:border-[#D4AF37]/50"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  paymentMethod === "card" ? "bg-[#D4AF37]" : "bg-[#F3F4F6]"
                }`}
              >
                <CreditCard
                  className={`h-5 w-5 ${paymentMethod === "card" ? "text-white" : "text-[#6B7280]"}`}
                />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#0F1729]">Credit/Debit Card</p>
                <p className="text-xs text-[#6B7280]">Visa, Mastercard, Amex</p>
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod("mobile")}
              className={`flex w-full items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                paymentMethod === "mobile"
                  ? "border-[#D4AF37] bg-[#D4AF37]/5"
                  : "border-[#E5E7EB] hover:border-[#D4AF37]/50"
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  paymentMethod === "mobile" ? "bg-[#D4AF37]" : "bg-[#F3F4F6]"
                }`}
              >
                <Smartphone
                  className={`h-5 w-5 ${paymentMethod === "mobile" ? "text-white" : "text-[#6B7280]"}`}
                />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#0F1729]">Mobile Payment</p>
                <p className="text-xs text-[#6B7280]">Apple Pay, Google Pay</p>
              </div>
            </button>
          </div>

          <Button
            onClick={handlePayment}
            disabled={!paymentMethod || !pricing || isCompleting || isSubmittingOrder}
            className="h-12 w-full bg-[#0F1729] font-semibold text-white shadow-md hover:bg-[#1A2642] disabled:opacity-50"
          >
            {isCompleting || isSubmittingOrder
              ? "Processing..."
              : paymentMethod
                ? `Pay $${pricing.finalTotal.toFixed(2)}`
                : "Select Payment Method"}
          </Button>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
