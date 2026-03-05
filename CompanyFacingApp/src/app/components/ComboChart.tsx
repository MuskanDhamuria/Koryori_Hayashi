import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';

interface ComboChartProps {
  data: Array<{
    date: string;
    revenue: number;
    orders: number;
    customers: number;
  }>;
}

export function ComboChart({ data }: ComboChartProps) {
  return (
    <Card className="border-2 border-gray-700 bg-gray-900">
      <CardHeader>
        <CardTitle className="text-white">Multi-Metric Performance</CardTitle>
        <CardDescription className="text-gray-400">Revenue, orders, and customer flow analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: '350px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} width={730} height={350}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
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
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              fill="#3b82f6"
              fillOpacity={0.3}
              stroke="#3b82f6"
              name="Revenue ($)"
            />
            <Bar
              yAxisId="right"
              dataKey="orders"
              fill="#10b981"
              name="Orders"
              radius={[8, 8, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="customers"
              stroke="#f59e0b"
              strokeWidth={3}
              name="Customers"
              dot={{ fill: '#f59e0b', r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
