import { MenuItem as MenuItemType } from "../types";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Plus, Sparkles, Flame, Clock } from "lucide-react";
import { motion } from "motion/react";

interface MenuItemProps {
  item: MenuItemType;
  onAddToCart: (item: MenuItemType) => void;
}

export function MenuItem({ item, onAddToCart }: MenuItemProps) {
  const hasFlashSale = item.flashSaleRemaining && item.flashSaleRemaining > 0;
  const isNew = item.isNew === true;
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border border-[#E5E7EB] hover:border-[#D4AF37] bg-white group">
      <div className="relative">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[#F3F4F6]">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Badges */}
        {hasFlashSale && (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute top-3 left-3"
          >
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-3 py-1 shadow-lg">
              <Flame className="w-3.5 h-3.5 mr-1" />
              FLASH -{item.discountPercentage}%
            </Badge>
          </motion.div>
        )}
        
        {isNew && !hasFlashSale && (
          <Badge className="absolute top-3 left-3 bg-purple-600 text-white font-bold px-3 py-1 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            NEW
          </Badge>
        )}

        {item.isHighMargin && !hasFlashSale && !isNew && (
          <Badge className="absolute top-3 right-3 bg-[#D4AF37] text-white font-semibold px-3 py-1 shadow-md">
            <Sparkles className="w-3 h-3 mr-1" />
            Chef's Pick
          </Badge>
        )}
        
        {item.spicy && (
          <div className="absolute top-3 right-3 flex gap-0.5 bg-white/90 px-2 py-1 rounded-full">
            {Array.from({ length: item.spicy }).map((_, i) => (
              <span key={i} className="text-sm">🌶️</span>
            ))}
          </div>
        )}

        {hasFlashSale && (
          <div className="absolute bottom-3 left-3 right-3 bg-black/80 px-3 py-2 rounded-lg">
            <div className="flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Only {item.flashSaleRemaining} left</span>
              </div>
            </div>
            {item.surplusIngredient && (
              <p className="text-[10px] text-white/70 mt-0.5">♻️ Fresh {item.surplusIngredient}</p>
            )}
          </div>
        )}
      </div>

      <div className="p-5">
        {/* Name and Price */}
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-bold text-[#0F1729] text-base leading-tight">
            {item.name}
          </h3>
          <div className="flex flex-col items-end">
            {hasFlashSale && item.originalPrice && (
              <span className="text-xs text-[#9CA3AF] line-through">
                ${item.originalPrice.toFixed(2)}
              </span>
            )}
            <span className={`font-bold text-lg whitespace-nowrap ${hasFlashSale ? 'text-red-600' : 'text-[#0F1729]'}`}>
              ${item.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-[#6B7280] mb-4 line-clamp-2">
          {item.description}
        </p>

        {/* Add Button */}
        <Button
          onClick={() => onAddToCart(item)}
          className={`w-full h-10 ${
            hasFlashSale 
              ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' 
              : 'bg-[#0F1729] hover:bg-[#1A2642]'
          } text-white shadow-sm transition-all`}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          {hasFlashSale ? 'Grab Deal' : 'Add to Cart'}
        </Button>
      </div>
    </Card>
  );
}
