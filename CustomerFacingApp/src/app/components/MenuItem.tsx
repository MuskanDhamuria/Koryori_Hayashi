import { motion } from "motion/react";
import { Clock, Flame, Plus, Sparkles, Star } from "lucide-react";
import { MenuItem as MenuItemType } from "../types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface MenuItemProps {
  item: MenuItemType;
  onAddToCart: (item: MenuItemType) => void;
}

export function MenuItem({ item, onAddToCart }: MenuItemProps) {
  const hasFlashSale = item.flashSaleRemaining && item.flashSaleRemaining > 0;
  const isNew = item.isNew === true;
  const spiceLevel = item.spicy ?? 0;

  return (
    <Card className="paper-panel group overflow-hidden rounded-[28px] border-[color:var(--border)] transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--gold)]/45 hover:shadow-[0_28px_56px_rgba(40,52,90,0.1)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[color:var(--paper-strong)]">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,rgba(40,52,90,0.08),rgba(196,163,91,0.18))]">
            <Sparkles className="h-10 w-10 text-[color:var(--ink-soft)]" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(24,28,42,0.5)] via-transparent to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {hasFlashSale ? (
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              <Badge className="rounded-full border border-white/14 bg-[color:var(--wine)] text-white shadow-lg">
                <Flame className="mr-1 h-3.5 w-3.5" />
                Daily Special -{item.discountPercentage}%
              </Badge>
            </motion.div>
          ) : null}

          {isNew && !hasFlashSale ? (
            <Badge className="rounded-full border border-white/14 bg-[color:var(--ink)] text-[color:var(--paper)] shadow-lg">
              <Sparkles className="mr-1 h-3.5 w-3.5 text-[color:var(--gold)]" />
              Seasonal
            </Badge>
          ) : null}

          {item.isHighMargin && !hasFlashSale && !isNew ? (
            <Badge className="rounded-full border border-white/20 bg-white/86 text-[color:var(--ink)] shadow-lg">
              <Star className="mr-1 h-3.5 w-3.5 text-[color:var(--gold)]" />
              Chef Recommends
            </Badge>
          ) : null}
        </div>

        <div className="absolute bottom-4 right-4 flex items-center gap-1 rounded-full bg-white/88 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] shadow-lg">
          <span>{item.category}</span>
          {spiceLevel > 0 ? (
            <>
              <span className="text-[color:var(--ink-soft)]">|</span>
              <span className="flex items-center gap-1 text-[color:var(--wine)]">
                {Array.from({ length: spiceLevel }).map((_, index) => (
                  <Flame key={`${item.id}-spice-${index}`} className="h-3 w-3 fill-current" />
                ))}
              </span>
            </>
          ) : null}
        </div>

        {hasFlashSale ? (
          <div className="absolute bottom-4 left-4 rounded-[18px] bg-black/72 px-3 py-2 text-white shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5" />
              <span>Only {item.flashSaleRemaining} left today</span>
            </div>
            {item.surplusIngredient ? (
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-white/72">
                Fresh {item.surplusIngredient}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="menu-kicker mb-2">{item.category}</p>
            <h3 className="text-[1.4rem] font-semibold leading-tight text-[color:var(--ink)]">
              {item.name}
            </h3>
          </div>
          <div className="text-right">
            {hasFlashSale && item.originalPrice ? (
              <span className="block text-xs text-[color:var(--ink-soft)] line-through">
                ${item.originalPrice.toFixed(2)}
              </span>
            ) : null}
            <span className={`text-xl font-bold whitespace-nowrap ${hasFlashSale ? "text-[color:var(--wine)]" : "text-[color:var(--ink)]"}`}>
              ${item.price.toFixed(2)}
            </span>
          </div>
        </div>

        <p className="line-clamp-2 text-sm leading-6 text-[color:var(--ink-soft)]">
          {item.description}
        </p>

        <div className="flex items-center justify-between gap-3">
          <div className="rounded-full border border-[color:var(--border)] bg-white/76 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-[color:var(--ink-soft)]">
            {spiceLevel > 0 ? `${spiceLevel} heat level` : "house favourite"}
          </div>

          <Button
            onClick={(event) => {
              event.stopPropagation();
              onAddToCart(item);
            }}
            className={`h-11 rounded-full px-5 text-sm font-semibold ${
              hasFlashSale
                ? "bg-[color:var(--wine)] text-white hover:bg-[color:var(--wine)]/92"
                : "bg-[color:var(--ink)] text-[color:var(--paper)] hover:bg-[color:var(--ink)]/92"
            }`}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {hasFlashSale ? "Add Deal" : "Add to Order"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
