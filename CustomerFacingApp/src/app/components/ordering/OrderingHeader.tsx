import { QrCode, UtensilsCrossed } from "lucide-react";
import { getWeatherIcon } from "../../data/ordering";
import type { WeatherData } from "../../types";

type OrderingHeaderProps = {
  tableNumber: string;
  weatherData: WeatherData | null;
};

export function OrderingHeader({ tableNumber, weatherData }: OrderingHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[rgba(248,244,234,0.88)] shadow-sm backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4 lg:px-8">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--ink)] text-[color:var(--gold)] shadow-[0_12px_26px_rgba(40,52,90,0.14)] sm:h-12 sm:w-12 sm:rounded-[18px] sm:shadow-[0_16px_32px_rgba(40,52,90,0.15)]">
              <UtensilsCrossed className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <p className="menu-kicker mb-0.5 text-xs sm:mb-1 sm:text-sm">Koryori Hayashi</p>
              <h1 className="menu-title truncate text-xl leading-none text-[color:var(--ink)] sm:text-2xl lg:text-3xl">Lunch Menu</h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {weatherData && (
              <div className="stamp-badge hidden items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] sm:flex sm:px-3 sm:py-2 sm:text-xs sm:tracking-[0.14em]">
                {getWeatherIcon(weatherData.condition)}
                <span>{weatherData.temperature}F</span>
              </div>
            )}

            <div className="stamp-badge flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[10px] uppercase tracking-[0.12em] sm:gap-2 sm:px-3 sm:py-2 sm:text-xs sm:tracking-[0.14em]">
              <QrCode className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Table {tableNumber}</span>
              <span className="sm:hidden">{tableNumber}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
