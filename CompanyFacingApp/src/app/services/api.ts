const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export interface BackendOrder {
  id: string;
  userId: string | null;
  orderedAt: string;
  totalAmount: string | number;
  orderItems: Array<{
    quantity: number;
    lineTotal: string | number;
    menuItem: {
      id: string;
      name: string;
    };
  }>;
}

export interface DashboardAnalyticsResponse {
  metrics: {
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    todayOrders: number;
    weekOrders: number;
    avgMargin: number;
    avgOrderValue: number;
    weekGrowth: number;
    ordersGrowth: number;
    marginDelta: number;
    previousWeekRevenue: number;
    previousWeekOrders: number;
    previousAvgOrderValue: number;
    previousMargin: number;
    sparklineData: Array<{ date: string; value: number }>;
  };
  comparison: {
    currentPeriod: {
      revenue: number;
      orders: number;
      avgOrderValue: number;
      margin: number;
    };
    previousPeriod: {
      revenue: number;
      orders: number;
      avgOrderValue: number;
      margin: number;
    };
    benchmark: {
      avgOrderValue: number;
      margin: number;
      peakHourRevenue: number;
    };
  };
  operations: {
    staffCount: number;
    activeTables: number;
    uniqueCustomersThisWeek: number;
    peakHourRange: string;
  };
  inventorySummary: {
    criticalCount: number;
    warningCount: number;
    healthyCount: number;
    overstockCount: number;
    averageCoverageDays: number;
    criticalItems: string[];
  };
  marginSummary: {
    highCount: number;
    mediumCount: number;
    lowCount: number;
    recommendation: string;
  };
  charts: {
    revenue: {
      daily: Array<{ date: string; revenue: number }>;
      weekly: Array<{ date: string; revenue: number }>;
      monthly: Array<{ date: string; revenue: number }>;
    };
    combo: Array<{
      date: string;
      revenue: number;
      orders: number;
      customers: number;
    }>;
    hourlySales: Array<{
      hour: number;
      sales: number;
      isPeak: boolean;
    }>;
    heatMap: Array<{
      day: string;
      hours: Array<{ hour: number; value: number }>;
    }>;
    seasonal: Array<{
      period: string;
      revenue: number;
      orders: number;
      avgOrderValue: number;
    }>;
    forecast: Array<{
      date: string;
      actual?: number;
      forecast?: number;
      isHistorical: boolean;
    }>;
    forecastFocusItemName: string;
  };
  performance: {
    topItems: Array<{
      item: {
        id: string;
        name: string;
        category: string;
        price: number;
        cost: number;
        stock: number;
        reorderPoint: number;
      };
      totalRevenue: number;
      totalQuantity: number;
    }>;
    worstItems: Array<{
      item: {
        id: string;
        name: string;
        category: string;
        price: number;
        cost: number;
        stock: number;
        reorderPoint: number;
      };
      totalRevenue: number;
      totalQuantity: number;
    }>;
  };
  forecast: {
    focusItemName: string;
    chart: Array<{
      date: string;
      actual?: number;
      forecast?: number;
      isHistorical: boolean;
    }>;
    cards: Array<{
      itemId: string;
      itemName: string;
      weekTotal: number;
      avgDaily: number;
      currentStock: number;
    }>;
  };
  staffing: {
    schedule: {
      staff: Array<{
        id: string;
        name: string;
        role: string;
        shift: string;
        hours: string;
      }>;
      coverage: {
        peak: string;
        offPeak: string;
        peakHourRange: string;
      };
    };
    allocation: Array<{
      hour: number;
      label: string;
      shift: string;
      expectedSales: number;
      staffRequired: number;
      availableStaff: number;
      coverageStatus: string;
    }>;
  };
  pricingStrategy: {
    topPerformers: Array<{
      itemId: string;
      itemName: string;
      category: string;
      price: number;
      margin: number;
      quantity: number;
      revenue: number;
      action: string;
      reason: string;
    }>;
    slowMovers: Array<{
      itemId: string;
      itemName: string;
      category: string;
      price: number;
      margin: number;
      quantity: number;
      revenue: number;
      action: string;
      reason: string;
    }>;
    strategicInsights: string[];
  };
}

export interface DashboardAiResponse {
  answer: string;
  model: string;
  generatedAt: string;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function staffLogin(email: string, password: string) {
  return apiFetch<{
    token: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      role: string;
    };
  }>("/api/auth/staff-login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export async function fetchMenuCatalog() {
  return apiFetch<{
    categories: Array<{
      slug: string;
      name: string;
      items: Array<{
        id: string;
        name: string;
        price: string | number;
        cost: string | number;
        inventoryItem: {
          stockOnHand: number;
          reorderPoint: number;
        } | null;
      }>;
    }>;
  }>("/api/menu");
}

export async function fetchOrders(token: string) {
  return apiFetch<{
    orders: BackendOrder[];
  }>("/api/orders", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export async function fetchInventoryAlerts(token: string) {
  return apiFetch<{
    alerts: Array<{
      item: {
        id: string;
        name: string;
        category: string;
        stock: number;
        reorderPoint: number;
      };
      daysUntilStockout: number;
      suggestedOrder: number;
    }>;
  }>("/api/inventory/alerts", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

export async function fetchDashboardAnalytics(token: string) {
  return apiFetch<DashboardAnalyticsResponse>("/api/analytics/dashboard", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function askDashboardAi(token: string, question: string) {
  return apiFetch<DashboardAiResponse>("/api/ai/ask", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ question }),
  });
}
