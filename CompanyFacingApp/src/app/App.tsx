import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { MetricCard } from './components/MetricCard';
import { RevenueChart } from './components/RevenueChart';
import { HourlySalesChart } from './components/HourlySalesChart';
import { ItemPerformanceTable } from './components/ItemPerformanceTable';
import { ForecastChart } from './components/ForecastChart';
import { InventoryAlerts } from './components/InventoryAlerts';
import { StaffAllocationPlanner } from './components/StaffAllocationPlanner';
import { SeasonalTrends } from './components/SeasonalTrends';
import { CategoryPieChart } from './components/CategoryPieChart';
import { RadialProgressCard } from './components/RadialProgressCard';
import { HeatMapChart } from './components/HeatMapChart';
import { ComboChart } from './components/ComboChart';
import { SparklineCard } from './components/SparklineCard';
import { StaffScheduleCard } from './components/StaffScheduleCard';
import { ExportButton } from './components/ExportButton';
import { ComparisonView } from './components/ComparisonView';
import { PricingStrategy } from './components/PricingStrategy';
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Percent,
  BarChart3,
  Clock,
  Package,
  Brain,
  Utensils,
  Users,
  Target,
  Zap,
  ArrowUpDown
} from 'lucide-react';
import { 
  generateHistoricalSales, 
  calculatePeakHours, 
  getTopItems, 
  getWorstItems,
  getReorderAlerts,
  forecastNextWeek,
  menuItems,
  SalesRecord
} from './utils/mockData';

