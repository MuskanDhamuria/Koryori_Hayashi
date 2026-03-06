import { MenuItem } from '../types';

/**
 * Mottainai Dynamic Pricing Service
 * Implements real-time demand-side management to reduce food waste
 * by offering flash sales on items with surplus ingredients
 */

interface SurplusIngredient {
  name: string;
  quantity: number; // percentage of daily prep that's surplus
  expiresIn: number; // hours until freshness limit
  affectedMenuItems: string[]; // menu item IDs
}

// Mock surplus data (in production, this would come from kitchen inventory system)
const surplusInventory: SurplusIngredient[] = [
  {
    name: 'Yellowtail',
    quantity: 35, // 35% surplus
    expiresIn: 4,
    affectedMenuItems: ['3'], // Salmon Sashimi (using as example)
  },
  {
    name: 'Fresh Bamboo Shoots',
    quantity: 28,
    expiresIn: 6,
    affectedMenuItems: ['4'], // Tonkotsu Ramen
  },
];

// Track flash sale orders per item
const flashSaleOrders = new Map<string, number>();

/**
 * Calculate dynamic discount percentage based on surplus level and expiration
 */
function calculateDiscount(surplus: SurplusIngredient): number {
  const surplusWeight = surplus.quantity / 100; // 0-1 scale
  const urgencyWeight = Math.max(0, 1 - (surplus.expiresIn / 12)); // Higher urgency = higher discount
  
  // Base discount: 10-15%
  const baseDiscount = 10;
  const maxAdditionalDiscount = 5;
  
  const additionalDiscount = (surplusWeight * 0.6 + urgencyWeight * 0.4) * maxAdditionalDiscount;
  
  return Math.round(baseDiscount + additionalDiscount);
}

/**
 * Get flash sale remaining count for an item
 * Flash sales are limited to next 3 orders
 */
function getFlashSaleRemaining(itemId: string): number {
  const ordersUsed = flashSaleOrders.get(itemId) || 0;
  return Math.max(0, 3 - ordersUsed);
}

/**
 * Apply dynamic pricing to menu items
 */
export function applyDynamicPricing(menuItems: MenuItem[]): MenuItem[] {
  return menuItems.map(item => {
    // Check if item has surplus ingredients
    const surplus = surplusInventory.find(s => 
      s.affectedMenuItems.includes(item.id)
    );
    
    if (!surplus) {
      return item;
    }
    
    const flashSaleRemaining = getFlashSaleRemaining(item.id);
    
    if (flashSaleRemaining === 0) {
      // Flash sale expired for this item
      return item;
    }
    
    const discountPercentage = calculateDiscount(surplus);
    const originalPrice = item.originalPrice || item.price;
    const discountedPrice = originalPrice * (1 - discountPercentage / 100);
    
    return {
      ...item,
      originalPrice,
      price: Number(discountedPrice.toFixed(2)),
      discountPercentage,
      flashSaleRemaining,
      surplusIngredient: surplus.name,
    };
  });
}

/**
 * Record a flash sale order
 */
export function recordFlashSaleOrder(itemId: string): void {
  const current = flashSaleOrders.get(itemId) || 0;
  flashSaleOrders.set(itemId, current + 1);
}

/**
 * Check if an item has an active flash sale
 */
export function hasActiveFlashSale(itemId: string): boolean {
  const surplus = surplusInventory.find(s => 
    s.affectedMenuItems.includes(itemId)
  );
  
  if (!surplus) return false;
  
  return getFlashSaleRemaining(itemId) > 0;
}

/**
 * Get surplus info for display
 */
export function getSurplusInfo(itemId: string): SurplusIngredient | null {
  return surplusInventory.find(s => 
    s.affectedMenuItems.includes(itemId)
  ) || null;
}

/**
 * Reset flash sale counters (would be called daily/per shift)
 */
export function resetFlashSales(): void {
  flashSaleOrders.clear();
}

/**
 * Get all active flash sales (for dashboard/analytics)
 */
export function getActiveFlashSales(): Array<{
  itemId: string;
  discount: number;
  remaining: number;
  ingredient: string;
}> {
  const sales: Array<{
    itemId: string;
    discount: number;
    remaining: number;
    ingredient: string;
  }> = [];
  
  surplusInventory.forEach(surplus => {
    surplus.affectedMenuItems.forEach(itemId => {
      const remaining = getFlashSaleRemaining(itemId);
      if (remaining > 0) {
        sales.push({
          itemId,
          discount: calculateDiscount(surplus),
          remaining,
          ingredient: surplus.name,
        });
      }
    });
  });
  
  return sales;
}
