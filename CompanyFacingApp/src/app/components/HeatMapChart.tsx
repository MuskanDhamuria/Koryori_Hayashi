import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface HeatMapData {
  day: string;
  hours: { hour: number; value: number }[];
}

interface HeatMapChartProps {
  data: HeatMapData[];
}

export function HeatMapChart({ data }: HeatMapChartProps) {
  const getHeatColor = (value: number, max: number) => {
    const intensity = value / max;
    if (intensity > 0.8) return 'bg-red-500';
    if (intensity > 0.6) return 'bg-orange-400';
    if (intensity > 0.4) return 'bg-yellow-400';
    if (intensity > 0.2) return 'bg-green-400';
    return 'bg-blue-300';
  };

  const maxValue = Math.max(...data.flatMap(d => d.hours.map(h => h.value)));
  const hours = data[0]?.hours.map(h => h.hour) || [];

  return (
    <Card className="border-2 border-gray-700 bg-gray-900">
      <CardHeader>
        <CardTitle className="text-white">Sales Heat Map</CardTitle>
        <CardDescription className="text-gray-400">Busiest times of the week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Hour labels */}
            <div className="flex mb-2">
              <div className="w-20"></div>
              {hours.map(hour => (
                <div key={hour} className="w-16 text-center text-xs font-medium">
                  {hour}:00
                </div>
              ))}
            </div>

            {/* Heat map grid */}
            {data.map((dayData) => (
              <div key={dayData.day} className="flex mb-1">
                <div className="w-20 text-sm font-medium flex items-center text-white">
                  {dayData.day}
                </div>
                {dayData.hours.map((hourData) => (
                  <div
                    key={hourData.hour}
                    className={`w-16 h-12 m-0.5 rounded ${getHeatColor(hourData.value, maxValue)} 
                      flex items-center justify-center text-xs font-semibold text-white
                      transition-all hover:scale-110 hover:shadow-lg cursor-pointer`}
                    title={`${dayData.day} ${hourData.hour}:00 - $${hourData.value.toFixed(0)}`}
                  >
                    ${Math.round(hourData.value)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs">
          <span className="font-medium">Low</span>
          <div className="flex gap-1">
            <div className="w-6 h-6 bg-blue-300 rounded"></div>
            <div className="w-6 h-6 bg-green-400 rounded"></div>
            <div className="w-6 h-6 bg-yellow-400 rounded"></div>
            <div className="w-6 h-6 bg-orange-400 rounded"></div>
            <div className="w-6 h-6 bg-red-500 rounded"></div>
          </div>
          <span className="font-medium">High</span>
        </div>
      </CardContent>
    </Card>
  );
}
