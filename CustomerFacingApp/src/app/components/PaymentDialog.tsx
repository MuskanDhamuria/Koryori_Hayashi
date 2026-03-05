import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { CheckCircle2, CreditCard, Smartphone, Star } from "lucide-react";
import { useState } from "react";

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  total: number;
  loyaltyPoints: number;
}

export function PaymentDialog({ open, onClose, total, loyaltyPoints }: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mobile" | null>(null);
  const [isPaid, setIsPaid] = useState(false);

  const handlePayment = () => {
    // Simulate payment processing
    setTimeout(() => {
      setIsPaid(true);
    }, 1500);
  };

  const handleClose = () => {
    setPaymentMethod(null);
    setIsPaid(false);
    onClose();
  };

  if (isPaid) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center py-6">
            <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">Your order has been placed</p>
            <div className="bg-amber-50 p-4 rounded-lg w-full mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-amber-900">{loyaltyPoints} Points Earned!</span>
              </div>
              <p className="text-sm text-gray-600">
                Added to your loyalty account
              </p>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Your food will be prepared shortly. Estimated time: 15-20 minutes
            </p>
            <Button onClick={handleClose} className="w-full bg-gradient-to-r from-[#7C8A7A] to-[#9BA89A] hover:from-[#6B7969] hover:to-[#8A9889] text-white font-semibold shadow-lg">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Total Amount: <span className="text-[#7C8A7A] font-bold text-xl">${total.toFixed(2)}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-amber-50 p-3 rounded-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-600" />
            <p className="text-sm">You'll earn <strong>{loyaltyPoints} loyalty points</strong> with this order</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Select Payment Method:</p>
            
            <button
              onClick={() => setPaymentMethod("card")}
              className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                paymentMethod === "card"
                  ? "border-[#7C8A7A] bg-[#E8DCC8]"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <CreditCard className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Credit/Debit Card</p>
                <p className="text-xs text-gray-600">Visa, Mastercard, Amex</p>
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod("mobile")}
              className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition-colors ${
                paymentMethod === "mobile"
                  ? "border-[#7C8A7A] bg-[#E8DCC8]"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <Smartphone className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Mobile Payment</p>
                <p className="text-xs text-gray-600">Apple Pay, Google Pay</p>
              </div>
            </button>
          </div>

          <Button
            onClick={handlePayment}
            disabled={!paymentMethod}
            className="w-full bg-gradient-to-r from-[#7C8A7A] to-[#9BA89A] hover:from-[#6B7969] hover:to-[#8A9889] disabled:opacity-50 font-semibold text-white shadow-lg"
          >
            {paymentMethod ? `Pay $${total.toFixed(2)}` : "Select Payment Method"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
