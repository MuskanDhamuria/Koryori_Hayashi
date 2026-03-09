import { WeatherData } from '../types';

/**
 * Weather service backed by Open-Meteo (no API key required)
 */

const DEFAULT_COORDS = { latitude: 1.3521, longitude: 103.8198 }; // Singapore

function toFahrenheit(celsius: number): number {
  return Math.round((celsius * 9) / 5 + 32);
}

function mapWeatherCodeToCondition(code: number): WeatherData['condition'] {
  if ([61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) {
    return 'rainy';
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return 'snowy';
  }

  if ([0, 1].includes(code)) {
    return 'sunny';
  }

  return 'cloudy';
}

function mapWeatherCodeToDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };

  return descriptions[code] ?? 'Unknown conditions';
}

function getFallbackWeather(): WeatherData {
  return {
    temperature: 82,
    condition: 'sunny',
    humidity: 60,
    description: 'Weather data temporarily unavailable',
  };
}

/**
 * Get current weather data
 */
export async function getCurrentWeather(): Promise<WeatherData> {
  const query = new URLSearchParams({
    latitude: DEFAULT_COORDS.latitude.toString(),
    longitude: DEFAULT_COORDS.longitude.toString(),
    current: 'temperature_2m,relative_humidity_2m,weather_code',
    timezone: 'auto',
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    const current = data?.current;

    if (
      !current ||
      typeof current.temperature_2m !== 'number' ||
      typeof current.relative_humidity_2m !== 'number' ||
      typeof current.weather_code !== 'number'
    ) {
      throw new Error('Unexpected weather API response');
    }

    return {
      temperature: toFahrenheit(current.temperature_2m),
      humidity: current.relative_humidity_2m,
      condition: mapWeatherCodeToCondition(current.weather_code),
      description: mapWeatherCodeToDescription(current.weather_code),
    };
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    return getFallbackWeather();
  }
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
  
  // Rainy weather boost
  if (weather.condition === 'rainy' && itemWeatherTags.includes('rainy')) {
    score += 0.35;
  }
  
  // Hot weather boost applies only when it is sunny (prevents overcast heat from pushing cold desserts)
  if (weather.condition === 'sunny' && weather.temperature > 75 && itemWeatherTags.includes('hot')) {
    score += 0.35;
  }
  
  // Cold weather boost
  if (weather.temperature < 65 && itemWeatherTags.includes('cold')) {
    score += 0.3;
  }
  
  // Sunny weather boost
  if (weather.condition === 'sunny' && itemWeatherTags.includes('sunny')) {
    score += 0.2;
  }

  // Penalize mismatches so weather tags are meaningful in ranking
  if (weather.condition !== 'sunny' && itemWeatherTags.includes('hot')) {
    score -= 0.25;
  }

  if (weather.condition !== 'rainy' && itemWeatherTags.includes('rainy')) {
    score -= 0.1;
  }

  if (weather.temperature > 80 && itemWeatherTags.includes('cold')) {
    score -= 0.2;
  }
  
  return Math.max(0, Math.min(score, 1.0));
}
