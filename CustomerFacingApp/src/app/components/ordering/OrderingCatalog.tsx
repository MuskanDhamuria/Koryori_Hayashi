import type { ReactNode } from "react";
import { Skeleton } from "../ui/skeleton";
import { Sparkles } from "lucide-react";
import { CherryBlossom } from "../JapanesePattern";
import { MenuItem } from "../MenuItem";
import { RecommendationCard } from "../RecommendationCard";
import { LoyaltyCard, type LoyaltyProfile } from "../LoyaltyCard";
import { Button } from "../ui/button";
import type { FlavorPreferences, MenuItem as MenuItemType, WeatherData } from "../../types";

const CATEGORY_OPTIONS = [
  { id: "mains", label: "Mains" },
  { id: "appetizers", label: "Appetizers" },
  { id: "ramen", label: "Udon" },
  { id: "desserts", label: "Desserts" },
  { id: "drinks", label: "Drinks" },
] as const;

type OrderingCatalogProps = {
  tableNumber: string;
  userName: string;
  flavorPreferences?: FlavorPreferences;
  hasPlacedOrder: boolean;
  onShowGames: () => void;
  onUpdateFlavorPreferences: () => void;
  loyaltyProfile: LoyaltyProfile;
  weatherData: WeatherData | null;
  getWeatherIcon: (condition: string) => ReactNode;
  getPerfectWeatherMessage: (weather: WeatherData) => string;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  menuItems: MenuItemType[];
  onItemClick: (item: MenuItemType) => void;
  recommendations: Array<{ item: MenuItemType; reason: string }>;
  onAddToCart: (item: MenuItemType) => void;
  isLoading: boolean;
};

