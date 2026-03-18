import { QrCode, UtensilsCrossed } from "lucide-react";
import { getWeatherIcon } from "../../data/ordering";
import type { WeatherData } from "../../types";

type OrderingHeaderProps = {
  tableNumber: string;
  weatherData: WeatherData | null;
};

export function OrderingHeader({ tableNumber, weatherData }: OrderingHeaderProps) {
  return (
    <header
      style={{ background: "var(--navy)", borderBottom: "1px solid var(--navy-light)" }}
      className="sticky top-0 z-50 shadow-md"
    >
      <div className="container mx-auto px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: "var(--gold)" }}
            >
              <UtensilsCrossed className="w-4 h-4" style={{ color: "var(--navy)" }} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h1
                className="text-base font-bold leading-tight tracking-wide"
                style={{ color: "var(--cream)", fontFamily: "'Georgia', serif" }}
              >
                Koryori Hayashi
              </h1>
              <p
                className="text-[10px]"
                style={{ color: "var(--gold-light)", letterSpacing: "0.15em" }}
              >
                小料理林
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {weatherData && (
              <div
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                style={{ background: "var(--navy-light)" }}
              >
                <span style={{ color: "var(--gold)" }}>{getWeatherIcon(weatherData.condition)}</span>
                <span className="text-xs font-semibold" style={{ color: "var(--cream)" }}>
                  {weatherData.temperature}°F
                </span>
              </div>
            )}
            <div
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
              style={{ background: "var(--navy-light)" }}
            >
              <QrCode className="w-3.5 h-3.5" style={{ color: "var(--gold)" }} />
              <span className="text-xs" style={{ color: "var(--cream-muted)" }}>
                Table
              </span>
              <span className="text-sm font-bold" style={{ color: "var(--cream)" }}>
                {tableNumber}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
