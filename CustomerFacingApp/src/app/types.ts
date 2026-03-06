export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  spicy?: number;
  isHighMargin?: boolean;
  // MAB properties
  views?: number;
  orders?: number;
  successRate?: number;
  isNew?: boolean;
  // Dynamic pricing
  originalPrice?: number;
  discountPercentage?: number;
  flashSaleRemaining?: number;
  surplusIngredient?: string;
  // Flavor profile matching
  flavorProfile?: {
    umami?: number;
    citrus?: number;
    refreshing?: number;
    hearty?: number;
  };
  // Weather preferences
  weatherTags?: ('hot' | 'cold' | 'rainy' | 'sunny')[];
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface FlavorPreferences {
  umamiVsCitrus: 'umami' | 'citrus' | 'balanced';
  refreshingVsHearty: 'refreshing' | 'hearty' | 'balanced';
  spicyTolerance: 'mild' | 'medium' | 'very-spicy';
}

export interface WeatherData {
  temperature: number; // in Fahrenheit
  condition: 'sunny' | 'rainy' | 'cloudy' | 'snowy';
  humidity: number;
  description: string;
}

export interface MABItemStats {
  itemId: string;
  alpha: number; // successes + 1
  beta: number; // failures + 1
  lastUpdated: Date;
}