import { AppState, InventoryItem, MenuItem, OpsSettings, RecipeLine, SaleRecord } from '../types.js';

const HOUR_FACTORS: Record<number, number> = {
  10: 0.35,
  11: 0.55,
  12: 1.25,
  13: 1.4,
  14: 1.1,
  15: 0.6,
  16: 0.5,
  17: 0.8,
  18: 1.2,
  19: 1.35,
  20: 1.05,
  21: 0.55,
};

function seededRandom(seed: number) {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function menuItems(): MenuItem[] {
  return [
    { id: 'menu-1', name: 'Teriyaki Salmon Bowl', category: 'Bowl', price: 18.5, unitCost: 7.8, prepMinutes: 12 },
    { id: 'menu-2', name: 'Chicken Katsu Curry', category: 'Main', price: 17.0, unitCost: 6.4, prepMinutes: 14 },
    { id: 'menu-3', name: 'Spicy Tuna Roll', category: 'Sushi', price: 14.0, unitCost: 5.2, prepMinutes: 10 },
    { id: 'menu-4', name: 'Veggie Ramen', category: 'Noodles', price: 15.5, unitCost: 5.6, prepMinutes: 11 },
    { id: 'menu-5', name: 'Karaage Plate', category: 'Main', price: 16.5, unitCost: 6.1, prepMinutes: 13 },
    { id: 'menu-6', name: 'Tofu Udon', category: 'Noodles', price: 14.8, unitCost: 5.0, prepMinutes: 9 },
    { id: 'menu-7', name: 'Matcha Cheesecake', category: 'Dessert', price: 8.5, unitCost: 2.7, prepMinutes: 4 },
    { id: 'menu-8', name: 'Miso Eggplant Don', category: 'Bowl', price: 13.9, unitCost: 4.8, prepMinutes: 9 },
  ];
}

function inventoryItems(): InventoryItem[] {
  return [
    { id: 'inv-1', name: 'Sushi Rice', unit: 'kg', onHand: 48, unitCost: 2.1, safetyStock: 12, leadTimeDays: 3, packSize: 5, shelfLifeDays: 30 },
    { id: 'inv-2', name: 'Salmon Fillet', unit: 'kg', onHand: 16, unitCost: 14.8, safetyStock: 6, leadTimeDays: 2, packSize: 2, shelfLifeDays: 5 },
    { id: 'inv-3', name: 'Chicken Thigh', unit: 'kg', onHand: 24, unitCost: 6.4, safetyStock: 8, leadTimeDays: 2, packSize: 3, shelfLifeDays: 4 },
    { id: 'inv-4', name: 'Tuna', unit: 'kg', onHand: 10, unitCost: 16.5, safetyStock: 4, leadTimeDays: 2, packSize: 2, shelfLifeDays: 4 },
    { id: 'inv-5', name: 'Ramen Noodles', unit: 'kg', onHand: 20, unitCost: 3.9, safetyStock: 6, leadTimeDays: 4, packSize: 4, shelfLifeDays: 25 },
    { id: 'inv-6', name: 'Udon Noodles', unit: 'kg', onHand: 15, unitCost: 3.3, safetyStock: 5, leadTimeDays: 4, packSize: 4, shelfLifeDays: 20 },
    { id: 'inv-7', name: 'Mixed Vegetables', unit: 'kg', onHand: 22, unitCost: 4.2, safetyStock: 7, leadTimeDays: 2, packSize: 3, shelfLifeDays: 6 },
    { id: 'inv-8', name: 'Curry Sauce', unit: 'L', onHand: 18, unitCost: 5.1, safetyStock: 6, leadTimeDays: 3, packSize: 3, shelfLifeDays: 12 },
    { id: 'inv-9', name: 'Tofu', unit: 'kg', onHand: 12, unitCost: 3.2, safetyStock: 4, leadTimeDays: 2, packSize: 2, shelfLifeDays: 5 },
    { id: 'inv-10', name: 'Matcha Powder', unit: 'kg', onHand: 4, unitCost: 28, safetyStock: 1, leadTimeDays: 5, packSize: 1, shelfLifeDays: 60 },
    { id: 'inv-11', name: 'Cream Cheese', unit: 'kg', onHand: 8, unitCost: 7.1, safetyStock: 2, leadTimeDays: 4, packSize: 2, shelfLifeDays: 14 },
    { id: 'inv-12', name: 'Eggplant', unit: 'kg', onHand: 10, unitCost: 3.6, safetyStock: 3, leadTimeDays: 2, packSize: 2, shelfLifeDays: 6 },
    { id: 'inv-13', name: 'Soy Glaze', unit: 'L', onHand: 9, unitCost: 4.7, safetyStock: 2, leadTimeDays: 3, packSize: 2, shelfLifeDays: 20 },
    { id: 'inv-14', name: 'Frying Oil', unit: 'L', onHand: 14, unitCost: 2.9, safetyStock: 4, leadTimeDays: 3, packSize: 5, shelfLifeDays: 40 },
    { id: 'inv-15', name: 'Seaweed Sheets', unit: 'packs', onHand: 18, unitCost: 3.8, safetyStock: 5, leadTimeDays: 5, packSize: 5, shelfLifeDays: 45 },
  ];
}

function recipes(): RecipeLine[] {
  return [
    { id: 'recipe-1', menuItemId: 'menu-1', inventoryItemId: 'inv-1', quantityPerItem: 0.23 },
    { id: 'recipe-2', menuItemId: 'menu-1', inventoryItemId: 'inv-2', quantityPerItem: 0.18 },
    { id: 'recipe-3', menuItemId: 'menu-1', inventoryItemId: 'inv-13', quantityPerItem: 0.03 },
    { id: 'recipe-4', menuItemId: 'menu-2', inventoryItemId: 'inv-3', quantityPerItem: 0.22 },
    { id: 'recipe-5', menuItemId: 'menu-2', inventoryItemId: 'inv-8', quantityPerItem: 0.12 },
    { id: 'recipe-6', menuItemId: 'menu-2', inventoryItemId: 'inv-14', quantityPerItem: 0.05 },
    { id: 'recipe-7', menuItemId: 'menu-3', inventoryItemId: 'inv-1', quantityPerItem: 0.12 },
    { id: 'recipe-8', menuItemId: 'menu-3', inventoryItemId: 'inv-4', quantityPerItem: 0.14 },
    { id: 'recipe-9', menuItemId: 'menu-3', inventoryItemId: 'inv-15', quantityPerItem: 0.08 },
    { id: 'recipe-10', menuItemId: 'menu-4', inventoryItemId: 'inv-5', quantityPerItem: 0.18 },
    { id: 'recipe-11', menuItemId: 'menu-4', inventoryItemId: 'inv-7', quantityPerItem: 0.16 },
    { id: 'recipe-12', menuItemId: 'menu-5', inventoryItemId: 'inv-3', quantityPerItem: 0.2 },
    { id: 'recipe-13', menuItemId: 'menu-5', inventoryItemId: 'inv-14', quantityPerItem: 0.06 },
    { id: 'recipe-14', menuItemId: 'menu-6', inventoryItemId: 'inv-6', quantityPerItem: 0.17 },
    { id: 'recipe-15', menuItemId: 'menu-6', inventoryItemId: 'inv-9', quantityPerItem: 0.15 },
    { id: 'recipe-16', menuItemId: 'menu-6', inventoryItemId: 'inv-7', quantityPerItem: 0.1 },
    { id: 'recipe-17', menuItemId: 'menu-7', inventoryItemId: 'inv-10', quantityPerItem: 0.025 },
    { id: 'recipe-18', menuItemId: 'menu-7', inventoryItemId: 'inv-11', quantityPerItem: 0.08 },
    { id: 'recipe-19', menuItemId: 'menu-8', inventoryItemId: 'inv-1', quantityPerItem: 0.19 },
    { id: 'recipe-20', menuItemId: 'menu-8', inventoryItemId: 'inv-12', quantityPerItem: 0.2 },
    { id: 'recipe-21', menuItemId: 'menu-8', inventoryItemId: 'inv-13', quantityPerItem: 0.03 },
  ];
}

function settings(): OpsSettings {
  return {
    currencyCode: 'MYR',
    ordersPerStaffHour: 9,
    targetMargin: 0.62,
    forecastHorizonDays: 7,
    wasteCoverThresholdDays: 10,
    regressionBlend: 0.55,
  };
}

function generateSales(menu: MenuItem[]): SaleRecord[] {
  const itemProfiles = {
    'menu-1': { base: 4.4, weekendBoost: 1.18, trend: 0.016, monthWave: 0.12 },
    'menu-2': { base: 4.0, weekendBoost: 1.12, trend: 0.014, monthWave: 0.09 },
    'menu-3': { base: 3.4, weekendBoost: 1.24, trend: 0.012, monthWave: 0.08 },
    'menu-4': { base: 2.9, weekendBoost: 1.05, trend: 0.01, monthWave: 0.07 },
    'menu-5': { base: 3.6, weekendBoost: 1.16, trend: 0.013, monthWave: 0.06 },
    'menu-6': { base: 2.7, weekendBoost: 1.02, trend: 0.009, monthWave: 0.05 },
    'menu-7': { base: 1.8, weekendBoost: 1.22, trend: 0.011, monthWave: 0.1 },
    'menu-8': { base: 2.5, weekendBoost: 1.08, trend: 0.008, monthWave: 0.05 },
  } as const;

  const sales: SaleRecord[] = [];
  const start = new Date();
  start.setHours(10, 0, 0, 0);
  start.setDate(start.getDate() - 41);

  for (let dayIndex = 0; dayIndex < 42; dayIndex += 1) {
    const currentDay = new Date(start);
    currentDay.setDate(start.getDate() + dayIndex);
    const weekday = currentDay.getDay();
    const weekendMultiplier = weekday === 5 || weekday === 6 ? 1.15 : weekday === 1 ? 0.92 : 1;
    const seasonalMultiplier = 1 + Math.sin(dayIndex / 6) * 0.06 + Math.cos(dayIndex / 9) * 0.03;

    for (const hour of Object.keys(HOUR_FACTORS).map(Number)) {
      for (const item of menu) {
        const profile = itemProfiles[item.id as keyof typeof itemProfiles];
        const hourFactor = HOUR_FACTORS[hour] ?? 0.4;
        const itemWeekendMultiplier = weekday === 5 || weekday === 6 ? profile.weekendBoost : 1;
        const trendMultiplier = 1 + dayIndex * profile.trend * 0.02;
        const waveMultiplier = 1 + Math.sin(dayIndex / 7 + hour / 3) * profile.monthWave;
        const noise = (seededRandom(dayIndex * 73 + hour * 19 + Number(item.id.replace('menu-', ''))) - 0.5) * 0.75;
        const quantity = Math.max(
          0,
          Math.round(profile.base * hourFactor * weekendMultiplier * itemWeekendMultiplier * trendMultiplier * seasonalMultiplier * waveMultiplier + noise),
        );

        if (quantity <= 0) {
          continue;
        }

        const timestamp = new Date(currentDay);
        timestamp.setHours(hour, seededRandom(hour * dayIndex + quantity) > 0.5 ? 15 : 45, 0, 0);

        sales.push({
          id: `sale-${dayIndex}-${hour}-${item.id}`,
          menuItemId: item.id,
          timestamp: timestamp.toISOString(),
          quantity,
          note: 'Seeded demand sample',
        });
      }
    }
  }

  return sales;
}

export function createDefaultAppState(): AppState {
  const menu = menuItems();

  return {
    menuItems: menu,
    salesRecords: generateSales(menu),
    inventoryItems: inventoryItems(),
    recipes: recipes(),
    settings: settings(),
  };
}

export function createBlankMenuItem(): MenuItem {
  return {
    id: crypto.randomUUID(),
    name: 'New Menu Item',
    category: 'Category',
    price: 0,
    unitCost: 0,
    prepMinutes: 0,
  };
}

export function createBlankInventoryItem(): InventoryItem {
  return {
    id: crypto.randomUUID(),
    name: 'New Ingredient',
    unit: 'kg',
    onHand: 0,
    unitCost: 0,
    safetyStock: 0,
    leadTimeDays: 1,
    packSize: 1,
    shelfLifeDays: 7,
  };
}

export function createBlankRecipeLine(menuItemsList: MenuItem[], inventoryItemsList: InventoryItem[]): RecipeLine {
  return {
    id: crypto.randomUUID(),
    menuItemId: menuItemsList[0]?.id ?? '',
    inventoryItemId: inventoryItemsList[0]?.id ?? '',
    quantityPerItem: 0,
  };
}

export function createBlankSaleRecord(menuItemsList: MenuItem[]): SaleRecord {
  return {
    id: crypto.randomUUID(),
    menuItemId: menuItemsList[0]?.id ?? '',
    timestamp: new Date().toISOString(),
    quantity: 1,
    note: 'Manual input',
  };
}
