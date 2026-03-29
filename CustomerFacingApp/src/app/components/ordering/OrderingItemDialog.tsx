import { Flame, Plus, Sparkles, UtensilsCrossed } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { cn } from "../ui/utils";
import type { MenuItem } from "../../types";

type OrderingItemDialogProps = {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFromDialog: (item: MenuItem) => void;
};

const SPICY_EMOJI = "\u{1F336}\u{FE0F}";
const RECYCLE_EMOJI = "\u267B\uFE0F";

const WEATHER_EMOJI: Record<NonNullable<MenuItem["weatherTags"]>[number], string> = {
  sunny: "\u2600\uFE0F",
  rainy: "\u{1F327}\u{FE0F}",
  cold: "\u2744\uFE0F",
  hot: "\u{1F525}",
};

const FLAVOR_METRICS = [
  { key: "umami", label: "Umami", barClassName: "bg-amber-600" },
  { key: "citrus", label: "Citrus", barClassName: "bg-yellow-400" },
  { key: "refreshing", label: "Refreshing", barClassName: "bg-blue-400" },
  { key: "hearty", label: "Hearty", barClassName: "bg-red-600" },
] as const;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function OrderingItemDialog({
  item,
  open,
  onOpenChange,
  onAddFromDialog,
}: OrderingItemDialogProps) {
  const hasFlashSale = Boolean(item?.flashSaleRemaining && item.flashSaleRemaining > 0);
  const spicyLevel = item?.spicy ? Math.min(5, Math.max(0, item.spicy)) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {item ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0F1729] to-[#2D3E5F] rounded-full flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-[#D4AF37]" />
                </div>
                {item.name}
              </DialogTitle>
              <DialogDescription>{item.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />

                <div className="absolute top-4 left-4 flex gap-2">
                  {item.isNew && (
                    <Badge className="bg-purple-600 text-white px-3 py-1.5">
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      NEW
                    </Badge>
                  )}

                  {spicyLevel > 0 && (
                    <Badge className="bg-red-500 text-white px-3 py-1.5" title={`Spice level: ${spicyLevel}`}>
                      <span className="sr-only">{`Spice level: ${spicyLevel}`}</span>
                      <span aria-hidden="true">
                        {Array.from({ length: spicyLevel }).map((_, index) => (
                          <span key={index}>{SPICY_EMOJI}</span>
                        ))}
                      </span>
                    </Badge>
                  )}
                </div>

                {item.isHighMargin && !item.isNew && (
                  <Badge className="absolute top-4 right-4 bg-[#D4AF37] text-white px-3 py-1.5">
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Chef&apos;s Pick
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F3F4F6] rounded-xl p-4">
                  <p className="text-xs text-[#6B7280] mb-1">Price</p>
                  <p className="text-2xl font-bold text-[#0F1729]">${item.price.toFixed(2)}</p>
                  {item.originalPrice && (
                    <p className="text-xs text-[#9CA3AF] line-through">${item.originalPrice.toFixed(2)}</p>
                  )}
                </div>

                <div className="bg-[#F3F4F6] rounded-xl p-4">
                  <p className="text-xs text-[#6B7280] mb-1">Category</p>
                  <p className="text-lg font-semibold text-[#0F1729] capitalize">{item.category}</p>
                </div>
              </div>

              {item.flavorProfile && (
                <div className="bg-gradient-to-br from-[#F3F4F6] to-white rounded-xl p-4">
                  <h3 className="font-semibold text-[#0F1729] mb-3">Flavor Profile</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {FLAVOR_METRICS.flatMap((metric) => {
                      const rawValue = item.flavorProfile?.[metric.key];
                      if (rawValue === undefined) {
                        return [];
                      }

                      const value = clamp01(rawValue);

                      return (
                        <div key={metric.key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span>{metric.label}</span>
                            <span className="font-medium">{(value * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={cn("h-full rounded-full", metric.barClassName)}
                              style={{ width: `${value * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {item.weatherTags && item.weatherTags.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                  <h3 className="font-semibold text-[#0F1729] mb-2">Perfect for</h3>
                  <div className="flex flex-wrap gap-2">
                    {item.weatherTags.map((tag) => (
                      <Badge key={tag} variant="outline" className="bg-white capitalize">
                        <span aria-hidden="true">{WEATHER_EMOJI[tag]} </span>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {hasFlashSale && (
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-5 h-5" />
                    <h3 className="font-bold">Flash Sale!</h3>
                  </div>
                  <p className="text-sm mb-1">
                    {item.discountPercentage !== undefined ? `${item.discountPercentage}% OFF - ` : ""}
                    Only {item.flashSaleRemaining} left!
                  </p>
                  {item.surplusIngredient && (
                    <p className="text-xs text-white/90">
                      <span aria-hidden="true">{RECYCLE_EMOJI} </span>
                      Made with fresh {item.surplusIngredient}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Close
                </Button>
                <Button
                  onClick={() => onAddFromDialog(item)}
                  className={cn(
                    "flex-1 text-white",
                    hasFlashSale
                      ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      : "bg-[#0F1729] hover:bg-[#1A2642]",
                  )}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-2xl">Item details</DialogTitle>
              <DialogDescription>We couldn&apos;t load this item. Please try again.</DialogDescription>
            </DialogHeader>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
