import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Users } from 'lucide-react';

interface PeakHour {
  hour: number;
  sales: number;
  isPeak: boolean;
}

interface StaffAllocationPlannerProps {
  peakHours: PeakHour[];
}

export function StaffAllocationPlanner({ peakHours }: StaffAllocationPlannerProps) {
  const calculateStaffNeeded = (sales: number): number => {
    // Simple formula for small shop: 1 staff per $200 in sales, max 5
    return Math.min(5, Math.max(2, Math.ceil(sales / 200)));
  };

  const getShiftRecommendation = (hour: number): string => {
    if (hour >= 12 && hour <= 13) return 'Peak Rush';
    if (hour === 11 || hour === 14 || hour === 15) return 'Off-Peak';
    return 'Lunch Service';
  };

  const peaks = peakHours.filter(p => p.isPeak);

  return (
    <Card className="border-2 border-gray-700 bg-gray-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="h-5 w-5 text-blue-400" />
          Staff Allocation Planner
        </CardTitle>
        <CardDescription className="text-gray-400">Recommended staffing based on peak hours analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {peaks.map(peak => {
              const staffNeeded = calculateStaffNeeded(peak.sales);
              const shift = getShiftRecommendation(peak.hour);
              
              return (
                <div key={peak.hour} className="p-4 border-2 border-gray-700 rounded-lg bg-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-white">{peak.hour}:00 - {peak.hour + 1}:00</div>
                      <div className="text-sm text-gray-400">{shift}</div>
                    </div>
                    <Badge variant="destructive" className="bg-red-600 border-red-700">Peak Hour</Badge>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Expected Sales:</span>
                      <span className="font-medium">${peak.sales.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="font-semibold">Staff Required:</span>
                      <span className="font-bold text-blue-600">{staffNeeded} people</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold mb-3 text-black">Shift Recommendations (Small Shop)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-black">
                <span>Opening (11:00 AM):</span>
                <span className="font-semibold">2-3 staff</span>
              </div>
              <div className="flex items-center justify-between text-black">
                <span>Peak Rush (12:00 - 1:00 PM):</span>
                <span className="font-semibold text-red-600">5 staff (All Hands)</span>
              </div>
              <div className="flex items-center justify-between text-black">
                <span>Closing (2:00 - 3:00 PM):</span>
                <span className="font-semibold">3-4 staff</span>
              </div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
