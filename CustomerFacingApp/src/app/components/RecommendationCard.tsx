import { MenuItem } from "../types";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Plus, Sparkles } from "lucide-react";

interface RecommendationCardProps {
  item: MenuItem;
  reason: string;
  onAddToCart: (item: MenuItem) => void;
}

export function RecommendationCard({ item, reason, onAddToCart }: RecommendationCardProps) {
  return (
    <Card className="overflow-hidden border-2 border-[#7C8A7A]/30 bg-gradient-to-br from-white via-[#F5F0E8]/40 to-[#E8DCC8]/30 shadow-lg hover:shadow-2xl transition-all duration-500 relative group hover:-translate-y-1 backdrop-blur-sm">
      {/* Animated sparkle background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7C8A7A]/5 via-transparent to-[#9BA89A]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Decorative corners */}
      <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-[#7C8A7A]/20 group-hover:border-[#7C8A7A]/40 transition-colors" />
      <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-[#7C8A7A]/20 group-hover:border-[#7C8A7A]/40 transition-colors" />
      
      <div className="p-6 relative z-10">
        {/* AI Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative">
            <Sparkles className="w-6 h-6 text-[#7C8A7A] animate-pulse drop-shadow-md" strokeWidth={2} />
            <Sparkles className="absolute inset-0 w-6 h-6 text-[#9BA89A] animate-ping opacity-30" strokeWidth={2} />
          </div>
          <Badge variant="secondary" className="bg-gradient-to-r from-[#7C8A7A]/15 to-[#9BA89A]/15 text-[#4A5548] border-2 border-[#7C8A7A]/30 backdrop-blur-sm font-semibold px-3 py-1 shadow-sm">
            <Sparkles className="w-3 h-3 mr-1.5" strokeWidth={2.5} />
            AI Recommended
          </Badge>
        </div>

        <div className="flex gap-5">
          {/* Image */}
          <div className="relative flex-shrink-0 group/image">
            <div className="relative w-28 h-28 rounded-xl overflow-hidden shadow-md border-2 border-[#7C8A7A]/20 group-hover/image:border-[#7C8A7A]/40 transition-all">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover group-hover/image:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#4A5548]/40 to-transparent" />
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover/image:translate-x-[100%] transition-transform duration-700" />
            </div>
            
            {/* Decorative corner accent on image */}
            <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 border-r-3 border-b-3 border-[#7C8A7A]/40 rounded-br-lg" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-3 mb-2">
              <h4 className="font-bold text-[#4A5548] text-lg leading-tight">
                {item.name}
              </h4>
              <span className="text-xl font-bold text-[#7C8A7A] whitespace-nowrap">
                ${item.price.toFixed(2)}
              </span>
            </div>

            {/* Reason with decorative quote marks */}
            <div className="mb-4 relative">
              <p className="text-xs text-[#6B7669] italic leading-relaxed pl-3 border-l-2 border-[#7C8A7A]/30">
                "{reason}"
              </p>
            </div>

            {/* Add button */}
            <Button
              onClick={() => onAddToCart(item)}
              size="sm"
              className="bg-gradient-to-r from-[#7C8A7A] to-[#9BA89A] hover:from-[#6B7969] hover:to-[#8A9889] text-white shadow-md hover:shadow-lg font-semibold px-4 py-2 h-9 transition-all hover:scale-[1.02] active:scale-[0.98] rounded-lg relative overflow-hidden group/button"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/button:translate-x-[100%] transition-transform duration-700" />
              <Plus className="w-4 h-4 mr-1.5 transition-transform group-hover/button:rotate-90 duration-300" strokeWidth={2.5} />
              <span>Add to Cart</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-lg shadow-[0_0_40px_rgba(124,138,122,0.3)]" />
      </div>
    </Card>
  );
}
