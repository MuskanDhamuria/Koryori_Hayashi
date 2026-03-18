import type { ReactNode } from "react";
import { Info, Sparkles } from "lucide-react";
import { CherryBlossom } from "../JapanesePattern";
import { MenuItem } from "../MenuItem";
import { RecommendationCard } from "../RecommendationCard";
import { LoyaltyCard, type LoyaltyProfile } from "../LoyaltyCard";
import type { MenuItem as MenuItemType, WeatherData } from "../../types";

type OrderingCategory = {
  key: string;
  label: string;
  emoji: string;
};

type OrderingCatalogProps = {
  hasPlacedOrder: boolean;
  onShowGames: () => void;
  onUpdateFlavorPreferences: () => void;
  loyaltyProfile: LoyaltyProfile;
  weatherData: WeatherData | null;
  getWeatherIcon: (condition: string) => ReactNode;
  getPerfectWeatherMessage: (weather: WeatherData) => string;
  categories: OrderingCategory[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  menuItems: MenuItemType[];
  onItemClick: (item: MenuItemType) => void;
  recommendations: Array<{ item: MenuItemType; reason: string }>;
  onAddToCart: (item: MenuItemType) => void;
};

export function OrderingCatalog({
  hasPlacedOrder,
  onShowGames,
  onUpdateFlavorPreferences,
  loyaltyProfile,
  weatherData,
  getWeatherIcon,
  getPerfectWeatherMessage,
  categories,
  activeCategory,
  onSelectCategory,
  menuItems,
  onItemClick,
  recommendations,
  onAddToCart,
}: OrderingCatalogProps) {
  return (
    <>
      <div className="mb-4">
        <LoyaltyCard profile={loyaltyProfile} />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {hasPlacedOrder && (
          <button
            onClick={onShowGames}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white transition-colors"
            style={{ background: "var(--navy)" }}
          >
            Play Games
          </button>
        )}

        <button
          onClick={onUpdateFlavorPreferences}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
          style={{ background: "var(--gold-bg)", color: "var(--navy)" }}
        >
          <Info className="h-3 w-3" style={{ color: "var(--gold-dark)" }} />
          Update Taste Profile
        </button>

        {loyaltyProfile.isBirthday && (
          <div className="flex items-center gap-1.5 rounded-lg bg-pink-50 px-3 py-2 text-xs font-medium text-pink-700">
            Birthday Bonus Active
          </div>
        )}
      </div>

      {weatherData && (
        <div
          className="mb-5 flex items-center gap-3 rounded-xl p-4"
          style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
        >
          <div
            className="shrink-0 rounded-lg px-2.5 py-1.5"
            style={{ background: "var(--gold-bg)" }}
          >
            <div className="flex items-center gap-1.5">
              <span style={{ color: "var(--gold-dark)" }}>{getWeatherIcon(weatherData.condition)}</span>
              <span className="text-xs font-semibold" style={{ color: "var(--navy)" }}>
                {weatherData.temperature}°F
              </span>
            </div>
          </div>
          <div>
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}
            >
              {getPerfectWeatherMessage(weatherData)}
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {weatherData.description}
            </p>
          </div>
        </div>
      )}

      <div className="lg:hidden mb-5">
        <div className="mb-2.5 flex items-center gap-2 px-1">
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 2.5h10M3 6h6M5 9.5h2" stroke="var(--gold-dark)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: "var(--text-muted)" }}
            >
              Filter
            </span>
          </div>
          <div className="h-px flex-1" style={{ background: "var(--border)" }} />
          <span className="text-[10px]" style={{ color: "var(--cream-muted)" }}>
            scroll ›
          </span>
        </div>

        <div className="relative">
          <div
            className="pointer-events-none absolute bottom-0 right-0 top-0 z-10 w-10"
            style={{ background: "linear-gradient(to right, transparent, var(--bg-cream))" }}
          />

          <div className="cat-scroll -mx-4 overflow-x-auto px-4 pb-2.5">
            <div className="flex gap-2" style={{ width: "max-content" }}>
              {categories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => onSelectCategory(category.key)}
                  className="filter-chip flex shrink-0 items-center gap-1.5 whitespace-nowrap transition-all"
                  style={
                    activeCategory === category.key
                      ? {
                          background: "var(--navy)",
                          color: "var(--cream)",
                          border: "1.5px solid var(--navy)",
                          borderRadius: "999px",
                          padding: "0.3rem 0.85rem",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          fontFamily: "'Georgia', serif",
                        }
                      : {
                          background: "var(--card-bg)",
                          color: "var(--text-muted)",
                          border: "1.5px solid var(--border)",
                          borderRadius: "999px",
                          padding: "0.3rem 0.85rem",
                          fontSize: "0.8rem",
                          fontWeight: 400,
                          fontFamily: "'Georgia', serif",
                        }
                  }
                >
                  <span className="text-sm leading-none">{category.emoji}</span>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <aside className="hidden w-28 shrink-0 lg:block">
          <div
            className="sticky top-20 rounded-xl p-2"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
          >
            <div className="flex flex-col gap-1">
              {categories.map((category) => (
                <button
                  key={category.key}
                  onClick={() => onSelectCategory(category.key)}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2.5 py-2.5 text-left transition-all"
                  style={
                    activeCategory === category.key
                      ? { background: "var(--navy)", color: "var(--cream)" }
                      : { color: "var(--navy)" }
                  }
                >
                  <span className="text-base">{category.emoji}</span>
                  <span className="truncate text-xs font-medium">{category.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="menu-card-grid min-w-0 flex-1">
          {categories.map((category) =>
            activeCategory === category.key ? (
              <div key={category.key}>
                <h2
                  className="mb-5 text-2xl font-bold sm:text-3xl"
                  style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}
                >
                  {category.label}
                </h2>
                <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-5 xl:grid-cols-3">
                  {menuItems
                    .filter((item) => item.category === category.key)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="mi-wrap h-full w-full cursor-pointer transition-transform hover:scale-[1.02]"
                        onClick={() => onItemClick(item)}
                      >
                        <MenuItem item={item} onAddToCart={onAddToCart} />
                      </div>
                    ))}
                </div>
              </div>
            ) : null,
          )}
        </section>
      </div>

      {recommendations.length > 0 && (
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
                className="absolute inset-0 h-14 w-14 animate-pulse rounded-full blur-xl"
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
                Recommendations おすすめ
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                Multi-Armed Bandit · Thompson Sampling · Weather-Aware · Flavor-Matched
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
      )}
    </>
  );
}
