import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';

interface ForecastChartProps {
  data: Array<{
    date: string;
    actual?: number;
    forecast?: number;
    isHistorical: boolean;
  }>;
  itemName: string;
}

export function ForecastChart({ data, itemName }: ForecastChartProps) {
  return (
    <Card className="border-2 border-gray-700 bg-gray-900">
      <CardHeader>
        <CardTitle className="text-white">Demand Forecasting: {itemName}</CardTitle>
        <CardDescription className="text-gray-400">7-day forecast based on time-series analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} width={730} height={300}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis label={{ value: 'Quantity', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }} stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '2px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend />
            <ReferenceLine x={data.find(d => !d.isHistorical)?.date} stroke="#9CA3AF" strokeDasharray="3 3" label={{ value: "Today", fill: '#9CA3AF' }} />
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="#3b82f6" 
              strokeWidth={2} 
              name="Historical Sales"
              connectNulls
            />
            <Line 
              type="monotone" 
              dataKey="forecast" 
              stroke="#10b981" 
              strokeWidth={2} 
              strokeDasharray="5 5" 
              name="Forecasted Demand"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
