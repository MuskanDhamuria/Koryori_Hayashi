// Mock data generator for Japanese restaurant analytics

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  reorderPoint: number;
}

export interface SalesRecord {
  date: Date;
  hour: number;
  itemId: string;
  quantity: number;
  revenue: number;
}

export const menuItems: MenuItem[] = [
  // Sushi
  { id: 's1', name: 'Salmon Nigiri', category: 'Sushi', price: 12, cost: 5, stock: 45, reorderPoint: 20 },
  { id: 's2', name: 'Tuna Nigiri', category: 'Sushi', price: 14, cost: 6, stock: 38, reorderPoint: 20 },
  { id: 's3', name: 'California Roll', category: 'Sushi', price: 10, cost: 4, stock: 52, reorderPoint: 15 },
  { id: 's4', name: 'Spicy Tuna Roll', category: 'Sushi', price: 11, cost: 4.5, stock: 41, reorderPoint: 15 },
  { id: 's5', name: 'Dragon Roll', category: 'Sushi', price: 16, cost: 7, stock: 28, reorderPoint: 10 },
  { id: 's6', name: 'Rainbow Roll', category: 'Sushi', price: 15, cost: 6.5, stock: 33, reorderPoint: 10 },
  
  // Ramen
  { id: 'r1', name: 'Tonkotsu Ramen', category: 'Ramen', price: 14, cost: 5, stock: 60, reorderPoint: 25 },
  { id: 'r2', name: 'Shoyu Ramen', category: 'Ramen', price: 13, cost: 4.5, stock: 55, reorderPoint: 25 },
  { id: 'r3', name: 'Miso Ramen', category: 'Ramen', price: 13, cost: 4.5, stock: 58, reorderPoint: 25 },
  { id: 'r4', name: 'Spicy Ramen', category: 'Ramen', price: 14, cost: 5, stock: 18, reorderPoint: 25 },
  
  // Tempura
  { id: 't1', name: 'Shrimp Tempura', category: 'Tempura', price: 12, cost: 5, stock: 42, reorderPoint: 20 },
  { id: 't2', name: 'Vegetable Tempura', category: 'Tempura', price: 9, cost: 3, stock: 48, reorderPoint: 20 },
  { id: 't3', name: 'Mixed Tempura', category: 'Tempura', price: 15, cost: 6, stock: 35, reorderPoint: 15 },
  
  // Don (Rice Bowls)
  { id: 'd1', name: 'Katsu Don', category: 'Don', price: 12, cost: 4.5, stock: 44, reorderPoint: 20 },
  { id: 'd2', name: 'Oyako Don', category: 'Don', price: 11, cost: 4, stock: 50, reorderPoint: 20 },
  { id: 'd3', name: 'Unagi Don', category: 'Don', price: 18, cost: 8, stock: 25, reorderPoint: 15 },
  
  // Appetizers
  { id: 'a1', name: 'Edamame', category: 'Appetizer', price: 5, cost: 1.5, stock: 70, reorderPoint: 30 },
  { id: 'a2', name: 'Gyoza', category: 'Appetizer', price: 7, cost: 2.5, stock: 62, reorderPoint: 25 },
  { id: 'a3', name: 'Takoyaki', category: 'Appetizer', price: 8, cost: 3, stock: 38, reorderPoint: 20 },
  { id: 'a4', name: 'Agedashi Tofu', category: 'Appetizer', price: 6, cost: 2, stock: 45, reorderPoint: 20 },
  
  // Drinks
  { id: 'dr1', name: 'Green Tea', category: 'Drink', price: 3, cost: 0.5, stock: 100, reorderPoint: 40 },
  { id: 'dr2', name: 'Sake (small)', category: 'Drink', price: 8, cost: 3, stock: 55, reorderPoint: 25 },
  { id: 'dr3', name: 'Asahi Beer', category: 'Drink', price: 6, cost: 2.5, stock: 72, reorderPoint: 30 },
];

// Generate historical sales data for the past 30 days
export function generateHistoricalSales(days: number = 30): SalesRecord[] {
  const sales: SalesRecord[] = [];
  const now = new Date();
  
  for (let day = days; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    
    // Skip if not a business day (restaurants typically open every day)
    // Determine if it's a weekend for higher traffic
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseMultiplier = isWeekend ? 1.4 : 1.0;
    
    // Operating hours: 11 AM - 3 PM (lunch only)
    for (let hour = 11; hour <= 15; hour++) {
      // Peak hours: 12-1 PM (lunch rush)
      let hourMultiplier = 1.0;
      if (hour >= 12 && hour <= 13) {
        hourMultiplier = 3.0; // Very busy lunch rush
      } else if (hour === 11 || hour === 14 || hour === 15) {
        hourMultiplier = 0.6; // Slower at opening and closing
      }
      
      // Generate sales for each menu item
      menuItems.forEach(item => {
        // Different items have different popularity
        let itemPopularity = 1.0;
        if (item.category === 'Ramen') itemPopularity = 1.5;
        if (item.category === 'Sushi') itemPopularity = 1.3;
        if (item.category === 'Drink') itemPopularity = 1.2;
        if (item.category === 'Appetizer') itemPopularity = 0.9;
        
        // Calculate expected quantity with some randomness (reduced for small shop)
        const baseQuantity = Math.random() * 1.5 * baseMultiplier * hourMultiplier * itemPopularity;
        const quantity = Math.floor(baseQuantity);
        
        if (quantity > 0) {
          sales.push({
            date,
            hour,
            itemId: item.id,
            quantity,
            revenue: quantity * item.price,
          });
        }
      });
    }
  }
  
  return sales;
}

