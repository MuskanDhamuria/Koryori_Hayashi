import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface SeasonalTrendsProps {
  data: Array<{
    period: string;
    revenue: number;
    orders: number;
    avgOrderValue: number;
  }>;
}

export function SeasonalTrends({ data }: SeasonalTrendsProps) {
  return (
    <Card className="border-2 border-gray-700 bg-gray-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="h-5 w-5 text-green-400" />
          Seasonal Trend Analysis
        </CardTitle>
        <CardDescription className="text-gray-400">Weekly comparison with growth indicators</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} width={730} height={300}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="period" stroke="#9CA3AF" />
            <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '2px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue ($)" radius={[8, 8, 0, 0]} />
            <Bar yAxisId="right" dataKey="orders" fill="#10b981" name="Orders" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.slice(-3).map((period, index) => {
            const prevPeriod = index > 0 ? data[data.length - 3 + index - 1] : null;
            const growth = prevPeriod 
              ? ((period.revenue - prevPeriod.revenue) / prevPeriod.revenue * 100).toFixed(1)
              : '0';
            
            return (
              <div key={period.period} className="p-3 border rounded-lg">
                <div className="text-sm text-muted-foreground">{period.period}</div>
                <div className="text-2xl font-bold mt-1">${period.revenue.toFixed(0)}</div>
                <div className="text-xs mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>Orders:</span>
                    <span className="font-medium">{period.orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Order:</span>
                    <span className="font-medium">${period.avgOrderValue.toFixed(2)}</span>
                  </div>
                  {prevPeriod && (
                    <div className={`flex justify-between pt-1 border-t ${parseFloat(growth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <span>Growth:</span>
                      <span className="font-semibold">
                        {parseFloat(growth) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(growth))}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
