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
    <Card className="paper-panel group relative h-full overflow-hidden rounded-3xl border-[color:var(--border)] transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--gold)]/45 hover:shadow-[0_28px_56px_rgba(40,52,90,0.1)] sm:rounded-[30px]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--gold),rgba(196,163,91,0.25),transparent)]" />
      
      <div className="p-3.5 sm:p-5 lg:p-6">
        <div className="mb-3 flex items-center gap-2 sm:mb-4">
          {hasFlashSale ? (
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              <Badge className="rounded-full border border-[color:var(--wine)]/25 bg-[color:var(--wine)]/12 text-[10px] text-[color:var(--wine)] sm:text-xs">
                <Flame className="mr-1 h-3 w-3 sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
                Daily Special
              </Badge>
            </motion.div>
          ) : isNew ? (
            <Badge className="rounded-full border border-[color:var(--ink)]/25 bg-[color:var(--ink)]/12 text-[10px] text-[color:var(--ink)] sm:text-xs">
              <Sparkles className="mr-1 h-3 w-3 text-[color:var(--gold)] sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
              Seasonal
            </Badge>
          ) : item.isHighMargin ? (
            <Badge className="rounded-full border border-[color:var(--gold)]/25 bg-[color:var(--gold)]/12 text-[10px] text-[color:var(--ink)] sm:text-xs">
              <Star className="mr-1 h-3 w-3 text-[color:var(--gold)] sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
              Chef Recommends
            </Badge>
          ) : (
            <Badge className="rounded-full border border-[color:var(--border)] bg-white/72 text-[10px] text-[color:var(--ink-soft)] sm:text-xs">
              House Favourite
            </Badge>
          )}
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--paper-strong)] sm:rounded-[24px]">
          <div className="aspect-[16/10] w-full sm:aspect-[16/11]">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,rgba(40,52,90,0.08),rgba(196,163,91,0.18))]">
                <Sparkles className="h-8 w-8 text-[color:var(--ink-soft)] sm:h-10 sm:w-10" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(24,28,42,0.5)] via-transparent to-transparent" />
          </div>
          
          <div className="absolute bottom-2.5 right-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ink)] shadow-lg sm:bottom-4 sm:right-4 sm:px-3 sm:text-[10px] sm:tracking-[0.16em]">
            {item.category}
          </div>

          {hasFlashSale && (
            <div className="absolute bottom-2.5 left-2.5 rounded-2xl bg-black/72 px-2.5 py-2 text-white shadow-lg backdrop-blur-sm sm:bottom-4 sm:left-4 sm:rounded-[18px] sm:px-3">
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>Only {item.flashSaleRemaining} left today</span>
              </div>
              {item.surplusIngredient && (
                <p className="mt-1 text-[9px] uppercase tracking-[0.14em] text-white/72 sm:text-[10px] sm:tracking-[0.16em]">
                  Fresh {item.surplusIngredient}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-start justify-between gap-3 sm:mt-5 sm:gap-4">
          <div className="min-w-0">
            <p className="menu-kicker mb-1.5 text-xs sm:mb-2 sm:text-sm">{item.category}</p>
            <h3 className="text-xl font-semibold leading-tight text-[color:var(--ink)] sm:text-2xl lg:text-[1.7rem]">
              {item.name}
            </h3>
          </div>
          <div className="shrink-0 text-right">
            {hasFlashSale && item.originalPrice ? (
              <span className="block text-[11px] text-[color:var(--ink-soft)] line-through sm:text-xs">
                ${item.originalPrice.toFixed(2)}
              </span>
            ) : null}
            <span className={`whitespace-nowrap text-xl font-bold sm:text-2xl ${hasFlashSale ? "text-[color:var(--wine)]" : "text-[color:var(--ink)]"}`}>
              ${item.price.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--paper-strong)]/76 px-3 py-3 sm:mt-4 sm:rounded-[24px] sm:px-4 sm:py-4 lg:px-5">
          <p className="text-xs leading-6 text-[color:var(--ink-soft)] sm:text-sm sm:leading-7">
            {item.description}
            {spiceLevel > 0 && (
              <span className="ml-2 inline-flex items-center gap-0.5 text-[color:var(--wine)]">
                {Array.from({ length: spiceLevel }).map((_, index) => (
                  <Flame key={`${item.id}-desc-spice-${index}`} className="inline h-3 w-3 fill-current" />
                ))}
                <span className="ml-1 text-[10px] font-semibold uppercase tracking-wider">Spicy</span>
              </span>
            )}
          </p>
        </div>

        <Button
          onClick={(event) => {
            event.stopPropagation();
            onAddToCart(item);
          }}
          className={`mt-4 h-10 w-full rounded-full px-4 text-xs font-semibold hover:bg-[color:var(--ink)]/92 sm:mt-5 sm:h-11 sm:w-auto sm:px-5 sm:text-sm ${
            hasFlashSale
              ? "bg-[color:var(--wine)] text-white hover:bg-[color:var(--wine)]/92"
              : "bg-[color:var(--ink)] text-[color:var(--paper)]"
          }`}
        >
          <Plus className="mr-1 h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4" />
          {hasFlashSale ? "Add Deal" : "Add to Order"}
        </Button>
      </div>
    </Card>
  );
}
