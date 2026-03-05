import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface HourlySalesChartProps {
  data: Array<{
    hour: number;
    sales: number;
    isPeak?: boolean;
  }>;
}

export function HourlySalesChart({ data }: HourlySalesChartProps) {
  return (
    <Card className="border-2 border-gray-700 bg-gray-900">
      <CardHeader>
        <CardTitle className="text-white">Hourly Sales Analysis</CardTitle>
        <CardDescription className="text-gray-400">Sales distribution by hour with peak identification</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} width={730} height={300}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="hour" 
              tickFormatter={(hour) => `${hour}:00`}
              stroke="#9CA3AF"
            />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              formatter={(value) => `$${value}`}
              labelFormatter={(hour) => `Hour: ${hour}:00`}
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '2px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Bar dataKey="sales" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-hour-${entry.hour}-${index}`} fill={entry.isPeak ? '#06b6d4' : '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#6366f1]"></div>
            <span className="text-sm text-slate-300">Regular Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#06b6d4]"></div>
            <span className="text-sm text-slate-300">Peak Hours</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
