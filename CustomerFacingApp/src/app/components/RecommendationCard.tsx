import { Plus, Sparkles } from "lucide-react";
import { MenuItem } from "../types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface RecommendationCardProps {
  item: MenuItem;
  reason: string;
  onAddToCart: (item: MenuItem) => void;
}

export function RecommendationCard({ item, reason, onAddToCart }: RecommendationCardProps) {
  return (
    <Card className="paper-panel group relative h-full overflow-hidden rounded-3xl border-[color:var(--border)] transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--gold)]/45 hover:shadow-[0_28px_56px_rgba(40,52,90,0.1)] sm:rounded-[30px]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--gold),rgba(196,163,91,0.25),transparent)]" />
      <div className="p-3.5 sm:p-5 lg:p-6">
        <div className="mb-3 flex items-center gap-2 sm:mb-4">
          <Badge className="rounded-full border border-[color:var(--gold)]/25 bg-[color:var(--gold)]/12 text-[10px] text-[color:var(--ink)] sm:text-xs">
            <Sparkles className="mr-1 h-3 w-3 text-[color:var(--gold)] sm:mr-1.5 sm:h-3.5 sm:w-3.5" />
            Curated for You
          </Badge>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--paper-strong)] sm:rounded-[24px]">
          <div className="aspect-[16/10] w-full sm:aspect-[16/11]">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          </div>
          <div className="absolute bottom-2.5 right-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[color:var(--ink)] shadow-lg sm:bottom-4 sm:right-4 sm:px-3 sm:text-[10px] sm:tracking-[0.16em]">
            {item.category}
          </div>
        </div>

        <div className="mt-4 flex items-start justify-between gap-3 sm:mt-5 sm:gap-4">
          <div className="min-w-0">
            <p className="menu-kicker mb-1.5 text-xs sm:mb-2 sm:text-sm">{item.category}</p>
            <h4 className="text-xl font-semibold leading-tight text-[color:var(--ink)] sm:text-2xl lg:text-[1.7rem]">
              {item.name}
            </h4>
          </div>
          <span className="shrink-0 whitespace-nowrap text-xl font-bold text-[color:var(--ink)] sm:text-2xl">
            ${item.price.toFixed(2)}
          </span>
        </div>

        <div className="mt-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--paper-strong)]/76 px-3 py-3 sm:mt-4 sm:rounded-[24px] sm:px-4 sm:py-4 lg:px-5">
          <p className="text-xs leading-6 text-[color:var(--ink-soft)] sm:text-sm sm:leading-7">{reason}</p>
        </div>

        <Button
          onClick={() => onAddToCart(item)}
          className="mt-4 h-10 w-full rounded-full bg-[color:var(--ink)] px-4 text-xs font-semibold text-[color:var(--paper)] hover:bg-[color:var(--ink)]/92 sm:mt-5 sm:h-11 sm:w-auto sm:px-5 sm:text-sm"
        >
          <Plus className="mr-1 h-3.5 w-3.5 sm:mr-1.5 sm:h-4 sm:w-4" />
          Add to Order
        </Button>
      </div>
    </Card>
  );
}
