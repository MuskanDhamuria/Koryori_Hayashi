import { Card, CardContent } from './ui/card';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { LucideIcon } from 'lucide-react';

interface SparklineCardProps {
  title: string;
  value: string | number;
  change: number;
  data: Array<{ value: number }>;
  icon: LucideIcon;
  color: string;
}

export function SparklineCard({ title, value, change, data, icon: Icon, color }: SparklineCardProps) {
  const isPositive = change >= 0;

  return (
    <Card className="border-2 border-gray-700 bg-gray-900 hover:shadow-lg hover:shadow-red-900/20 transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-400">{title}</p>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold text-white">{value}</p>
              <div className={`flex items-center text-sm font-semibold mb-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} width={96} height={48}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
