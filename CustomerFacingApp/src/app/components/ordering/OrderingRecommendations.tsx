import { Sparkles } from "lucide-react";
import { CherryBlossom } from "../JapanesePattern";
import { RecommendationCard } from "../RecommendationCard";
import type { MenuItem } from "../../types";

type OrderingRecommendationsProps = {
  recommendations: Array<{ item: MenuItem; reason: string }>;
  onAddToCart: (item: MenuItem) => void;
};

export function OrderingRecommendations({
  recommendations,
  onAddToCart,
}: OrderingRecommendationsProps) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="relative mt-16">
      <div className="absolute -top-8 left-0 right-0 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div
            className="h-px w-20"
            style={{ background: "linear-gradient(to right, transparent, var(--gold-light))" }}
          />
          {[0.4, 0.6, 1, 0.6, 0.4].map((opacity, index) => (
            <div
              key={index}
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: `rgba(200, 168, 75, ${opacity})` }}
            />
          ))}
          <div
            className="h-px w-20"
            style={{ background: "linear-gradient(to left, transparent, var(--gold-light))" }}
          />
        </div>
      </div>

      <div className="mt-8 mb-7 flex flex-wrap items-center gap-4">
        <div className="relative">
          <div
            className="absolute inset-0 h-14 w-14 rounded-full blur-xl animate-pulse"
            style={{ background: "var(--gold-bg)" }}
          />
          <div
            className="relative rounded-2xl p-3 shadow-xl"
            style={{ background: "linear-gradient(135deg, var(--navy), var(--navy-light))" }}
          >
            <Sparkles className="relative z-10 h-7 w-7" style={{ color: "var(--gold)" }} strokeWidth={2} />
          </div>
          <CherryBlossom className="absolute -bottom-1 -right-1 opacity-90 drop-shadow-md" size={24} />
        </div>
        <div className="flex-1">
          <h2
            className="mb-1 text-3xl font-bold sm:text-4xl"
            style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}
          >
            Recommendations
          </h2>
          <p className="text-xs" style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}>
            Backend Personalization · Weather-Aware · Flavor-Matched
          </p>
        </div>
      </div>

      <div className="rec-card-grid grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {recommendations.map((recommendation) => (
          <RecommendationCard
            key={recommendation.item.id}
            item={recommendation.item}
            reason={recommendation.reason}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </div>
  );
}
