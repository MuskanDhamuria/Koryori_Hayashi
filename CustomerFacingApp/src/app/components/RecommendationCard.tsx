import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Sparkles, Plus } from "lucide-react";
import { MenuItemData } from "./MenuItem";

interface RecommendationCardProps {
  item: MenuItemData;
  reason: string;
  onAddToCart: (item: MenuItemData) => void;
}

export function RecommendationCard({ item, reason, onAddToCart }: RecommendationCardProps) {
  return (
    <Card className="overflow-hidden border-2 border-[#7C8A7A]/40 bg-gradient-to-br from-[#E8DCC8] to-[#F5F0E8] shadow-lg hover:shadow-xl transition-all relative backdrop-blur-sm">
      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[#7C8A7A]/20" />
      <div className="p-5 relative">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[#7C8A7A] animate-pulse" />
          <Badge variant="secondary" className="bg-gradient-to-r from-[#7C8A7A]/20 to-[#9BA89A]/20 text-[#4A5548] border border-[#7C8A7A]/30 backdrop-blur-sm font-medium">
            ✨ AI Recommended
          </Badge>
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <img
              src={item.image}
              alt={item.name}
              className="w-24 h-24 object-cover rounded-lg shadow-md border border-[#7C8A7A]/30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#4A5548]/20 to-transparent rounded-lg" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-2 border-b-2 border-[#7C8A7A]/40" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-semibold text-[#4A5548]">{item.name}</h4>
              <span className="text-[#7C8A7A] font-bold text-lg ml-2">${item.price.toFixed(2)}</span>
            </div>
            <p className="text-xs text-[#6B7669] mb-3 italic">{reason}</p>
            <Button
              onClick={() => onAddToCart(item)}
              size="sm"
              className="bg-gradient-to-r from-[#7C8A7A] to-[#9BA89A] hover:from-[#6B7969] hover:to-[#8A9889] text-white shadow-md font-semibold"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-[#7C8A7A]/20" />
    </Card>
  );
}
