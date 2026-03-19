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
    <Card className="paper-panel group relative h-full overflow-hidden rounded-[30px] border-[color:var(--border)] transition-all duration-300 hover:-translate-y-1 hover:border-[color:var(--gold)]/45 hover:shadow-[0_28px_56px_rgba(40,52,90,0.1)]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--gold),rgba(196,163,91,0.25),transparent)]" />
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Badge className="rounded-full border border-[color:var(--gold)]/25 bg-[color:var(--gold)]/12 text-[color:var(--ink)]">
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-[color:var(--gold)]" />
            Curated for You
          </Badge>
        </div>

        <div className="relative overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-[color:var(--paper-strong)]">
          <div className="aspect-[16/11] w-full">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          </div>
          <div className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--ink)] shadow-lg">
            {item.category}
          </div>
        </div>

        <div className="mt-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="menu-kicker mb-2">{item.category}</p>
            <h4 className="text-[1.7rem] font-semibold leading-tight text-[color:var(--ink)]">
              {item.name}
            </h4>
          </div>
          <span className="whitespace-nowrap text-2xl font-bold text-[color:var(--ink)]">
            ${item.price.toFixed(2)}
          </span>
        </div>

        <div className="mt-4 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--paper-strong)]/76 px-4 py-4 sm:px-5">
          <p className="text-sm leading-7 text-[color:var(--ink-soft)]">{reason}</p>
        </div>

        <Button
          onClick={() => onAddToCart(item)}
          className="mt-5 h-11 w-full rounded-full bg-[color:var(--ink)] px-5 text-sm font-semibold text-[color:var(--paper)] hover:bg-[color:var(--ink)]/92 sm:w-auto"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add to Order
        </Button>
      </div>
    </Card>
  );
}
