import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Users, Clock } from 'lucide-react';
import { Badge } from './ui/badge';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  shift: string;
  hours: string;
}

interface StaffScheduleCardProps {
  staffSchedule: StaffMember[];
  coverage: {
    peak: string;
    offPeak: string;
    peakHourRange: string;
  };
}

export function StaffScheduleCard({ staffSchedule, coverage }: StaffScheduleCardProps) {
  const getShiftColor = (shift: string) => {
    if (shift === 'Morning') return 'bg-blue-100 text-blue-800 border-blue-300';
    if (shift === 'Full') return 'bg-green-100 text-green-800 border-green-300';
    if (shift === 'Peak Rush') return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <Card className="border-2 border-gray-700 bg-gray-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="h-5 w-5 text-purple-400" />
          Today's Staff Schedule
        </CardTitle>
        <CardDescription className="text-gray-400">{staffSchedule.length} employees on duty</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {staffSchedule.map((staff) => (
            <div
              key={staff.id}
              className="flex items-center justify-between p-3 rounded-lg border-2 border-gray-700 hover:shadow-md hover:border-purple-500 transition-all bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                  {staff.name[0]}
                </div>
                <div>
                  <div className="font-semibold text-white">{staff.name}</div>
                  <div className="text-sm text-gray-400">{staff.role}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-gray-300">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span>{staff.hours}</span>
                </div>
                <Badge className={getShiftColor(staff.shift)}>
                  {staff.shift}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-2 border-blue-700 rounded-lg">
          <div className="text-sm font-semibold mb-2 text-blue-200">Coverage Status</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>Peak ({coverage.peakHourRange}):</span>
              <span className={`font-bold ${coverage.peak === 'Full' ? 'text-green-400' : 'text-yellow-400'}`}>
                {coverage.peak}
              </span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Off-Peak:</span>
              <span className={`font-bold ${coverage.offPeak === 'Adequate' ? 'text-green-400' : 'text-yellow-400'}`}>
                {coverage.offPeak}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
