import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { ShoppingCart as CartIcon, Minus, Plus, Trash2, CreditCard, Star } from "lucide-react";
import { MenuItemData } from "./MenuItem";
import { LoyaltyTier } from "./LoyaltyCard";

interface CartItem extends MenuItemData {
  quantity: number;
}

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  loyaltyTier: LoyaltyTier;
  birthdayDiscount: boolean;
}

export function ShoppingCart({ items, onUpdateQuantity, onRemoveItem, onCheckout, loyaltyTier, birthdayDiscount }: ShoppingCartProps) {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Calculate birthday discount
  const birthdayDiscountPercent = birthdayDiscount 
    ? (loyaltyTier === "platinum" ? 15 : loyaltyTier === "gold" ? 10 : 5)
    : 0;
  const birthdayDiscountAmount = subtotal * (birthdayDiscountPercent / 100);
  const subtotalAfterDiscount = subtotal - birthdayDiscountAmount;
  
  const tax = subtotalAfterDiscount * 0.1;
  const total = subtotalAfterDiscount + tax;
  
  // Calculate points based on tier
  const pointsMultiplier = loyaltyTier === "platinum" ? 2 : loyaltyTier === "gold" ? 1.5 : 1;
  const loyaltyPoints = Math.floor(total * pointsMultiplier);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-[#7C8A7A] to-[#9BA89A] hover:from-[#6B7969] hover:to-[#8A9889] z-50 border-4 border-white">
          <CartIcon className="h-6 w-6" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-amber-500">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Your Order</SheetTitle>
        </SheetHeader>
        
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <CartIcon className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-500">Your cart is empty</p>
            <p className="text-sm text-gray-400">Add items from the menu to get started</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{item.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        ${item.price.toFixed(2)} each
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0"
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 ml-auto text-red-600"
                          onClick={() => onRemoveItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {birthdayDiscount && (
                <div className="flex justify-between text-sm text-pink-600">
                  <span>🎉 Birthday Discount ({birthdayDiscountPercent}%)</span>
                  <span>-${birthdayDiscountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-[#7C8A7A]">${total.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#E8DCC8] to-[#D4C9B8] p-3 rounded-lg border border-[#7C8A7A]/30 backdrop-blur-sm">
                <Star className="w-5 h-5 text-[#7C8A7A] fill-[#9BA89A]" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#4A5548]">Loyalty Points</p>
                  <p className="text-xs text-[#6B7669]">
                    You'll earn {loyaltyPoints} points ({pointsMultiplier}x multiplier)
                  </p>
                </div>
              </div>
              <Button
                className="w-full bg-gradient-to-r from-[#7C8A7A] to-[#9BA89A] hover:from-[#6B7969] hover:to-[#8A9889] text-white shadow-lg font-semibold"
                size="lg"
                onClick={onCheckout}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Proceed to Payment
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
