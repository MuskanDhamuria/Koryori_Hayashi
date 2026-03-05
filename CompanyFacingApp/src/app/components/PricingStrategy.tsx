import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { DollarSign, TrendingDown, TrendingUp, AlertCircle, Zap } from 'lucide-react';
import { Badge } from './ui/badge';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
}

interface ItemPerformance {
  item: MenuItem;
  totalRevenue?: number;
  revenue?: number;
  totalQuantity?: number;
  quantity?: number;
}

interface PricingStrategyProps {
  topItems: ItemPerformance[];
  worstItems: ItemPerformance[];
}

export function PricingStrategy({ topItems, worstItems }: PricingStrategyProps) {
  const calculateMargin = (item: MenuItem) => {
    return ((item.price - item.cost) / item.price) * 100;
  };

  const generatePricingRecommendation = (item: MenuItem, performance: 'best' | 'worst', quantity: number) => {
    const margin = calculateMargin(item);
    const recommendations: Array<{
      type: 'increase' | 'decrease' | 'discount' | 'bundle' | 'optimize';
      action: string;
      reason: string;
      suggestedPrice?: number;
      discount?: number;
    }> = [];

    if (performance === 'best') {
      // High performers
      if (margin < 50) {
        // Low margin but high volume - consider small price increase
        const suggestedPrice = item.price * 1.05; // 5% increase
        recommendations.push({
          type: 'increase',
          action: `Increase price to $${suggestedPrice.toFixed(2)}`,
          reason: 'High demand with low margin - customers willing to pay more',
          suggestedPrice,
        });
      } else if (margin > 70) {
        // Very high margin - maintain or slightly reduce to drive even more volume
        recommendations.push({
          type: 'optimize',
          action: 'Maintain current pricing',
          reason: 'Excellent margin and strong sales - optimal pricing achieved',
        });
      }

      // Bundle opportunity
      if (quantity > 50) {
        recommendations.push({
          type: 'bundle',
          action: 'Create combo meal',
          reason: 'High volume item - perfect for combo deals to increase average order value',
        });
      }
    } else {
      // Poor performers
      if (margin > 60) {
        // High margin but low sales - price too high
        const suggestedPrice = item.price * 0.90; // 10% decrease
        recommendations.push({
          type: 'decrease',
          action: `Reduce price to $${suggestedPrice.toFixed(2)}`,
          reason: 'High margin but low volume - price may be deterring customers',
          suggestedPrice,
        });
      }

      // Limited time discount
      const discountPercent = 15;
      recommendations.push({
        type: 'discount',
        action: `${discountPercent}% limited-time discount`,
        reason: 'Boost awareness and trial with promotional pricing',
        discount: discountPercent,
      });

      // Consider removing or replacing
      if (quantity < 10) {
        recommendations.push({
          type: 'optimize',
          action: 'Consider menu optimization',
          reason: 'Very low sales - may need recipe improvement or replacement',
        });
      }
    }

    return recommendations;
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-gray-700 bg-gray-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <DollarSign className="h-5 w-5 text-green-400" />
            Dynamic Pricing Recommendations
          </CardTitle>
          <CardDescription className="text-gray-400">
            AI-powered pricing suggestions based on performance and margins
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Best Performers */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Top Performers - Optimization</h3>
            </div>
            <div className="space-y-3">
              {topItems.slice(0, 3).map((performance) => {
                const margin = calculateMargin(performance.item);
                const quantity = performance.totalQuantity || performance.quantity || 0;
                const revenue = performance.totalRevenue || performance.revenue || 0;
                const recommendations = generatePricingRecommendation(
                  performance.item,
                  'best',
                  quantity
                );

                return (
                  <div
                    key={performance.item.id}
                    className="p-4 bg-gray-800 border-2 border-gray-700 rounded-lg hover:border-green-500 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white text-lg">{performance.item.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-green-900 text-green-200 border-green-700">
                            {performance.item.category}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            Sold: {quantity} | Revenue: ${revenue.toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">${performance.item.price}</div>
                        <div className={`text-sm font-semibold ${margin >= 60 ? 'text-green-400' : margin >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {margin.toFixed(1)}% margin
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border-2 ${
                            rec.type === 'increase'
                              ? 'bg-blue-900/30 border-blue-700'
                              : rec.type === 'bundle'
                              ? 'bg-purple-900/30 border-purple-700'
                              : 'bg-green-900/30 border-green-700'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {rec.type === 'increase' && <TrendingUp className="h-4 w-4 text-blue-400 mt-0.5" />}
                            {rec.type === 'bundle' && <Zap className="h-4 w-4 text-purple-400 mt-0.5" />}
                            {rec.type === 'optimize' && <DollarSign className="h-4 w-4 text-green-400 mt-0.5" />}
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-white">{rec.action}</div>
                              <div className="text-xs text-gray-400 mt-1">{rec.reason}</div>
                              {rec.suggestedPrice && (
                                <div className="text-xs text-blue-300 mt-1">
                                  Expected impact: +${((rec.suggestedPrice - performance.item.price) * performance.quantity).toFixed(0)} revenue
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Poor Performers */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="h-5 w-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Slow Movers - Boost Strategy</h3>
            </div>
            <div className="space-y-3">
              {worstItems.slice(0, 3).map((performance) => {
                const margin = calculateMargin(performance.item);
                const quantity = performance.totalQuantity || performance.quantity || 0;
                const revenue = performance.totalRevenue || performance.revenue || 0;
                const recommendations = generatePricingRecommendation(
                  performance.item,
                  'worst',
                  quantity
                );

                return (
                  <div
                    key={performance.item.id}
                    className="p-4 bg-gray-800 border-2 border-gray-700 rounded-lg hover:border-orange-500 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white text-lg">{performance.item.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-orange-900 text-orange-200 border-orange-700">
                            {performance.item.category}
                          </Badge>
                          <span className="text-sm text-gray-400">
                            Sold: {quantity} | Revenue: ${revenue.toFixed(0)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">${performance.item.price}</div>
                        <div className={`text-sm font-semibold ${margin >= 60 ? 'text-green-400' : margin >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {margin.toFixed(1)}% margin
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border-2 ${
                            rec.type === 'decrease'
                              ? 'bg-red-900/30 border-red-700'
                              : rec.type === 'discount'
                              ? 'bg-yellow-900/30 border-yellow-700'
                              : 'bg-orange-900/30 border-orange-700'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {rec.type === 'decrease' && <TrendingDown className="h-4 w-4 text-red-400 mt-0.5" />}
                            {rec.type === 'discount' && <Zap className="h-4 w-4 text-yellow-400 mt-0.5" />}
                            {rec.type === 'optimize' && <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5" />}
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-white">{rec.action}</div>
                              <div className="text-xs text-gray-400 mt-1">{rec.reason}</div>
                              {rec.suggestedPrice && (
                                <div className="text-xs text-yellow-300 mt-1">
                                  New price point may increase volume by 20-30%
                                </div>
                              )}
                              {rec.discount && (
                                <div className="text-xs text-yellow-300 mt-1">
                                  Promotional price: ${(performance.item.price * (1 - rec.discount / 100)).toFixed(2)} (limited time)
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strategic Insights */}
          <div className="p-4 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-700 rounded-lg">
            <div className="flex items-start gap-3">
              <Zap className="h-6 w-6 text-purple-400 mt-1" />
              <div>
                <h4 className="font-semibold text-white mb-2">Strategic Pricing Insights</h4>
                <ul className="text-sm text-purple-100 space-y-1">
                  <li>• Consider "Lunch Special" combo: Top ramen + drink for $14.99 (vs $17 separate)</li>
                  <li>• Weekend premium pricing (+10%) for high-demand items during peak 12-1 PM</li>
                  <li>• Early bird discount (11-11:30 AM): 10% off to distribute customer flow</li>
                  <li>• Loyalty punch card: Buy 5 lunches, get 6th free (increases repeat customers)</li>
                  <li>• Seasonal item rotation: Replace bottom 2 performers monthly with specials</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
