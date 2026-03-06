import { MenuItem, CartItem, FlavorPreferences, WeatherData } from '../types';
import { getThompsonScore, shouldExplore, getUncertaintyScore } from './mabService';
import { getWeatherBoostScore } from './weatherService';

interface RecommendationContext {
  cartItems: CartItem[];
  flavorPreferences?: FlavorPreferences;
  weather?: WeatherData;
  userHistory?: string[]; // Past order IDs
}

interface ScoredRecommendation {
  item: MenuItem;
  score: number;
  reason: string;
  isExploration?: boolean;
}

// Basic pairing rules
const PAIRING_RULES: Record<string, string[]> = {
  '1': ['12', '13'], // Deluxe Sushi -> Green Tea, Sake
  '2': ['12', '10'], // California Roll -> Green Tea, Miso Soup
  '3': ['13', '10'], // Salmon Sashimi -> Sake, Miso Soup
  '4': ['7', '8'],   // Tonkotsu Ramen -> Gyoza, Edamame
  '5': ['7', '8'],   // Spicy Miso Ramen -> Gyoza, Edamame
  '6': ['9', '7'],   // Udon -> Shrimp Tempura, Gyoza
  '11': ['10', '12'], // Teriyaki Chicken -> Miso Soup, Green Tea
};

/**
 * Calculate flavor match score based on user preferences
 */
function calculateFlavorMatchScore(
  item: MenuItem,
  preferences?: FlavorPreferences
): number {
  if (!preferences || !item.flavorProfile) return 0.5;
  
  let score = 0.5;
  const profile = item.flavorProfile;
  
  // Umami vs Citrus preference
  if (preferences.umamiVsCitrus === 'umami' && profile.umami) {
    score += profile.umami * 0.2;
  } else if (preferences.umamiVsCitrus === 'citrus' && profile.citrus) {
    score += profile.citrus * 0.2;
  }
  
  // Refreshing vs Hearty preference
  if (preferences.refreshingVsHearty === 'refreshing' && profile.refreshing) {
    score += profile.refreshing * 0.2;
  } else if (preferences.refreshingVsHearty === 'hearty' && profile.hearty) {
    score += profile.hearty * 0.2;
  }
  
  // Spicy tolerance
  if (item.spicy) {
    if (preferences.spicyTolerance === 'very-spicy') {
      score += 0.1;
    } else if (preferences.spicyTolerance === 'mild' && item.spicy > 2) {
      score -= 0.3; // Penalize very spicy items for mild preference
    }
  }
  
  return Math.max(0, Math.min(1, score));
}

/**
 * Generate recommendations using Multi-Armed Bandit with Thompson Sampling
 */
export function generateRecommendations(
  allItems: MenuItem[],
  context: RecommendationContext,
  maxRecommendations: number = 3
): Array<{ item: MenuItem; reason: string }> {
  const { cartItems, flavorPreferences, weather, userHistory = [] } = context;
  const cartItemIds = cartItems.map(item => item.id);
  const scoredItems: ScoredRecommendation[] = [];
  
  // Determine if we should explore (20% of the time)
  const isExplorationRound = shouldExplore();
  
  allItems.forEach(item => {
    // Skip items already in cart
    if (cartItemIds.includes(item.id)) return;
    
    let score = 0;
    let reason = '';
    
    // 1. Pairing score (frequently bought together)
    let pairingScore = 0;
    cartItems.forEach(cartItem => {
      const pairings = PAIRING_RULES[cartItem.id];
      if (pairings?.includes(item.id)) {
        pairingScore += 0.3;
        reason = `Pairs perfectly with ${cartItem.name}`;
      }
    });
    
    // 2. Thompson Sampling score (Multi-Armed Bandit)
    const thompsonScore = getThompsonScore(item.id, item.isNew);
    
    // 3. Flavor match score
    const flavorScore = calculateFlavorMatchScore(item, flavorPreferences);
    
    // 4. Weather boost score
    const weatherScore = weather ? getWeatherBoostScore(weather, item.weatherTags) : 0.5;
    
    // 5. High margin boost
    const marginScore = item.isHighMargin ? 0.15 : 0;
    
    // 6. Exploration bonus for new items
    const explorationBonus = isExplorationRound && item.isNew ? 0.4 : 0;
    
    // 7. Uncertainty bonus (Thompson Sampling encourages exploring uncertain items)
    const uncertaintyScore = getUncertaintyScore(item.id);
    
    // Combine scores with weights
    if (isExplorationRound) {
      // Exploration mode: prioritize new/uncertain items
      score = (
        thompsonScore * 0.4 +
        explorationBonus * 0.3 +
        uncertaintyScore * 0.2 +
        pairingScore * 0.1
      );
      
      if (item.isNew && !reason) {
        reason = '✨ New dish - be the first to try!';
      }
    } else {
      // Exploitation mode: prioritize proven winners
      score = (
        thompsonScore * 0.3 +
        pairingScore * 0.25 +
        flavorScore * 0.2 +
        weatherScore * 0.15 +
        marginScore * 0.1
      );
    }
    
    // Set reason if not already set
    if (!reason) {
      if (flavorScore > 0.7) {
        reason = 'Perfect match for your taste profile';
      } else if (weather && weatherScore > 0.7) {
        if (weather.condition === 'rainy' && item.weatherTags?.includes('rainy')) {
          reason = `Perfect for rainy weather ☔`;
        } else if (weather.temperature > 75 && item.weatherTags?.includes('hot')) {
          reason = `Refreshing choice for ${weather.temperature}°F weather`;
        }
      } else if (item.isHighMargin) {
        reason = "Chef's special recommendation";
      } else {
        reason = 'Popular choice';
      }
    }
    
    scoredItems.push({
      item,
      score,
      reason,
      isExploration: isExplorationRound,
    });
  });
  
  // Sort by score and take top N
  scoredItems.sort((a, b) => b.score - a.score);
  
  return scoredItems
    .slice(0, maxRecommendations)
    .map(({ item, reason }) => ({ item, reason }));
}

/**
 * Filter menu items based on flavor preferences
 * Returns items sorted by match score (highest first)
 */
export function filterMenuByFlavorProfile(
  menuItems: MenuItem[],
  preferences: FlavorPreferences
): MenuItem[] {
  const scored = menuItems.map(item => ({
    item,
    score: calculateFlavorMatchScore(item, preferences),
  }));
  
  // Sort by score
  scored.sort((a, b) => b.score - a.score);
  
  // Filter out poor matches (score < 0.3)
  return scored
    .filter(s => s.score >= 0.3)
    .map(s => s.item);
}

/**
 * Get weather-appropriate menu items
 */
export function getWeatherAppropriateItems(
  menuItems: MenuItem[],
  weather: WeatherData
): MenuItem[] {
  return menuItems.filter(item => {
    const weatherScore = getWeatherBoostScore(weather, item.weatherTags);
    return weatherScore >= 0.6; // Only show items with good weather match
  });
}
