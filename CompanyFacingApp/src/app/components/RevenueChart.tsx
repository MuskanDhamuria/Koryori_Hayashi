import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    forecast?: number;
  }>;
  showForecast?: boolean;
}

export function RevenueChart({ data, showForecast = false }: RevenueChartProps) {
  return (
    <Card className="border-2 border-gray-700 bg-gray-900">
      <CardHeader>
        <CardTitle className="text-white">Revenue Tracking</CardTitle>
        <CardDescription className="text-gray-400">Daily revenue with {showForecast ? 'forecast' : 'trend analysis'}</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {showForecast ? (
            <LineChart data={data} width={730} height={300}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                formatter={(value) => `$${value}`}
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '2px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#06b6d4" strokeWidth={2} name="Actual Revenue" />
              <Line type="monotone" dataKey="forecast" stroke="#14b8a6" strokeWidth={2} strokeDasharray="5 5" name="Forecast" />
            </LineChart>
          ) : (
            <AreaChart data={data} width={730} height={300}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                formatter={(value) => `$${value}`}
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '2px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
            </AreaChart>
          )}
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
