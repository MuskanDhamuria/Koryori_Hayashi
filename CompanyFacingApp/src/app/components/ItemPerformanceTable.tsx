import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ItemPerformance {
  item: {
    id: string;
    name: string;
    category: string;
    price: number;
    cost: number;
  };
  totalRevenue: number;
  totalQuantity: number;
}

interface ItemPerformanceTableProps {
  title: string;
  description: string;
  items: ItemPerformance[];
  type: 'best' | 'worst';
}

export function ItemPerformanceTable({ title, description, items, type }: ItemPerformanceTableProps) {
  return (
    <Card className="border-2 border-gray-700 bg-gray-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          {type === 'best' ? <TrendingUp className="h-5 w-5 text-green-400" /> : <TrendingDown className="h-5 w-5 text-red-400" />}
          {title}
        </CardTitle>
        <CardDescription className="text-gray-400">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-gray-700 hover:bg-gray-800">
              <TableHead className="text-gray-300">Item</TableHead>
              <TableHead className="text-gray-300">Category</TableHead>
              <TableHead className="text-right text-gray-300">Quantity Sold</TableHead>
              <TableHead className="text-right text-gray-300">Revenue</TableHead>
              <TableHead className="text-right text-gray-300">Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((perf, index) => {
              const margin = ((perf.item.price - perf.item.cost) / perf.item.price * 100).toFixed(1);
              return (
                <TableRow key={perf.item.id} className="border-gray-700 hover:bg-gray-800">
                  <TableCell className="font-medium text-white">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">#{index + 1}</span>
                      {perf.item.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">{perf.item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-gray-300">{perf.totalQuantity}</TableCell>
                  <TableCell className="text-right text-gray-300">${perf.totalRevenue.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className={parseFloat(margin) > 60 ? 'text-green-400 font-medium' : 'text-gray-300'}>
                      {margin}%
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
