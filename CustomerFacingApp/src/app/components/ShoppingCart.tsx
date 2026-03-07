import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "./ui/sheet";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { ShoppingCart as CartIcon, Minus, Plus, Trash2, CreditCard, Star } from "lucide-react";
import type { CartItem } from "../types";
import type { LoyaltyProfile } from "./LoyaltyCard";
import { calculateCartSubtotal, calculatePricing } from "../lib/pricing";

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  loyaltyProfile: LoyaltyProfile;
}

export function ShoppingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  loyaltyProfile,
}: ShoppingCartProps) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = calculateCartSubtotal(items);
  const pricing = calculatePricing(subtotal, loyaltyProfile);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full border-4 border-white bg-gradient-to-br from-[#7C8A7A] to-[#9BA89A] shadow-2xl hover:from-[#6B7969] hover:to-[#8A9889]">
          <CartIcon className="h-6 w-6" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 p-0">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full px-4 sm:max-w-lg sm:px-6">
        <SheetHeader>
          <SheetTitle>Your Order</SheetTitle>
          <SheetDescription>Review your items and proceed to checkout</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <CartIcon className="mb-4 h-16 w-16 text-gray-300" />
            <p className="text-gray-500">Your cart is empty</p>
            <p className="text-sm text-gray-400">Add items from the menu to get started</p>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <ScrollArea className="flex-1">
              <div className="space-y-4 py-4 pr-2">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-2 sm:gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-16 rounded object-cover sm:h-20 sm:w-20"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold sm:text-base">{item.name}</h4>
                      <p className="mb-1 text-xs text-gray-600 sm:mb-2 sm:text-sm">
                        ${item.price.toFixed(2)} each
                      </p>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0 sm:h-7 sm:w-7"
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm sm:w-8 sm:text-base">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 w-6 p-0 sm:h-7 sm:w-7"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto h-6 w-6 p-0 text-red-600 sm:h-7 sm:w-7"
                          onClick={() => onRemoveItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="whitespace-nowrap text-sm font-semibold sm:text-base">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-2 border-t pt-3 sm:space-y-3 sm:pt-4">
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {pricing.birthdayDiscountPercent > 0 && (
                <div className="flex justify-between text-xs text-pink-600 sm:text-sm">
                  <span className="mr-2 truncate">
                    Birthday Discount ({pricing.birthdayDiscountPercent}%)
                  </span>
                  <span className="whitespace-nowrap">
                    -${pricing.birthdayDiscountAmount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs sm:text-sm">
                <span>Tax (10%)</span>
                <span>${pricing.taxAmount.toFixed(2)}</span>
              </div>
              <Separator className="my-1 sm:my-2" />
              <div className="flex justify-between text-sm font-bold sm:text-base">
                <span>Total</span>
                <span className="text-[#7C8A7A]">${pricing.finalTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-[#7C8A7A]/30 bg-gradient-to-r from-[#E8DCC8] to-[#D4C9B8] p-2 backdrop-blur-sm sm:p-3">
                <Star className="h-4 w-4 shrink-0 fill-[#9BA89A] text-[#7C8A7A] sm:h-5 sm:w-5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[#4A5548] sm:text-sm">Loyalty Points</p>
                  <p className="truncate text-[10px] text-[#6B7669] sm:text-xs">
                    You'll earn {pricing.pointsEarned} points ({pricing.pointsMultiplier}x multiplier)
                  </p>
                </div>
              </div>
              <Button
                className="mb-10 w-full bg-gradient-to-r from-[#7C8A7A] to-[#9BA89A] py-2 text-sm font-semibold text-white shadow-lg hover:from-[#6B7969] hover:to-[#8A9889] sm:py-3 sm:text-base"
                size="default"
                onClick={onCheckout}
              >
                <CreditCard className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                Proceed to Payment
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