export function OrderingCatalog({
  tableNumber,
  userName,
  flavorPreferences,
  hasPlacedOrder,
  onShowGames,
  onUpdateFlavorPreferences,
  loyaltyProfile,
  weatherData,
  getWeatherIcon,
  getPerfectWeatherMessage,
  activeCategory,
  onSelectCategory,
  menuItems,
  onItemClick,
  recommendations,
  onAddToCart,
  isLoading,
}: OrderingCatalogProps) {
  const activeCategoryLabel =
    CATEGORY_OPTIONS.find((category) => category.id === activeCategory)?.label ?? "Mains";
  const activeMenuItems = menuItems.filter((item) => item.category === activeCategory);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full bg-[#F3F4F6]" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 bg-[#F3F4F6]" />
              <Skeleton className="h-3 w-24 bg-[#F3F4F6]" />
            </div>
          </div>
          <Skeleton className="h-20 w-full bg-[#F3F4F6]" />
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#0F1729]">Syncing your menu and rewards</p>
              <p className="text-xs text-[#6B7280]">Pulling the latest backend data for this session.</p>
            </div>
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37]" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={`menu-skeleton-${index}`}
                className="rounded-2xl border border-[#E5E7EB] p-4"
              >
                <Skeleton className="mb-4 h-40 w-full rounded-xl bg-[#F3F4F6]" />
                <Skeleton className="mb-2 h-4 w-2/3 bg-[#F3F4F6]" />
                <Skeleton className="mb-4 h-3 w-full bg-[#F3F4F6]" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16 bg-[#F3F4F6]" />
                  <Skeleton className="h-9 w-24 rounded-lg bg-[#F3F4F6]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="space-y-6">
        {weatherData && (
          <div className="paper-panel flex flex-col gap-4 rounded-[28px] border-[color:var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3">
              <div className="stamp-badge flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.14em]">
                {getWeatherIcon(weatherData.condition)}
                <span>{weatherData.temperature}F</span>
              </div>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--ink)]">
                  {getPerfectWeatherMessage(weatherData)}
                </h3>
                <p className="text-xs text-[color:var(--ink-soft)]">{weatherData.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="stamp-badge rounded-full px-4 py-2 text-xs uppercase tracking-[0.14em] text-[color:var(--ink)]">
                Table {tableNumber}
              </div>
              <div className="stamp-badge rounded-full px-4 py-2 text-xs uppercase tracking-[0.14em] text-[color:var(--ink)]">
                {userName}
              </div>
            </div>
          </div>
        )}

        <div className="paper-panel rounded-[28px] border-[color:var(--border)] p-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORY_OPTIONS.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`shrink-0 rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] transition-colors ${
                  activeCategory === category.id
                    ? "bg-[color:var(--ink)] text-[color:var(--paper)] shadow-[0_14px_30px_rgba(40,52,90,0.14)]"
                    : "border border-[color:var(--border)] bg-white/72 text-[color:var(--ink)] hover:border-[color:var(--gold)]/45 hover:bg-white"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="paper-panel rounded-[30px] border-[color:var(--border)] p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="menu-kicker mb-2">Menu</p>
              <h2 className="menu-title text-4xl text-[color:var(--ink)]">{activeCategoryLabel}</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {flavorPreferences && (
                <div className="rounded-full border border-emerald-600/18 bg-emerald-50 px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-emerald-700">
                  Personalized
                </div>
              )}
              {loyaltyProfile.isBirthday && (
                <div className="rounded-full border border-[color:var(--rose)]/20 bg-pink-50 px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-pink-700">
                  Birthday Bonus Active
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            {activeMenuItems.map((item) => (
              <div
                key={item.id}
                className="w-full cursor-pointer transition-transform hover:scale-[1.01]"
                onClick={() => onItemClick(item)}
              >
                <MenuItem item={item} onAddToCart={onAddToCart} />
              </div>
            ))}
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="paper-panel rounded-[30px] border-[color:var(--border)] p-6 sm:p-8">
            <div className="mb-8 flex flex-wrap items-center gap-4">
              <div className="relative rounded-[22px] bg-[linear-gradient(135deg,var(--ink),rgba(40,52,90,0.76))] p-3 shadow-xl">
                <Sparkles className="relative z-10 h-7 w-7 text-white" strokeWidth={2} />
                <div className="absolute inset-0 rounded-[22px] bg-gradient-to-t from-transparent to-white/20" />
                <CherryBlossom className="absolute -bottom-2 -right-2 opacity-90 drop-shadow-md" size={24} />
              </div>

              <div>
                <p className="menu-kicker mb-2">Suggested Dishes</p>
                <h2 className="menu-title text-4xl text-[color:var(--ink)]">Recommended for Your Table</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.item.id}
                  item={rec.item}
                  reason={rec.reason}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      <aside className="order-first space-y-4 self-start xl:order-none xl:sticky xl:top-24">
        <LoyaltyCard profile={loyaltyProfile} />

        <div className="paper-panel rounded-[30px] border-[color:var(--border)] p-5 sm:p-6">
          <p className="menu-kicker mb-2">Quick Actions</p>
          <h3 className="menu-title text-3xl text-[color:var(--ink)]">Your Table</h3>

          <div className="mt-5 space-y-3">
            <Button
              onClick={onUpdateFlavorPreferences}
              className="h-12 w-full rounded-[20px] bg-[color:var(--ink)] text-sm font-semibold text-[color:var(--paper)] shadow-[0_18px_34px_rgba(40,52,90,0.16)] hover:bg-[color:var(--ink)]/92"
            >
              <Sparkles className="mr-2 h-4 w-4 text-[color:var(--gold)]" />
              Update Taste Profile
            </Button>

            {hasPlacedOrder && (
              <Button
                variant="outline"
                onClick={onShowGames}
                className="h-12 w-full rounded-[20px] border-[color:var(--border)] bg-white/78 text-sm font-semibold text-[color:var(--ink)] hover:border-[color:var(--gold)]/45 hover:bg-white"
              >
                Play Games
              </Button>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[22px] border border-[color:var(--border)] bg-white/72 px-4 py-4">
              <p className="menu-kicker mb-2">Member</p>
              <p className="text-lg font-semibold text-[color:var(--ink)]">{userName}</p>
              <p className="mt-1 text-xs text-[color:var(--ink-soft)] capitalize">
                {loyaltyProfile.points} points | {loyaltyProfile.tier}
              </p>
            </div>

            <div className="rounded-[22px] border border-[color:var(--border)] bg-white/72 px-4 py-4">
              <p className="menu-kicker mb-2">Session</p>
              <p className="text-lg font-semibold text-[color:var(--ink)]">Table {tableNumber}</p>
              <p className="mt-1 text-xs text-[color:var(--ink-soft)]">Ready for ordering</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
