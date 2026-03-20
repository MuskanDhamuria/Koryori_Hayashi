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
      <div className="space-y-4 sm:space-y-6">
        <div className="max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-3 flex items-center gap-2.5 sm:gap-3">
            <Skeleton className="h-10 w-10 rounded-full bg-[#F3F4F6] sm:h-12 sm:w-12" />
            <div className="space-y-1.5 sm:space-y-2">
              <Skeleton className="h-3.5 w-28 bg-[#F3F4F6] sm:h-4 sm:w-32" />
              <Skeleton className="h-2.5 w-20 bg-[#F3F4F6] sm:h-3 sm:w-24" />
            </div>
          </div>
          <Skeleton className="h-16 w-full bg-[#F3F4F6] sm:h-20" />
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[#0F1729] sm:text-sm">Syncing your menu and rewards</p>
              <p className="text-[11px] text-[#6B7280] sm:text-xs">Pulling the latest backend data for this session.</p>
            </div>
            <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37] sm:h-6 sm:w-6" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={`menu-skeleton-${index}`}
                className="rounded-2xl border border-[#E5E7EB] p-3 sm:p-4"
              >
                <Skeleton className="mb-3 h-32 w-full rounded-xl bg-[#F3F4F6] sm:mb-4 sm:h-40" />
                <Skeleton className="mb-2 h-3.5 w-2/3 bg-[#F3F4F6] sm:h-4" />
                <Skeleton className="mb-3 h-2.5 w-full bg-[#F3F4F6] sm:mb-4 sm:h-3" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-14 bg-[#F3F4F6] sm:h-4 sm:w-16" />
                  <Skeleton className="h-8 w-20 rounded-lg bg-[#F3F4F6] sm:h-9 sm:w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="min-w-0 space-y-4 sm:space-y-6">
        {weatherData && (
          <div className="paper-panel flex flex-col gap-3 rounded-3xl border-[color:var(--border)] p-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-[28px] sm:p-4 lg:p-5">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="stamp-badge flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] sm:gap-2 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.14em]">
                {getWeatherIcon(weatherData.condition)}
                <span>{weatherData.temperature}F</span>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--ink)] sm:text-sm sm:tracking-[0.14em]">
                  {getPerfectWeatherMessage(weatherData)}
                </h3>
                <p className="text-[11px] text-[color:var(--ink-soft)] sm:text-xs">{weatherData.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <div className="stamp-badge rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-[color:var(--ink)] sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.14em]">
                Table {tableNumber}
              </div>
              <div className="stamp-badge rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-[color:var(--ink)] sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.14em]">
                {userName}
              </div>
            </div>
          </div>
        )}

        <div className="paper-panel rounded-3xl border-[color:var(--border)] p-2.5 sm:rounded-[28px] sm:p-3">
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:gap-2">
            {CATEGORY_OPTIONS.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors sm:px-5 sm:py-3 sm:text-sm sm:tracking-[0.14em] ${
                  activeCategory === category.id
                    ? "bg-[color:var(--ink)] text-[color:var(--paper)] shadow-[0_12px_26px_rgba(40,52,90,0.12)] sm:shadow-[0_14px_30px_rgba(40,52,90,0.14)]"
                    : "border border-[color:var(--border)] bg-white/72 text-[color:var(--ink)] hover:border-[color:var(--gold)]/45 hover:bg-white"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="paper-panel rounded-3xl border-[color:var(--border)] p-4 sm:rounded-[30px] sm:p-6 lg:p-8">
          <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
            <div>
              <p className="menu-kicker mb-1.5 text-xs sm:mb-2 sm:text-sm">Menu</p>
              <h2 className="menu-title text-2xl text-[color:var(--ink)] sm:text-3xl lg:text-4xl">{activeCategoryLabel}</h2>
            </div>

            {/* Birthday bonus badge kept, Personalized badge removed */}
            {loyaltyProfile.isBirthday && (
              <div className="rounded-full border border-[color:var(--rose)]/20 bg-pink-50 px-2.5 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-pink-700 sm:px-3 sm:py-2 sm:text-xs sm:tracking-[0.14em]">
                Birthday Bonus Active
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-5 md:grid-cols-2">
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
          <div className="paper-panel overflow-hidden rounded-3xl border-[color:var(--border)] sm:rounded-[30px]">
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="mb-6 flex flex-wrap items-center gap-3 sm:mb-8 sm:gap-4">
                <div className="relative rounded-2xl bg-[linear-gradient(135deg,var(--ink),rgba(40,52,90,0.76))] p-2.5 shadow-xl sm:rounded-[22px] sm:p-3">
                  <Sparkles className="relative z-10 h-6 w-6 text-white sm:h-7 sm:w-7" strokeWidth={2} />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/20 sm:rounded-[22px]" />
                  <CherryBlossom className="absolute -bottom-1.5 -right-1.5 opacity-90 drop-shadow-md sm:-bottom-2 sm:-right-2" size={20} />
                </div>

                <div>
                  <p className="menu-kicker mb-1.5 text-xs sm:mb-2 sm:text-sm">Suggested Dishes</p>
                  <h2 className="menu-title text-2xl text-[color:var(--ink)] sm:text-3xl lg:text-4xl">Recommended for Your Table</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 2xl:grid-cols-3">
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
          </div>
        )}
      </section>

      <aside className="order-first space-y-3 self-start sm:space-y-4 xl:order-none xl:sticky xl:top-24">
        <LoyaltyCard profile={loyaltyProfile} />

        <div className="paper-panel rounded-3xl border-[color:var(--border)] p-4 sm:rounded-[30px] sm:p-5 lg:p-6">
          <p className="menu-kicker mb-1.5 text-xs sm:mb-2 sm:text-sm">Quick Actions</p>
          <h3 className="menu-title text-2xl text-[color:var(--ink)] sm:text-3xl">Your Table</h3>

          <div className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3">
            <Button
              onClick={onUpdateFlavorPreferences}
              className="h-11 w-full rounded-2xl bg-[color:var(--ink)] text-xs font-semibold text-[color:var(--paper)] shadow-[0_14px_28px_rgba(40,52,90,0.14)] hover:bg-[color:var(--ink)]/92 sm:h-12 sm:rounded-[20px] sm:text-sm sm:shadow-[0_18px_34px_rgba(40,52,90,0.16)]"
            >
              <Sparkles className="mr-2 h-3.5 w-3.5 text-[color:var(--gold)] sm:h-4 sm:w-4" />
              Update Taste Profile
            </Button>

            {hasPlacedOrder && (
              <Button
                variant="outline"
                onClick={onShowGames}
                className="h-11 w-full rounded-2xl border-[color:var(--border)] bg-white/78 text-xs font-semibold text-[color:var(--ink)] hover:border-[color:var(--gold)]/45 hover:bg-white sm:h-12 sm:rounded-[20px] sm:text-sm"
              >
                Play Games
              </Button>
            )}
          </div>

          <div className="mt-4 grid gap-2.5 sm:mt-5 sm:grid-cols-2 sm:gap-3 xl:grid-cols-1">
            <div className="rounded-2xl border border-[color:var(--border)] bg-white/72 px-3 py-3 sm:rounded-[22px] sm:px-4 sm:py-4">
              <p className="menu-kicker mb-1.5 text-xs sm:mb-2 sm:text-sm">Member</p>
              <p className="text-base font-semibold text-[color:var(--ink)] sm:text-lg">{userName}</p>
              <p className="mt-1 text-xs capitalize text-[color:var(--ink-soft)]">
                {loyaltyProfile.points} points | {loyaltyProfile.tier}
              </p>
            </div>

            <div className="rounded-2xl border border-[color:var(--border)] bg-white/72 px-3 py-3 sm:rounded-[22px] sm:px-4 sm:py-4">
              <p className="menu-kicker mb-1.5 text-xs sm:mb-2 sm:text-sm">Session</p>
              <p className="text-base font-semibold text-[color:var(--ink)] sm:text-lg">Table {tableNumber}</p>
              <p className="mt-1 text-xs text-[color:var(--ink-soft)]">Ready for ordering</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
