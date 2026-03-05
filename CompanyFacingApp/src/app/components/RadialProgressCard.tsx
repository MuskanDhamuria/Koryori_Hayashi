import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

interface RadialProgressCardProps {
  title: string;
  value: number;
  max: number;
  color: string;
  label: string;
  subtitle?: string;
}

export function RadialProgressCard({ title, value, max, color, label, subtitle }: RadialProgressCardProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const data = [
    {
      name: label,
      value: percentage,
      fill: color,
    },
  ];

  return (
    <Card className="border-2 border-gray-700 bg-gray-900">
      <CardHeader>
        <CardTitle className="text-sm text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative w-full h-40">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart 
              width={200}
              height={160} 
              cx="50%" 
              cy="50%" 
              innerRadius="60%" 
              outerRadius="90%" 
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar
                background
                dataKey="value"
                cornerRadius={10}
                fill={color}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-white">{value}</div>
            <div className="text-sm text-gray-400">of {max}</div>
          </div>
        </div>
        {subtitle && (
          <div className="text-sm text-gray-400 text-center mt-2">
            {subtitle}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
