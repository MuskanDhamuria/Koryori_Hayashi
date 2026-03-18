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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--card-bg)" }}>
        {item && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl" style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--navy)" }}>
                  <UtensilsCrossed className="w-5 h-5" style={{ color: "var(--gold)" }} />
                </div>
                {item.name}
              </DialogTitle>
              <DialogDescription style={{ color: "var(--text-muted)" }}>{item.description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3 flex gap-2">
                  {item.isNew && (
                    <Badge className="bg-purple-600 text-white px-3 py-1"><Sparkles className="w-3 h-3 mr-1" />NEW</Badge>
                  )}
                  {item.spicy && (
                    <Badge className="bg-red-500 text-white px-2 py-1">
                      {Array.from({ length: item.spicy }).map((_, i) => <span key={i}>🌶️</span>)}
                    </Badge>
                  )}
                </div>
                {item.isHighMargin && !item.isNew && (
                  <Badge className="absolute top-3 right-3 px-3 py-1" style={{ background: "var(--gold)", color: "var(--navy)" }}>
                    <Sparkles className="w-3 h-3 mr-1" />Chef&apos;s Pick
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-4" style={{ background: "var(--gold-bg)" }}>
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Price</p>
                  <p className="text-2xl font-bold" style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}>${item.price.toFixed(2)}</p>
                  {item.originalPrice && (
                    <p className="text-xs line-through" style={{ color: "var(--text-muted)" }}>${item.originalPrice.toFixed(2)}</p>
                  )}
                </div>
                <div className="rounded-xl p-4" style={{ background: "var(--gold-bg)" }}>
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Category</p>
                  <p className="text-lg font-semibold capitalize" style={{ color: "var(--navy)" }}>{item.category}</p>
                </div>
              </div>

              {item.flavorProfile && (
                <div className="rounded-xl p-4" style={{ background: "var(--gold-bg)" }}>
                  <h3 className="font-semibold mb-3" style={{ color: "var(--navy)" }}>Flavor Profile</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(["umami", "citrus", "refreshing", "hearty"] as const).map((key) =>
                      item.flavorProfile?.[key] !== undefined ? (
                        <div key={key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="capitalize" style={{ color: "var(--text-muted)" }}>{key}</span>
                            <span className="font-medium" style={{ color: "var(--navy)" }}>{((item.flavorProfile[key] ?? 0) * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                            <div className="h-full rounded-full" style={{ width: `${(item.flavorProfile[key] ?? 0) * 100}%`, background: "var(--gold)" }} />
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}

              {item.weatherTags && item.weatherTags.length > 0 && (
                <div className="rounded-xl p-4 bg-blue-50">
                  <h3 className="font-semibold mb-2" style={{ color: "var(--navy)" }}>Perfect for</h3>
                  <div className="flex gap-2 flex-wrap">
                    {item.weatherTags.map((tag) => (
                      <Badge key={tag} variant="outline" className="bg-white capitalize">
                        {tag === "sunny" && "☀️ "}{tag === "rainy" && "🌧️ "}{tag === "cold" && "❄️ "}{tag === "hot" && "🔥 "}{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {item.flashSaleRemaining && item.flashSaleRemaining > 0 && (
                <div className="rounded-xl p-4 text-white bg-gradient-to-r from-orange-500 to-red-500">
                  <div className="flex items-center gap-2 mb-1"><Flame className="w-5 h-5" /><h3 className="font-bold">Flash Sale!</h3></div>
                  <p className="text-sm">{item.discountPercentage}% OFF · Only {item.flashSaleRemaining} left!</p>
                  {item.surplusIngredient && <p className="text-xs text-white/80 mt-1">♻️ Made with fresh {item.surplusIngredient}</p>}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Close</Button>
                <Button
                  onClick={() => onAddFromDialog(item)}
                  className="flex-1 text-white"
                  style={
                    item.flashSaleRemaining && item.flashSaleRemaining > 0
                      ? { background: "linear-gradient(to right, #f97316, #ef4444)" }
                      : { background: "var(--navy)" }
                  }
                >
                  <Plus className="w-4 h-4 mr-2" /> Add to Cart
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
