import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ArrowUp, ArrowDown, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ComparisonData {
  currentPeriod: {
    revenue: number;
    orders: number;
    avgOrderValue: number;
    margin: number;
  };
  previousPeriod: {
    revenue: number;
    orders: number;
    avgOrderValue: number;
    margin: number;
  };
  industryBenchmark: {
    avgOrderValue: number;
    margin: number;
    peakHourRevenue: number;
  };
}

interface ComparisonViewProps {
  data: ComparisonData;
}

export function ComparisonView({ data }: ComparisonViewProps) {
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const revenueChange = calculateChange(data.currentPeriod.revenue, data.previousPeriod.revenue);
  const ordersChange = calculateChange(data.currentPeriod.orders, data.previousPeriod.orders);
  const avgOrderChange = calculateChange(data.currentPeriod.avgOrderValue, data.previousPeriod.avgOrderValue);
  const marginChange = calculateChange(data.currentPeriod.margin, data.previousPeriod.margin);

  const chartData = [
    {
      metric: 'Revenue',
      'This Period': data.currentPeriod.revenue,
      'Last Period': data.previousPeriod.revenue,
    },
    {
      metric: 'Orders',
      'This Period': data.currentPeriod.orders,
      'Last Period': data.previousPeriod.orders,
    },
    {
      metric: 'Avg Order Value',
      'This Period': data.currentPeriod.avgOrderValue,
      'Last Period': data.previousPeriod.avgOrderValue,
    },
    {
      metric: 'Margin %',
      'This Period': data.currentPeriod.margin,
      'Last Period': data.previousPeriod.margin,
    },
  ];

  const MetricComparison = ({ 
    title, 
    current, 
    previous, 
    change, 
    format = 'number',
    benchmark
  }: { 
    title: string; 
    current: number; 
    previous: number; 
    change: number; 
    format?: 'number' | 'currency' | 'percent';
    benchmark?: number;
  }) => {
    const isPositive = change >= 0;
    const formatValue = (value: number) => {
      if (format === 'currency') return `$${value.toFixed(0)}`;
      if (format === 'percent') return `${value.toFixed(1)}%`;
      return value.toFixed(0);
    };

    const isBelowBenchmark = benchmark && current < benchmark;

    return (
      <div className="p-4 bg-gray-800 border-2 border-gray-700 rounded-lg hover:border-red-500 transition-all">
        <div className="text-sm text-gray-400 mb-2">{title}</div>
        <div className="flex items-end justify-between mb-3">
          <div className="text-3xl font-bold text-white">{formatValue(current)}</div>
          <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Previous: {formatValue(previous)}</span>
          {benchmark && (
            <span className={`${isBelowBenchmark ? 'text-yellow-400' : 'text-green-400'}`}>
              Industry: {formatValue(benchmark)}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-gray-700 bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5 text-red-400" />
            Period Comparison
          </CardTitle>
          <CardDescription className="text-gray-400">
            Compare current performance vs previous period and industry benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MetricComparison
              title="Revenue"
              current={data.currentPeriod.revenue}
              previous={data.previousPeriod.revenue}
              change={revenueChange}
              format="currency"
            />
            <MetricComparison
              title="Orders"
              current={data.currentPeriod.orders}
              previous={data.previousPeriod.orders}
              change={ordersChange}
            />
            <MetricComparison
              title="Avg Order Value"
              current={data.currentPeriod.avgOrderValue}
              previous={data.previousPeriod.avgOrderValue}
              change={avgOrderChange}
              format="currency"
              benchmark={data.industryBenchmark.avgOrderValue}
            />
            <MetricComparison
              title="Profit Margin"
              current={data.currentPeriod.margin}
              previous={data.previousPeriod.margin}
              change={marginChange}
              format="percent"
              benchmark={data.industryBenchmark.margin}
            />
          </div>

          <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} width={730} height={300}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="metric" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '2px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Legend />
              <Bar dataKey="This Period" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Last Period" fill="#64748b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-gray-700 bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <TrendingUp className="h-5 w-5 text-orange-400" />
            Industry Benchmarks
          </CardTitle>
          <CardDescription className="text-gray-400">
            How you compare to typical small Japanese lunch restaurants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-gray-800 border-2 border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Average Order Value</span>
                <span className="text-sm text-gray-500">Industry: ${data.industryBenchmark.avgOrderValue}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    data.currentPeriod.avgOrderValue >= data.industryBenchmark.avgOrderValue 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  }`}
                  style={{ width: `${Math.min((data.currentPeriod.avgOrderValue / data.industryBenchmark.avgOrderValue) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-white font-semibold">You: ${data.currentPeriod.avgOrderValue.toFixed(2)}</span>
                <span className={
                  data.currentPeriod.avgOrderValue >= data.industryBenchmark.avgOrderValue 
                    ? 'text-green-400' 
                    : 'text-yellow-400'
                }>
                  {data.currentPeriod.avgOrderValue >= data.industryBenchmark.avgOrderValue ? '✓ Above' : '⚠ Below'} Benchmark
                </span>
              </div>
            </div>

            <div className="p-4 bg-gray-800 border-2 border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Profit Margin</span>
                <span className="text-sm text-gray-500">Industry: {data.industryBenchmark.margin}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    data.currentPeriod.margin >= data.industryBenchmark.margin 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                      : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                  }`}
                  style={{ width: `${Math.min((data.currentPeriod.margin / data.industryBenchmark.margin) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-white font-semibold">You: {data.currentPeriod.margin.toFixed(1)}%</span>
                <span className={
                  data.currentPeriod.margin >= data.industryBenchmark.margin 
                    ? 'text-green-400' 
                    : 'text-yellow-400'
                }>
                  {data.currentPeriod.margin >= data.industryBenchmark.margin ? '✓ Above' : '⚠ Below'} Benchmark
                </span>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-2 border-blue-700 rounded-lg">
              <div className="text-sm font-semibold text-blue-200 mb-2">💡 Insights & Recommendations</div>
              <ul className="text-sm text-blue-100 space-y-1">
                {data.currentPeriod.avgOrderValue < data.industryBenchmark.avgOrderValue && (
                  <li>• Consider combo meals or upselling drinks to increase average order value</li>
                )}
                {data.currentPeriod.margin < data.industryBenchmark.margin && (
                  <li>• Review menu pricing and ingredient costs to improve margins</li>
                )}
                {revenueChange > 10 && (
                  <li>• Strong revenue growth! Consider expanding capacity during peak hours</li>
                )}
                <li>• Industry avg lunch rush covers 65-75% of daily revenue (12-1 PM)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
