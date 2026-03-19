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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
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
  "points-5": <Tag className="h-5 w-5" />,
  "points-10": <Tag className="h-5 w-5" />,
  "points-15": <Tag className="h-5 w-5" />,
  "first-time": <Gift className="h-5 w-5" />,
  referral: <Ticket className="h-5 w-5" />,
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
        <DialogContent className="border-[color:var(--border)] bg-[color:var(--popover)] sm:max-w-md">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-emerald-500/24 bg-emerald-500/10">
              <CheckCircle2 className="h-14 w-14 text-emerald-500" />
            </div>
            <h2 className="menu-title mb-2 text-4xl text-[color:var(--ink)]">Payment Successful</h2>
            <p className="mb-4 text-sm leading-6 text-[color:var(--ink-soft)]">Your order has been placed.</p>
            <div className="paper-panel-dark mb-6 w-full rounded-[28px] p-5">
              <div className="mb-2 flex items-center justify-center gap-2">
                <Star className="h-5 w-5 text-[color:var(--gold)]" />
                <span className="font-bold text-[color:var(--paper)]">
                  {completedEarnedPoints ?? pricing?.pointsEarned ?? 0} Points Earned!
                </span>
              </div>
              <p className="text-sm text-[color:var(--paper)]/72">
                New balance: {(completedPointsBalance ?? pricing?.projectedPointsBalance ?? loyaltyProfile.points).toLocaleString()} points
              </p>
              {pricing && selectedDiscountData?.requiresPoints ? (
                <p className="mt-2 text-xs text-[color:var(--paper)]/58">
                  -{pricing.selectedDiscountPointsCost} points used
                </p>
              ) : null}
            </div>
            <p className="mb-6 text-sm leading-6 text-[color:var(--ink-soft)]">
              Your food will be prepared shortly. Estimated time: 15 to 20 minutes.
            </p>

            <Button
              onClick={handleClose}
              className="w-full rounded-full bg-[color:var(--ink)] text-[color:var(--paper)] hover:bg-[color:var(--ink)]/92"
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
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[color:var(--border)] bg-[color:var(--popover)] sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="menu-title text-4xl text-[color:var(--ink)]">Complete Payment</DialogTitle>
          <DialogDescription className="text-[color:var(--ink-soft)]">
            Review your order, apply a voucher, and choose how to pay.
          </DialogDescription>
        </DialogHeader>

        {!pricing ? (
          <div className="rounded-[20px] border border-[color:var(--border)] bg-white/72 px-4 py-6 text-sm text-[color:var(--ink-soft)]">
            Calculating live order total...
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-[26px] border border-[color:var(--border)] bg-white/72 p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="menu-kicker">Order Summary</p>
                <span className="rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
                  Secure Checkout
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--ink-soft)]">Subtotal</span>
                <span className="font-semibold text-[color:var(--ink)]">${pricing.subtotal.toFixed(2)}</span>
              </div>
              {pricing.birthdayDiscountPercent > 0 ? (
                <div className="flex justify-between text-sm">
                  <span className="text-[color:var(--rose)]">
                    Birthday Discount ({pricing.birthdayDiscountPercent}%)
                  </span>
                  <span className="font-semibold text-[color:var(--rose)]">
                    -${pricing.birthdayDiscountAmount.toFixed(2)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between text-sm">
                <span className="text-[color:var(--ink-soft)]">Tax (10%)</span>
                <span className="font-semibold text-[color:var(--ink)]">${pricing.taxAmount.toFixed(2)}</span>
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
              <div className="my-3 h-px bg-[color:var(--border)]" />
              <div className="flex justify-between">
                <span className="font-bold text-[color:var(--ink)]">Total</span>
                <span className="text-2xl font-bold text-[color:var(--ink)]">
                  ${pricing.finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="paper-panel-dark flex items-center gap-3 rounded-[26px] p-5">
              <Star className="h-6 w-6 text-[color:var(--gold)]" />
              <div className="flex-1">
                <p className="text-sm text-[color:var(--paper)]/88">You'll earn with this order</p>
                <p className="text-lg font-bold text-[color:var(--paper)]">{pricing.pointsEarned} loyalty points</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="menu-kicker">Apply One Discount</p>
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
                    className={`flex w-full items-center gap-3 rounded-[22px] border p-4 transition-all ${
                      selectedDiscount === discount.id
                        ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10"
                        : discount.available
                          ? "border-[color:var(--border)] bg-white/72 hover:border-[color:var(--gold)]/55 hover:bg-white"
                          : "cursor-not-allowed border-[color:var(--border)] bg-white/48 opacity-45"
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        selectedDiscount === discount.id
                          ? "bg-[color:var(--gold)] text-[color:var(--ink)]"
                          : discount.available
                            ? "bg-[color:var(--ink)]/7 text-[color:var(--ink-soft)]"
                            : "bg-[color:var(--ink)]/6 text-[color:var(--ink-soft)]"
                      }`}
                    >
                      {discountIcons[discount.id]}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--ink)]">
                        {discount.name}
                      </p>
                      <p className="text-xs text-[color:var(--ink-soft)]">{discount.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[color:var(--ink)]">-${discount.discount.toFixed(2)}</p>
                      {discount.requiresPoints ? (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            discount.available
                              ? "border-[color:var(--gold)] text-[color:var(--gold)]"
                              : "border-[color:var(--border)] text-[color:var(--ink-soft)]"
                          }`}
                        >
                          {discount.pointsCost} pts
                        </Badge>
                      ) : null}
                    </div>
                    {selectedDiscount === discount.id ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[color:var(--gold)]" />
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-[20px] border border-[color:var(--border)] bg-white/72 p-4">
                <span className="text-sm text-[color:var(--ink-soft)]">Your Points Balance</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[color:var(--ink)]">{loyaltyProfile.points.toLocaleString()}</span>
                  {pricing.selectedDiscountPointsCost > 0 ? (
                    <>
                      <span className="text-[color:var(--ink-soft)]">-&gt;</span>
                      <span className="font-bold text-emerald-600">
                        {(loyaltyProfile.points - pricing.selectedDiscountPointsCost).toLocaleString()}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            {paymentError ? (
              <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {paymentError}
              </div>
            ) : null}

            <div className="space-y-3">
              <p className="menu-kicker">Select Payment Method</p>

              <button
                onClick={() => setPaymentMethod("card")}
                className={`flex w-full items-center gap-3 rounded-[22px] border p-4 transition-colors ${
                  paymentMethod === "card"
                    ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10"
                    : "border-[color:var(--border)] bg-white/72 hover:border-[color:var(--gold)]/55"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    paymentMethod === "card" ? "bg-[color:var(--gold)]" : "bg-[color:var(--ink)]/7"
                  }`}
                >
                  <CreditCard
                    className={`h-5 w-5 ${paymentMethod === "card" ? "text-[color:var(--ink)]" : "text-[color:var(--ink-soft)]"}`}
                  />
                </div>
                <div className="text-left">
                  <p className="font-semibold uppercase tracking-[0.12em] text-[color:var(--ink)]">Credit or Debit Card</p>
                  <p className="text-xs text-[color:var(--ink-soft)]">Visa, Mastercard, Amex</p>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod("mobile")}
                className={`flex w-full items-center gap-3 rounded-[22px] border p-4 transition-colors ${
                  paymentMethod === "mobile"
                    ? "border-[color:var(--gold)] bg-[color:var(--gold)]/10"
                    : "border-[color:var(--border)] bg-white/72 hover:border-[color:var(--gold)]/55"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    paymentMethod === "mobile" ? "bg-[color:var(--gold)]" : "bg-[color:var(--ink)]/7"
                  }`}
                >
                  <Smartphone
                    className={`h-5 w-5 ${paymentMethod === "mobile" ? "text-[color:var(--ink)]" : "text-[color:var(--ink-soft)]"}`}
                  />
                </div>
                <div className="text-left">
                  <p className="font-semibold uppercase tracking-[0.12em] text-[color:var(--ink)]">Mobile Payment</p>
                  <p className="text-xs text-[color:var(--ink-soft)]">Apple Pay, Google Pay</p>
                </div>
              </button>
            </div>

            <Button
              onClick={handlePayment}
              disabled={!paymentMethod || !pricing || isCompleting || isSubmittingOrder}
              className="h-12 w-full rounded-full bg-[color:var(--ink)] font-semibold text-[color:var(--paper)] shadow-[0_18px_38px_rgba(40,52,90,0.18)] hover:bg-[color:var(--ink)]/92 disabled:opacity-50"
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
