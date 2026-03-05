import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { AlertTriangle, Package, TrendingUp } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface InventoryAlert {
  item: {
    id: string;
    name: string;
    category: string;
    stock: number;
    reorderPoint: number;
  };
  daysUntilStockout: number;
  suggestedOrder: number;
}

interface InventoryAlertsProps {
  alerts: InventoryAlert[];
}

export function InventoryAlerts({ alerts }: InventoryAlertsProps) {
  const criticalAlerts = alerts.filter(a => a.daysUntilStockout <= 2);
  const warningAlerts = alerts.filter(a => a.daysUntilStockout > 2 && a.daysUntilStockout <= 7);

  return (
    <Card className="border-2 border-gray-700 bg-gray-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Package className="h-5 w-5 text-orange-400" />
          Inventory Optimization
        </CardTitle>
        <CardDescription className="text-gray-400">Automated reorder recommendations and stockout alerts</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {criticalAlerts.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-red-400">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  Critical - Order Immediately
                </h4>
                {criticalAlerts.map(alert => (
                  <Alert key={alert.item.id} className="mb-2 border-red-700 bg-red-900/30">
                    <AlertTitle className="flex items-center justify-between">
                      <span>{alert.item.name}</span>
                      <Badge variant="destructive">
                        {alert.daysUntilStockout} day{alert.daysUntilStockout !== 1 ? 's' : ''} left
                      </Badge>
                    </AlertTitle>
                    <AlertDescription className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Current Stock:</span>
                        <span className="font-medium">{alert.item.stock} units</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Reorder Point:</span>
                        <span className="font-medium">{alert.item.reorderPoint} units</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="font-semibold">Suggested Order:</span>
                        <span className="font-bold text-red-700">{alert.suggestedOrder} units</span>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {warningAlerts.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-yellow-600" />
                  Warning - Plan to Reorder
                </h4>
                {warningAlerts.map(alert => (
                  <Alert key={alert.item.id} className="mb-2 border-yellow-200 bg-yellow-50">
                    <AlertTitle className="flex items-center justify-between">
                      <span>{alert.item.name}</span>
                      <Badge variant="outline" className="border-yellow-600 text-yellow-600">
                        {alert.daysUntilStockout} days left
                      </Badge>
                    </AlertTitle>
                    <AlertDescription className="mt-2 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Current Stock:</span>
                        <span className="font-medium">{alert.item.stock} units</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Reorder Point:</span>
                        <span className="font-medium">{alert.item.reorderPoint} units</span>
                      </div>
                      {alert.suggestedOrder > 0 && (
                        <div className="flex justify-between text-sm pt-2 border-t">
                          <span className="font-semibold">Suggested Order:</span>
                          <span className="font-bold text-yellow-700">{alert.suggestedOrder} units</span>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {alerts.length === 0 && (
              <Alert className="border-green-200 bg-green-50">
                <AlertTitle>All Stock Levels Healthy</AlertTitle>
                <AlertDescription>
                  No immediate reordering required. All items are above their reorder points.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
