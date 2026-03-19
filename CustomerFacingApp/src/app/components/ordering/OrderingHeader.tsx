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
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[color:var(--ink)] text-[color:var(--gold)] shadow-[0_16px_32px_rgba(40,52,90,0.15)]">
                <UtensilsCrossed className="h-6 w-6" />
              </div>
              <div>
                <p className="menu-kicker mb-1">Koryori Hayashi</p>
                <h1 className="menu-title text-3xl leading-none text-[color:var(--ink)]">Lunch Menu</h1>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {weatherData && (
              <div className="stamp-badge flex items-center gap-2 rounded-full px-3 py-2 text-xs uppercase tracking-[0.14em]">
                {getWeatherIcon(weatherData.condition)}
                <span>{weatherData.temperature}F</span>
              </div>
            )}

            <div className="stamp-badge flex items-center gap-2 rounded-full px-3 py-2 text-xs uppercase tracking-[0.14em]">
              <QrCode className="h-3.5 w-3.5" />
              <span>Table {tableNumber}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