// Simple linear regression for forecasting
export function forecastNextWeek(historicalSales: SalesRecord[], itemId: string): number[] {
  const itemSales = historicalSales.filter(s => s.itemId === itemId);
  
  // Group by day
  const dailySales: { [key: string]: number } = {};
  itemSales.forEach(sale => {
    const dateKey = sale.date.toISOString().split('T')[0];
    dailySales[dateKey] = (dailySales[dateKey] || 0) + sale.quantity;
  });
  
  const days = Object.keys(dailySales).sort();
  const quantities = days.map(day => dailySales[day]);
  
  // Simple moving average for next 7 days
  const windowSize = 7;
  const recentAvg = quantities.slice(-windowSize).reduce((a, b) => a + b, 0) / windowSize;
  
  // Calculate trend
  const trend = quantities.length > 1 
    ? (quantities[quantities.length - 1] - quantities[0]) / quantities.length
    : 0;
  
  // Forecast next 7 days
  const forecast: number[] = [];
  for (let i = 0; i < 7; i++) {
    const prediction = Math.max(0, recentAvg + (trend * i));
    forecast.push(Math.round(prediction));
  }
  
  return forecast;
}

// Calculate peak hours from sales data
export function calculatePeakHours(sales: SalesRecord[]): { hour: number; totalSales: number }[] {
  const hourlyTotals: { [hour: number]: number } = {};
  
  sales.forEach(sale => {
    hourlyTotals[sale.hour] = (hourlyTotals[sale.hour] || 0) + sale.revenue;
  });
  
  return Object.entries(hourlyTotals)
    .map(([hour, totalSales]) => ({ hour: parseInt(hour), totalSales }))
    .sort((a, b) => a.hour - b.hour);
}

// Get top performing items
export function getTopItems(
  sales: SalesRecord[],
  availableMenuItems: MenuItem[] = menuItems,
  limit: number = 5
): { item: MenuItem; totalRevenue: number; totalQuantity: number }[] {
  const itemStats: { [itemId: string]: { revenue: number; quantity: number } } = {};
  
  sales.forEach(sale => {
    if (!itemStats[sale.itemId]) {
      itemStats[sale.itemId] = { revenue: 0, quantity: 0 };
    }
    itemStats[sale.itemId].revenue += sale.revenue;
    itemStats[sale.itemId].quantity += sale.quantity;
  });
  
  return Object.entries(itemStats)
    .map(([itemId, stats]) => ({
      item: availableMenuItems.find(m => m.id === itemId)!,
      totalRevenue: stats.revenue,
      totalQuantity: stats.quantity,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, limit);
}

// Get worst performing items
export function getWorstItems(
  sales: SalesRecord[],
  availableMenuItems: MenuItem[] = menuItems,
  limit: number = 5
): { item: MenuItem; totalRevenue: number; totalQuantity: number }[] {
  const itemStats: { [itemId: string]: { revenue: number; quantity: number } } = {};
  
  // Initialize all items with 0
  availableMenuItems.forEach(item => {
    itemStats[item.id] = { revenue: 0, quantity: 0 };
  });
  
  sales.forEach(sale => {
    itemStats[sale.itemId].revenue += sale.revenue;
    itemStats[sale.itemId].quantity += sale.quantity;
  });
  
  return Object.entries(itemStats)
    .map(([itemId, stats]) => ({
      item: availableMenuItems.find(m => m.id === itemId)!,
      totalRevenue: stats.revenue,
      totalQuantity: stats.quantity,
    }))
    .sort((a, b) => a.totalRevenue - b.totalRevenue)
    .slice(0, limit);
}

// Get items that need reordering
export function getReorderAlerts(): { item: MenuItem; daysUntilStockout: number; suggestedOrder: number }[] {
  // Using a simple calculation based on average daily usage
  const avgDailyUsage: { [itemId: string]: number } = {
    's1': 8, 's2': 7, 's3': 10, 's4': 9, 's5': 5, 's6': 6,
    'r1': 12, 'r2': 10, 'r3': 11, 'r4': 9,
    't1': 8, 't2': 7, 't3': 6,
    'd1': 7, 'd2': 8, 'd3': 4,
    'a1': 15, 'a2': 12, 'a3': 7, 'a4': 8,
    'dr1': 20, 'dr2': 10, 'dr3': 15,
  };
  
  return menuItems
    .map(item => {
      const dailyUsage = avgDailyUsage[item.id] || 5;
      const daysUntilStockout = Math.floor(item.stock / dailyUsage);
      const suggestedOrder = item.reorderPoint <= item.stock ? 0 : (item.reorderPoint * 3 - item.stock);
      
      return {
        item,
        daysUntilStockout,
        suggestedOrder,
      };
    })
    .filter(alert => alert.daysUntilStockout <= 7 || alert.suggestedOrder > 0)
    .sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);
}
