import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Plus, TrendingUp } from "lucide-react";

export interface MenuItemData {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isHighMargin?: boolean;
  spicy?: number;
}

interface MenuItemProps {
  item: MenuItemData;
  onAddToCart: (item: MenuItemData) => void;
}

export function MenuItem({ item, onAddToCart }: MenuItemProps) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border border-[#7C8A7A]/20 hover:border-[#7C8A7A]/40 bg-[#F5F0E8]/95 backdrop-blur-sm relative group">
      <div className="relative overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#4A5548]/40 to-transparent" />
        {item.isHighMargin && (
          <Badge className="absolute top-3 right-3 bg-gradient-to-r from-[#7C8A7A] to-[#9BA89A] hover:from-[#6B7969] hover:to-[#8A9889] shadow-lg border border-white/50 text-white font-semibold">
            <TrendingUp className="w-3 h-3 mr-1" />
            Chef's Pick
          </Badge>
        )}
        {item.spicy && (
          <div className="absolute top-3 left-3 flex gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-md border border-[#7C8A7A]/20">
            {Array.from({ length: item.spicy }).map((_, i) => (
              <span key={i} className="text-orange-600">🌶️</span>
            ))}
          </div>
        )}
        {/* Corner decoration */}
        <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-[#7C8A7A]/20" />
      </div>
      <div className="p-5 relative">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-[#4A5548]">{item.name}</h3>
          <span className="text-[#7C8A7A] font-bold text-lg ml-2">${item.price.toFixed(2)}</span>
        </div>
        <p className="text-sm text-[#6B7669] mb-4 leading-relaxed">{item.description}</p>
        <Button
          onClick={() => onAddToCart(item)}
          className="w-full bg-gradient-to-r from-[#7C8A7A] to-[#9BA89A] hover:from-[#6B7969] hover:to-[#8A9889] text-white shadow-md font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add to Order
        </Button>
        {/* Bottom corner accent */}
        <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-[#7C8A7A]/20" />
      </div>
    </Card>
  );
}
