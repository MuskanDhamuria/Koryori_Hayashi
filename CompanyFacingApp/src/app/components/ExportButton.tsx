import { useState } from 'react';
import { Button } from './ui/button';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportData {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  todayOrders: number;
  weekOrders: number;
  avgMargin: number;
  topItems: Array<{ item: { name: string; category: string; price: number }; revenue: number; quantity: number }>;
  worstItems: Array<{ item: { name: string; category: string; price: number }; revenue: number; quantity: number }>;
  categoryData: Array<{ category: string; revenue: number; orders: number }>;
}

interface ExportButtonProps {
  data: ExportData;
}

export function ExportButton({ data }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header with Japanese styling
      doc.setFillColor(6, 182, 212); // Cyan
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('さくら Sakura Kitchen', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text('Smart Analytics Report', pageWidth / 2, 25, { align: 'center' });
      doc.text(new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }), pageWidth / 2, 32, { align: 'center' });

      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      let yPosition = 45;

      // Summary Metrics
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Performance Summary', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      const summaryData = [
        ['Metric', 'Value'],
        ['Today\'s Revenue', `$${(data.todayRevenue || 0).toFixed(2)}`],
        ['Weekly Revenue', `$${(data.weekRevenue || 0).toFixed(2)}`],
        ['Monthly Revenue', `$${(data.monthRevenue || 0).toFixed(2)}`],
        ['Today\'s Orders', (data.todayOrders || 0).toString()],
        ['Weekly Orders', (data.weekOrders || 0).toString()],
        ['Average Profit Margin', `${(data.avgMargin || 0).toFixed(1)}%`],
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [summaryData[0]],
        body: summaryData.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [6, 182, 212], textColor: 255 },
        margin: { left: 14, right: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Category Performance
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Revenue by Category', 14, yPosition);
      yPosition += 10;

      const categoryTableData = (data.categoryData || []).map(cat => [
        cat.category || '',
        `$${(cat.revenue || 0).toFixed(2)}`,
        (cat.orders || 0).toString(),
        `$${((cat.revenue || 0) / Math.max(cat.orders || 1, 1)).toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Category', 'Revenue', 'Orders', 'Avg Order Value']],
        body: categoryTableData,
        theme: 'striped',
        headStyles: { fillColor: [249, 115, 22], textColor: 255 },
        margin: { left: 14, right: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Top Items
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Best-Selling Items', 14, yPosition);
      yPosition += 10;

      const topItemsData = (data.topItems || []).map(item => [
        item.item?.name || '',
        item.item?.category || '',
        `$${(item.item?.price || 0).toFixed(2)}`,
        (item.quantity || 0).toString(),
        `$${(item.revenue || 0).toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Item', 'Category', 'Price', 'Quantity Sold', 'Revenue']],
        body: topItemsData,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        margin: { left: 14, right: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 15;

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Slow-Moving Items
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Slow-Moving Items', 14, yPosition);
      yPosition += 10;

      const worstItemsData = (data.worstItems || []).map(item => [
        item.item?.name || '',
        item.item?.category || '',
        `$${(item.item?.price || 0).toFixed(2)}`,
        (item.quantity || 0).toString(),
        `$${(item.revenue || 0).toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Item', 'Category', 'Price', 'Quantity Sold', 'Revenue']],
        body: worstItemsData,
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        margin: { left: 14, right: 14 },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} of ${pageCount} | Generated by Sakura Kitchen Analytics`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`sakura-kitchen-report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      let csvContent = 'Sakura Kitchen Analytics Report\n';
      csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

      // Summary Metrics
      csvContent += 'PERFORMANCE SUMMARY\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Today's Revenue,$${(data.todayRevenue || 0).toFixed(2)}\n`;
      csvContent += `Weekly Revenue,$${(data.weekRevenue || 0).toFixed(2)}\n`;
      csvContent += `Monthly Revenue,$${(data.monthRevenue || 0).toFixed(2)}\n`;
      csvContent += `Today's Orders,${data.todayOrders || 0}\n`;
      csvContent += `Weekly Orders,${data.weekOrders || 0}\n`;
      csvContent += `Average Profit Margin,${(data.avgMargin || 0).toFixed(1)}%\n\n`;

      // Category Performance
      csvContent += 'REVENUE BY CATEGORY\n';
      csvContent += 'Category,Revenue,Orders,Avg Order Value\n';
      (data.categoryData || []).forEach(cat => {
        const orders = cat.orders || 0;
        const revenue = cat.revenue || 0;
        csvContent += `${cat.category || ''},$${revenue.toFixed(2)},${orders},$${(revenue / Math.max(orders, 1)).toFixed(2)}\n`;
      });
      csvContent += '\n';

      // Top Items
      csvContent += 'BEST-SELLING ITEMS\n';
      csvContent += 'Item,Category,Price,Quantity Sold,Revenue\n';
      (data.topItems || []).forEach(item => {
        csvContent += `${item.item?.name || ''},${item.item?.category || ''},$${(item.item?.price || 0).toFixed(2)},${item.quantity || 0},$${(item.revenue || 0).toFixed(2)}\n`;
      });
      csvContent += '\n';

      // Slow-Moving Items
      csvContent += 'SLOW-MOVING ITEMS\n';
      csvContent += 'Item,Category,Price,Quantity Sold,Revenue\n';
      (data.worstItems || []).forEach(item => {
        csvContent += `${item.item?.name || ''},${item.item?.category || ''},$${(item.item?.price || 0).toFixed(2)},${item.quantity || 0},$${(item.revenue || 0).toFixed(2)}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `sakura-kitchen-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          disabled={isExporting}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white border border-teal-500/50"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export Report'}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
        <DropdownMenuItem 
          onClick={exportToPDF}
          className="gap-2 cursor-pointer text-white hover:bg-gray-700"
        >
          <FileText className="h-4 w-4 text-red-400" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={exportToCSV}
          className="gap-2 cursor-pointer text-white hover:bg-gray-700"
        >
          <FileSpreadsheet className="h-4 w-4 text-green-400" />
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
