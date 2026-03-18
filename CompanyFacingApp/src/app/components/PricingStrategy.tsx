import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { DollarSign, TrendingDown, TrendingUp, AlertCircle, Zap } from 'lucide-react';
import { Badge } from './ui/badge';

interface PricingStrategyProps {
  topPerformers: Array<{
    itemId: string;
    itemName: string;
    category: string;
    price: number;
    margin: number;
    quantity: number;
    revenue: number;
    action: string;
    reason: string;
  }>;
  slowMovers: Array<{
    itemId: string;
    itemName: string;
    category: string;
    price: number;
    margin: number;
    quantity: number;
    revenue: number;
    action: string;
    reason: string;
  }>;
  strategicInsights: string[];
}

export function PricingStrategy({ topPerformers, slowMovers, strategicInsights }: PricingStrategyProps) {
  return (
    <div className="space-y-4">
      <Card className="border-2 border-gray-700 bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <DollarSign className="h-5 w-5 text-green-400" />
            Dynamic Pricing Recommendations
          </CardTitle>
          <CardDescription className="text-gray-400">
            Backend-generated pricing guidance based on recent sales, stock, and margin mix
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Top Performers - Optimization</h3>
            </div>
            <div className="space-y-3">
              {topPerformers.map((performance) => (
                <div
                  key={performance.itemId}
                  className="p-4 bg-gray-800 border-2 border-gray-700 rounded-lg hover:border-green-500 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-white text-lg">{performance.itemName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-green-900 text-green-200 border-green-700">
                          {performance.category}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          Sold: {performance.quantity} | Revenue: ${performance.revenue.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">${performance.price}</div>
                      <div className={`text-sm font-semibold ${performance.margin >= 60 ? 'text-green-400' : performance.margin >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {performance.margin.toFixed(1)}% margin
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border-2 bg-blue-900/30 border-blue-700">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-white">{performance.action}</div>
                        <div className="text-xs text-gray-400 mt-1">{performance.reason}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="h-5 w-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Slow Movers - Boost Strategy</h3>
            </div>
            <div className="space-y-3">
              {slowMovers.map((performance) => (
                <div
                  key={performance.itemId}
                  className="p-4 bg-gray-800 border-2 border-gray-700 rounded-lg hover:border-orange-500 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-white text-lg">{performance.itemName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-orange-900 text-orange-200 border-orange-700">
                          {performance.category}
                        </Badge>
                        <span className="text-sm text-gray-400">
                          Sold: {performance.quantity} | Revenue: ${performance.revenue.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">${performance.price}</div>
                      <div className={`text-sm font-semibold ${performance.margin >= 60 ? 'text-green-400' : performance.margin >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {performance.margin.toFixed(1)}% margin
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border-2 bg-orange-900/30 border-orange-700">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-white">{performance.action}</div>
                        <div className="text-xs text-gray-400 mt-1">{performance.reason}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-700 rounded-lg">
            <div className="flex items-start gap-3">
              <Zap className="h-6 w-6 text-purple-400 mt-1" />
              <div>
                <h4 className="font-semibold text-white mb-2">Strategic Pricing Insights</h4>
                <ul className="text-sm text-purple-100 space-y-1">
                  {strategicInsights.map((insight) => (
                    <li key={insight}>{insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