export default function App() {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [historicalSales, setHistoricalSales] = useState<SalesRecord[]>([]);

  useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add('dark');
    const sales = generateHistoricalSales(30);
    setHistoricalSales(sales);
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    if (historicalSales.length === 0) return null;

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todaySales = historicalSales.filter(s => s.date >= oneDayAgo);
    const weekSales = historicalSales.filter(s => s.date >= oneWeekAgo);
    const monthSales = historicalSales;

    const todayRevenue = todaySales.reduce((sum, s) => sum + s.revenue, 0);
    const weekRevenue = weekSales.reduce((sum, s) => sum + s.revenue, 0);
    const monthRevenue = monthSales.reduce((sum, s) => sum + s.revenue, 0);

    const todayOrders = todaySales.length;
    const weekOrders = weekSales.length;

    const prevWeekSales = historicalSales.filter(s => {
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      return s.date >= twoWeeksAgo && s.date < oneWeekAgo;
    });
    const prevWeekRevenue = prevWeekSales.reduce((sum, s) => sum + s.revenue, 0);
    const prevWeekOrders = prevWeekSales.length;

    const totalCost = historicalSales.reduce((sum, s) => {
      const item = menuItems.find(m => m.id === s.itemId);
      return sum + (item ? item.cost * s.quantity : 0);
    }, 0);
    const avgMargin = ((monthRevenue - totalCost) / monthRevenue * 100);

    const avgOrderValue = weekRevenue / weekOrders;
    const prevAvgOrderValue = prevWeekRevenue / prevWeekOrders;

    // Calculate sparkline data for last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      const dateKey = date.toISOString().split('T')[0];
      const daySales = historicalSales.filter(s => 
        s.date.toISOString().split('T')[0] === dateKey
      );
      return { value: daySales.reduce((sum, s) => sum + s.revenue, 0) };
    });

    return {
      todayRevenue,
      weekRevenue,
      monthRevenue,
      todayOrders,
      weekOrders,
      avgMargin,
      avgOrderValue,
      weekGrowth: prevWeekRevenue > 0 ? ((weekRevenue - prevWeekRevenue) / prevWeekRevenue * 100) : 0,
      sparklineData: last7Days,
      prevWeekRevenue,
      prevWeekOrders,
      prevAvgOrderValue,
    };
  }, [historicalSales]);

  // Category breakdown
  const categoryData = useMemo(() => {
    if (historicalSales.length === 0) return [];

    const categoryStats: { [key: string]: { revenue: number; orders: number } } = {};
    
    historicalSales.forEach(sale => {
      const item = menuItems.find(m => m.id === sale.itemId);
      if (item) {
        if (!categoryStats[item.category]) {
          categoryStats[item.category] = { revenue: 0, orders: 0 };
        }
        categoryStats[item.category].revenue += sale.revenue;
        categoryStats[item.category].orders += 1;
      }
    });

    return Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      revenue: stats.revenue,
      orders: stats.orders,
    }));
  }, [historicalSales]);

  // Heat map data
  const heatMapData = useMemo(() => {
    if (historicalSales.length === 0) return [];

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = [11, 12, 13, 14, 15];
    
    const weekData: { [day: number]: { [hour: number]: number } } = {};
    
    historicalSales.forEach(sale => {
      const day = sale.date.getDay();
      if (!weekData[day]) weekData[day] = {};
      if (!weekData[day][sale.hour]) weekData[day][sale.hour] = 0;
      weekData[day][sale.hour] += sale.revenue;
    });

    return dayNames.map((day, dayIndex) => ({
      day,
      hours: hours.map(hour => ({
        hour,
        value: weekData[dayIndex]?.[hour] || 0,
      })),
    }));
  }, [historicalSales]);

  // Combo chart data
  const comboData = useMemo(() => {
    if (historicalSales.length === 0) return [];

    const dailyStats: { [key: string]: { revenue: number; orders: number; customers: number } } = {};
    
    historicalSales.forEach(sale => {
      const dateKey = sale.date.toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { revenue: 0, orders: 0, customers: 0 };
      }
      dailyStats[dateKey].revenue += sale.revenue;
      dailyStats[dateKey].orders += 1;
      dailyStats[dateKey].customers += Math.round(sale.quantity / 2); // Estimate
    });

    return Object.keys(dailyStats).sort().slice(-14).map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: dailyStats[date].revenue,
      orders: dailyStats[date].orders,
      customers: dailyStats[date].customers,
    }));
  }, [historicalSales]);

  const revenueChartData = useMemo(() => {
    if (historicalSales.length === 0) return [];

    const dailyRevenue: { [key: string]: number } = {};
    historicalSales.forEach(sale => {
      const dateKey = sale.date.toISOString().split('T')[0];
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + sale.revenue;
    });

    const sortedDates = Object.keys(dailyRevenue).sort();
    
    if (selectedPeriod === 'daily') {
      return sortedDates.slice(-7).map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dailyRevenue[date],
      }));
    } else if (selectedPeriod === 'weekly') {
      const weeklyData: { [key: string]: number } = {};
      sortedDates.forEach(date => {
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        weeklyData[weekKey] = (weeklyData[weekKey] || 0) + dailyRevenue[date];
      });
      
      return Object.keys(weeklyData).sort().slice(-4).map(week => ({
        date: `Week ${new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        revenue: weeklyData[week],
      }));
    } else {
      return sortedDates.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dailyRevenue[date],
      }));
    }
  }, [historicalSales, selectedPeriod]);

  const hourlySalesData = useMemo(() => {
    if (historicalSales.length === 0) return [];

    const peakHours = calculatePeakHours(historicalSales);
    const avgSales = peakHours.reduce((sum, h) => sum + h.totalSales, 0) / peakHours.length;
    
    return peakHours.map(h => ({
      hour: h.hour,
      sales: h.totalSales,
      isPeak: h.totalSales > avgSales * 1.5,
    }));
  }, [historicalSales]);

  const topItems = useMemo(() => getTopItems(historicalSales, 5), [historicalSales]);
  const worstItems = useMemo(() => getWorstItems(historicalSales, 5), [historicalSales]);

  const forecastData = useMemo(() => {
    if (topItems.length === 0) return [];

    const topItem = topItems[0].item;
    const forecast = forecastNextWeek(historicalSales, topItem.id);
    
    const dailySales: { [key: string]: number } = {};
    historicalSales
      .filter(s => s.itemId === topItem.id)
      .forEach(sale => {
        const dateKey = sale.date.toISOString().split('T')[0];
        dailySales[dateKey] = (dailySales[dateKey] || 0) + sale.quantity;
      });

    const sortedDates = Object.keys(dailySales).sort();
    const last7Days = sortedDates.slice(-7);

    const historicalData = last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: dailySales[date],
      isHistorical: true,
    }));

    const now = new Date();
    const forecastDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() + i + 1);
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        forecast: forecast[i],
        isHistorical: false,
      };
    });

    return [...historicalData, ...forecastDates];
  }, [historicalSales, topItems]);

  const seasonalData = useMemo(() => {
    if (historicalSales.length === 0) return [];

    const weeklyData: { [key: string]: { revenue: number; orders: number } } = {};
    
    historicalSales.forEach(sale => {
      const weekStart = new Date(sale.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { revenue: 0, orders: 0 };
      }
      weeklyData[weekKey].revenue += sale.revenue;
      weeklyData[weekKey].orders += 1;
    });

    return Object.keys(weeklyData)
      .sort()
      .slice(-4)
      .map(week => ({
        period: `Week ${new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        revenue: weeklyData[week].revenue,
        orders: weeklyData[week].orders,
        avgOrderValue: weeklyData[week].revenue / weeklyData[week].orders,
      }));
  }, [historicalSales]);

  const inventoryAlerts = useMemo(() => getReorderAlerts(), []);

  // Comparison data for previous period
  const comparisonData = useMemo(() => {
    if (!metrics) return null;

    return {
      currentPeriod: {
        revenue: metrics.weekRevenue,
        orders: metrics.weekOrders,
        avgOrderValue: metrics.avgOrderValue,
        margin: metrics.avgMargin,
      },
      previousPeriod: {
        revenue: metrics.prevWeekRevenue,
        orders: metrics.prevWeekOrders,
        avgOrderValue: metrics.prevAvgOrderValue,
        margin: metrics.avgMargin - 2.3, // Simulated previous margin
      },
      industryBenchmark: {
        avgOrderValue: 16.50, // Industry standard for small Japanese lunch spot
        margin: 58, // Typical margin for restaurant
        peakHourRevenue: 350, // Industry benchmark
      },
    };
  }, [metrics]);

  if (!metrics || !comparisonData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-red-950 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-lg font-semibold text-gray-100">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const exportData = {
    todayRevenue: metrics.todayRevenue,
    weekRevenue: metrics.weekRevenue,
    monthRevenue: metrics.monthRevenue,
    todayOrders: metrics.todayOrders,
    weekOrders: metrics.weekOrders,
    avgMargin: metrics.avgMargin,
    topItems,
    worstItems,
    categoryData,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="max-w-[1800px] mx-auto space-y-4">
        {/* Header with Japanese-inspired design */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-600/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500 opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500 opacity-5 rounded-full -ml-24 -mb-24"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Utensils className="h-10 w-10 text-cyan-400" />
                  <h1 className="text-4xl font-bold text-white">
                    さくら Sakura Kitchen
                  </h1>
                </div>
                <p className="text-slate-300 text-lg">
                  Smart Analytics Dashboard • Small Japanese Lunch Shop • Open 11 AM - 3 PM
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">5 Employees</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">4 Hours Daily</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Target className="h-4 w-4" />
                    <span className="text-sm">Lunch Focused</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="text-right">
                  <div className="text-slate-400 text-sm">Current Time</div>
                  <div className="text-2xl font-bold text-white">{new Date().toLocaleTimeString()}</div>
                  <div className="text-slate-400 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                </div>
                <ExportButton data={exportData} />
              </div>
            </div>
          </div>
        </div>

        {/* Sparkline KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SparklineCard
            title="Today's Revenue"
            value={`$${metrics.todayRevenue.toFixed(0)}`}
            change={metrics.weekGrowth}
            data={metrics.sparklineData}
            icon={DollarSign}
            color="#06b6d4"
          />
          <SparklineCard
            title="Weekly Revenue"
            value={`$${metrics.weekRevenue.toFixed(0)}`}
            change={metrics.weekGrowth}
            data={metrics.sparklineData}
            icon={TrendingUp}
            color="#14b8a6"
          />
          <SparklineCard
            title="Total Orders"
            value={metrics.weekOrders}
            change={5.3}
            data={metrics.sparklineData.map(d => ({ value: d.value / 20 }))}
            icon={ShoppingCart}
            color="#8b5cf6"
          />
          <SparklineCard
            title="Profit Margin"
            value={`${metrics.avgMargin.toFixed(1)}%`}
            change={2.1}
            data={[{ value: 55 }, { value: 58 }, { value: 56 }, { value: 60 }, { value: 62 }, { value: 61 }, { value: metrics.avgMargin }]}
            icon={Percent}
            color="#6366f1"
          />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-slate-800/50 p-1.5 shadow-lg border border-slate-700/50 rounded-xl">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg text-slate-400">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-lg text-slate-400">
              <Zap className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-lg text-slate-400">
              <Clock className="h-4 w-4" />
              Trends & Heat Map
            </TabsTrigger>
            <TabsTrigger value="forecast" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white rounded-lg text-slate-400">
              <Brain className="h-4 w-4" />
              AI Forecasting
            </TabsTrigger>
            <TabsTrigger value="staff" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg text-slate-400">
              <Users className="h-4 w-4" />
              Staff & Inventory
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-lg text-slate-400">
              <DollarSign className="h-4 w-4" />
              Pricing Strategy
            </TabsTrigger>
            <TabsTrigger value="compare" className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white rounded-lg text-slate-400">
              <ArrowUpDown className="h-4 w-4" />
              Compare
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ComboChart data={comboData} />
              </div>
              <div>
                <CategoryPieChart data={categoryData} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <RadialProgressCard
                title="Daily Target"
                value={Math.round(metrics.todayRevenue)}
                max={800}
                color="#06b6d4"
                label="Revenue Goal"
                subtitle="$800 daily target"
              />
              <RadialProgressCard
                title="Orders Today"
                value={metrics.todayOrders}
                max={100}
                color="#14b8a6"
                label="Order Count"
                subtitle="100 orders target"
              />
              <RadialProgressCard
                title="Avg Margin"
                value={Math.round(metrics.avgMargin)}
                max={100}
                color="#8b5cf6"
                label="Profit %"
                subtitle="Target: 60%+"
              />
              <RadialProgressCard
                title="Weekly Goal"
                value={Math.round((metrics.weekRevenue / 5000) * 100)}
                max={100}
                color="#6366f1"
                label="Progress"
                subtitle="$5000 weekly goal"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="mb-4 bg-gray-800 rounded-xl shadow-lg p-4 border-2 border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-white">Revenue Period</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedPeriod('daily')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedPeriod === 'daily'
                            ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        Daily
                      </button>
                      <button
                        onClick={() => setSelectedPeriod('weekly')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedPeriod === 'weekly'
                            ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        Weekly
                      </button>
                      <button
                        onClick={() => setSelectedPeriod('monthly')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedPeriod === 'monthly'
                            ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>
                </div>
                <RevenueChart data={revenueChartData} />
              </div>
              <SeasonalTrends data={seasonalData} />
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ItemPerformanceTable
                title="Best-Selling Items"
                description="Top 5 performers by revenue"
                items={topItems}
                type="best"
              />
              <ItemPerformanceTable
                title="Slow-Moving Items"
                description="Items requiring attention"
                items={worstItems}
                type="worst"
              />
            </div>

            <HourlySalesChart data={hourlySalesData} />
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <HeatMapChart data={heatMapData} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <HourlySalesChart data={hourlySalesData} />
              <SeasonalTrends data={seasonalData} />
            </div>
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value="forecast" className="space-y-4">
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-slate-600/50 rounded-xl p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-xl">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">AI-Powered Demand Forecasting Engine</h3>
                  <p className="text-slate-300">
                    Using time-series analysis and moving averages to predict next week's demand for optimal inventory management. 
                    Our forecasting helps reduce waste by up to 30% and ensures popular items never run out during lunch rush.
                  </p>
                </div>
              </div>
            </div>

            {topItems.length > 0 && (
              <>
                <ForecastChart 
                  data={forecastData} 
                  itemName={topItems[0].item.name}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topItems.slice(0, 3).map((item, index) => {
                    const forecast = forecastNextWeek(historicalSales, item.item.id);
                    const weekTotal = forecast.reduce((sum, val) => sum + val, 0);
                    const avgDaily = weekTotal / 7;
                    const colors = ['from-cyan-600 to-teal-600', 'from-teal-600 to-emerald-600', 'from-blue-600 to-cyan-600'];
                    
                    return (
                      <div key={item.item.id} className={`bg-gradient-to-br ${colors[index]} rounded-xl shadow-lg p-6 border-2 border-gray-700 text-white`}>
                        <h4 className="text-xl font-bold mb-4">{item.item.name}</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center pb-2 border-b border-white/30">
                            <span className="text-white/90">7-Day Forecast:</span>
                            <span className="text-2xl font-bold">{weekTotal}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-white/30">
                            <span className="text-white/90">Avg Daily:</span>
                            <span className="text-xl font-bold">{avgDaily.toFixed(1)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-white/90">Current Stock:</span>
                            <span className={`text-xl font-bold ${item.item.stock < weekTotal ? 'bg-white text-red-600 px-2 py-1 rounded' : ''}`}>
                              {item.item.stock}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          {/* Staff & Inventory Tab */}
          <TabsContent value="staff" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <InventoryAlerts alerts={inventoryAlerts} />
              </div>
              <div className="space-y-4">
                <div className="bg-gray-900 rounded-xl shadow-lg p-6 border-2 border-green-700">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                    <Package className="h-5 w-5 text-green-400" />
                    Waste Reduction
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-green-900/30 border-2 border-green-700 rounded-lg">
                      <div className="font-semibold text-green-200">Excellent</div>
                      <div className="text-sm text-green-300 mt-1">
                        Ramen & Sushi: 95%+ efficiency
                      </div>
                    </div>
                    <div className="p-3 bg-yellow-900/30 border-2 border-yellow-700 rounded-lg">
                      <div className="font-semibold text-yellow-200">Monitor</div>
                      <div className="text-sm text-yellow-300 mt-1">
                        Tempura: Check prep quantities
                      </div>
                    </div>
                    <div className="p-3 bg-blue-900/30 border-2 border-blue-700 rounded-lg">
                      <div className="text-2xl font-bold text-blue-200">-28%</div>
                      <div className="text-sm text-blue-300">Waste vs last month</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-xl shadow-lg p-6 border-2 border-purple-700">
                  <h3 className="font-bold text-lg mb-4 text-white">Margin Analysis</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b-2 border-gray-700">
                      <span className="text-gray-300">High (60%+):</span>
                      <span className="font-bold text-green-400 text-lg">12 items</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b-2 border-gray-700">
                      <span className="text-gray-300">Medium (40-60%):</span>
                      <span className="font-bold text-blue-400 text-lg">8 items</span>
                    </div>
                    <div className="flex justify-between items-center pb-2">
                      <span className="text-gray-300">Low (&lt;40%):</span>
                      <span className="font-bold text-yellow-400 text-lg">4 items</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-2 border-purple-700 rounded-lg text-sm text-purple-200">
                    💡 Promote high-margin items during peak 12-1 PM rush
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <StaffScheduleCard />
              <StaffAllocationPlanner peakHours={hourlySalesData} />
            </div>
          </TabsContent>

          {/* Pricing Strategy Tab */}
          <TabsContent value="pricing" className="space-y-4">
            <PricingStrategy topItems={topItems} worstItems={worstItems} />
          </TabsContent>

          {/* Compare Tab */}
          <TabsContent value="compare" className="space-y-4">
            <ComparisonView data={comparisonData} />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl shadow-lg p-6 border border-slate-600/50">
          <div className="flex items-center justify-between text-white flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></div>
              <span className="font-semibold text-slate-300">Live Dashboard • Real-time Updates • Professional Mode</span>
            </div>
            <div className="text-sm text-slate-400">
              Last updated: {new Date().toLocaleString()} • さくら Sakura Kitchen Analytics v2.5
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
