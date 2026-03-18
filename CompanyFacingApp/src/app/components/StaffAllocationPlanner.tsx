import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Users } from 'lucide-react';

interface StaffAllocationPlannerProps {
  allocations: Array<{
    hour: number;
    label: string;
    shift: string;
    expectedSales: number;
    staffRequired: number;
    availableStaff: number;
    coverageStatus: string;
  }>;
}

export function StaffAllocationPlanner({ allocations }: StaffAllocationPlannerProps) {
  return (
    <Card className="border-2 border-gray-700 bg-gray-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="h-5 w-5 text-blue-400" />
          Staff Allocation Planner
        </CardTitle>
        <CardDescription className="text-gray-400">Recommended staffing based on backend demand analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allocations.map((allocation) => (
              <div key={allocation.hour} className="p-4 border-2 border-gray-700 rounded-lg bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold text-white">{allocation.label}</div>
                    <div className="text-sm text-gray-400">{allocation.shift}</div>
                  </div>
                  <Badge
                    variant="destructive"
                    className={
                      allocation.coverageStatus === 'Covered'
                        ? 'bg-emerald-600 border-emerald-700'
                        : allocation.coverageStatus === 'Tight'
                          ? 'bg-yellow-600 border-yellow-700'
                          : 'bg-red-600 border-red-700'
                    }
                  >
                    {allocation.coverageStatus}
                  </Badge>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>Expected Sales:</span>
                    <span className="font-medium">${allocation.expectedSales.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>Available Staff:</span>
                    <span className="font-medium">{allocation.availableStaff} people</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="font-semibold">Staff Required:</span>
                    <span className="font-bold text-blue-600">{allocation.staffRequired} people</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold mb-3 text-black">Shift Recommendations</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-black">
                <span>Opening:</span>
                <span className="font-semibold">Backed by current hourly revenue trend</span>
              </div>
              <div className="flex items-center justify-between text-black">
                <span>Peak Rush:</span>
                <span className="font-semibold text-red-600">Use the cards above for live coverage needs</span>
              </div>
              <div className="flex items-center justify-between text-black">
                <span>Closing:</span>
                <span className="font-semibold">Scale down once demand tapers</span>
              </div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
