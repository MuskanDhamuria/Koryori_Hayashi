import { Flame, Plus, Sparkles, UtensilsCrossed } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import type { MenuItem } from "../../types";

type OrderingItemDialogProps = {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddFromDialog: (item: MenuItem) => void;
};

export function OrderingItemDialog({
  item,
  open,
  onOpenChange,
  onAddFromDialog,
}: OrderingItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {item && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0F1729] to-[#2D3E5F] rounded-full flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5 text-[#D4AF37]" />
                </div>
                {item.name}
              </DialogTitle>
              <DialogDescription>
                {item.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />

                <div className="absolute top-4 left-4 flex gap-2">
                  {item.isNew && (
                    <Badge className="bg-purple-600 text-white px-3 py-1.5">
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      NEW
                    </Badge>
                  )}
                  {item.spicy && (
                    <Badge className="bg-red-500 text-white px-3 py-1.5">
                      {Array.from({ length: item.spicy }).map((_, index) => (
                        <span key={index}>🌶️</span>
                      ))}
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
                  <p className="text-2xl font-bold text-[#0F1729]">
                    ${item.price.toFixed(2)}
                  </p>
                  {item.originalPrice && (
                    <p className="text-xs text-[#9CA3AF] line-through">
                      ${item.originalPrice.toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="bg-[#F3F4F6] rounded-xl p-4">
                  <p className="text-xs text-[#6B7280] mb-1">Category</p>
                  <p className="text-lg font-semibold text-[#0F1729] capitalize">
                    {item.category}
                  </p>
                </div>
              </div>

              {item.flavorProfile && (
                <div className="bg-gradient-to-br from-[#F3F4F6] to-white rounded-xl p-4">
                  <h3 className="font-semibold text-[#0F1729] mb-3">Flavor Profile</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {item.flavorProfile.umami !== undefined && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Umami</span>
                          <span className="font-medium">{(item.flavorProfile.umami * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-600 rounded-full"
                            style={{ width: `${item.flavorProfile.umami * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {item.flavorProfile.citrus !== undefined && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Citrus</span>
                          <span className="font-medium">{(item.flavorProfile.citrus * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded-full"
                            style={{ width: `${item.flavorProfile.citrus * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {item.flavorProfile.refreshing !== undefined && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Refreshing</span>
                          <span className="font-medium">{(item.flavorProfile.refreshing * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-400 rounded-full"
                            style={{ width: `${item.flavorProfile.refreshing * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {item.flavorProfile.hearty !== undefined && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Hearty</span>
                          <span className="font-medium">{(item.flavorProfile.hearty * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-600 rounded-full"
                            style={{ width: `${item.flavorProfile.hearty * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {item.weatherTags && item.weatherTags.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                  <h3 className="font-semibold text-[#0F1729] mb-2">Perfect for</h3>
                  <div className="flex gap-2">
                    {item.weatherTags.map((tag) => (
                      <Badge key={tag} variant="outline" className="bg-white capitalize">
                        {tag === "sunny" && "☀️ "}
                        {tag === "rainy" && "🌧️ "}
                        {tag === "cold" && "❄️ "}
                        {tag === "hot" && "🔥 "}
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {item.flashSaleRemaining && item.flashSaleRemaining > 0 && (
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Flame className="w-5 h-5" />
                    <h3 className="font-bold">Flash Sale!</h3>
                  </div>
                  <p className="text-sm mb-1">
                    {item.discountPercentage}% OFF - Only {item.flashSaleRemaining} left!
                  </p>
                  {item.surplusIngredient && (
                    <p className="text-xs text-white/90">
                      ♻️ Made with fresh {item.surplusIngredient}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => onAddFromDialog(item)}
                  className={`flex-1 ${
                    item.flashSaleRemaining && item.flashSaleRemaining > 0
                      ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                      : "bg-[#0F1729] hover:bg-[#1A2642]"
                  } text-white`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
