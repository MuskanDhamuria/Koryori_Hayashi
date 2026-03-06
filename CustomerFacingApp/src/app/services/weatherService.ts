import { WeatherData } from '../types';

/**
 * Mock Weather Service
 * In production, this would integrate with a real weather API like OpenWeatherMap
 */

// Simulate different weather conditions for demo
const MOCK_WEATHER_CONDITIONS: WeatherData[] = [
  {
    temperature: 75,
    condition: 'sunny',
    humidity: 45,
    description: 'Clear and sunny',
  },
  {
    temperature: 55,
    condition: 'rainy',
    humidity: 85,
    description: 'Light rain showers',
  },
  {
    temperature: 82,
    condition: 'sunny',
    humidity: 60,
    description: 'Hot and humid',
  },
  {
    temperature: 48,
    condition: 'cloudy',
    humidity: 70,
    description: 'Overcast and cool',
  },
];

/**
 * Get current weather data
 * In production: Replace with actual API call to OpenWeatherMap or similar
 */
export async function getCurrentWeather(): Promise<WeatherData> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // For demo, rotate through different weather conditions based on time
  const hour = new Date().getHours();
  const index = hour % MOCK_WEATHER_CONDITIONS.length;
  
  return MOCK_WEATHER_CONDITIONS[index];
}

/**
 * Determine if the weather is suitable for hot items (ramen, hot tea)
 */
export function isWeatherSuitableForHotItems(weather: WeatherData): boolean {
  return weather.temperature < 65 || weather.condition === 'rainy';
}

/**
 * Determine if the weather is suitable for cold/refreshing items (sashimi, cold sake)
 */
export function isWeatherSuitableForColdItems(weather: WeatherData): boolean {
  return weather.temperature > 70 && weather.condition === 'sunny';
}

/**
 * Get weather-based recommendation boost score (0-1)
 */
export function getWeatherBoostScore(
  weather: WeatherData,
  itemWeatherTags?: ('hot' | 'cold' | 'rainy' | 'sunny')[]
): number {
  if (!itemWeatherTags || itemWeatherTags.length === 0) return 0.5;
  
  let score = 0.5;
  
  // Rainy weather boost for hot items
  if (weather.condition === 'rainy' && itemWeatherTags.includes('rainy')) {
    score += 0.3;
  }
  
  // Hot weather boost for cold/refreshing items
  if (weather.temperature > 75 && itemWeatherTags.includes('hot')) {
    score += 0.3;
  }
  
  // Cold weather boost for hot items
  if (weather.temperature < 60 && itemWeatherTags.includes('cold')) {
    score += 0.3;
  }
  
  // Sunny weather boost
  if (weather.condition === 'sunny' && itemWeatherTags.includes('sunny')) {
    score += 0.2;
  }
  
  return Math.min(score, 1.0);
}
