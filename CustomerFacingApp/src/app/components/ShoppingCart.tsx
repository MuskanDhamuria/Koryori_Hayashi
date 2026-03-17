import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { CreditCard, Minus, Plus, ShoppingCart as CartIcon, Star, Trash2 } from "lucide-react";
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
        <Button className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full border-4 border-[color:var(--paper)] bg-[color:var(--ink)] text-[color:var(--paper)] shadow-[0_24px_48px_rgba(40,52,90,0.22)] hover:bg-[color:var(--ink)]/92">
          <CartIcon className="h-6 w-6" />
          {totalItems > 0 ? (
            <Badge className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--gold)] p-0 text-[color:var(--ink)]">
              {totalItems}
            </Badge>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full border-l-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,251,244,0.98),rgba(244,239,226,0.98))] px-4 sm:max-w-lg sm:px-6">
        <SheetHeader>
          <SheetTitle className="menu-title text-3xl text-[color:var(--ink)]">Your Order</SheetTitle>
          <SheetDescription className="text-[color:var(--ink-soft)]">
            Review your dishes and proceed to checkout.
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--ink)]/6">
              <CartIcon className="h-10 w-10 text-[color:var(--ink-soft)]" />
            </div>
            <p className="menu-title text-3xl text-[color:var(--ink)]">Your cart is empty</p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--ink-soft)]">
              Add items from the menu to start building the order.
            </p>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <ScrollArea className="flex-1">
              <div className="space-y-4 py-4 pr-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-[color:var(--border)] bg-white/74 p-3 shadow-[0_10px_28px_rgba(40,52,90,0.04)]"
                  >
                    <div className="flex gap-2 sm:gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-[16px] object-cover sm:h-20 sm:w-20"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold uppercase tracking-[0.12em] text-[color:var(--ink)] sm:text-base">
                          {item.name}
                        </h4>
                        <p className="mb-1 text-xs text-[color:var(--ink-soft)] sm:mb-2 sm:text-sm">
                          ${item.price.toFixed(2)} each
                        </p>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 rounded-full border-[color:var(--border)] bg-white/84 p-0 sm:h-8 sm:w-8"
                            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm sm:w-8 sm:text-base">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 rounded-full border-[color:var(--border)] bg-white/84 p-0 sm:h-8 sm:w-8"
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="ml-auto h-7 w-7 rounded-full p-0 text-[color:var(--wine)] hover:bg-[color:var(--wine)]/10 sm:h-8 sm:w-8"
                            onClick={() => onRemoveItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="whitespace-nowrap text-sm font-semibold text-[color:var(--ink)] sm:text-base">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-2 border-t border-[color:var(--border)] pt-4 sm:space-y-3 sm:pt-5">
              <div className="flex justify-between text-xs text-[color:var(--ink-soft)] sm:text-sm">
                <span>Subtotal</span>
                <span className="font-semibold text-[color:var(--ink)]">${subtotal.toFixed(2)}</span>
              </div>
              {pricing.birthdayDiscountPercent > 0 ? (
                <div className="flex justify-between text-xs text-[color:var(--rose)] sm:text-sm">
                  <span className="mr-2 truncate">
                    Birthday Discount ({pricing.birthdayDiscountPercent}%)
                  </span>
                  <span className="whitespace-nowrap">
                    -${pricing.birthdayDiscountAmount.toFixed(2)}
                  </span>
                </div>
              ) : null}
              <div className="flex justify-between text-xs text-[color:var(--ink-soft)] sm:text-sm">
                <span>Tax (10%)</span>
                <span className="font-semibold text-[color:var(--ink)]">${pricing.taxAmount.toFixed(2)}</span>
              </div>
              <Separator className="my-1 sm:my-2" />
              <div className="flex justify-between text-sm font-bold text-[color:var(--ink)] sm:text-base">
                <span>Total</span>
                <span>${pricing.finalTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 rounded-[22px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(196,163,91,0.18),rgba(113,130,111,0.08))] p-3 sm:p-4">
                <Star className="h-4 w-4 shrink-0 fill-[color:var(--gold)] text-[color:var(--gold)] sm:h-5 sm:w-5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--ink)] sm:text-sm">
                    Loyalty Points
                  </p>
                  <p className="truncate text-[10px] text-[color:var(--ink-soft)] sm:text-xs">
                    You'll earn {pricing.pointsEarned} points ({pricing.pointsMultiplier}x multiplier)
                  </p>
                </div>
              </div>
              <Button
                className="mb-10 w-full rounded-full bg-[color:var(--ink)] py-2 text-sm font-semibold text-[color:var(--paper)] shadow-[0_18px_38px_rgba(40,52,90,0.18)] hover:bg-[color:var(--ink)]/92 sm:py-3 sm:text-base"
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
