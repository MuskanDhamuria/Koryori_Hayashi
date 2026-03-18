export type CustomerWeather = {
  temperature: number;
  humidity: number;
  condition: "sunny" | "rainy" | "cloudy" | "snowy";
  description: string;
};

const DEFAULT_COORDS = { latitude: 1.3521, longitude: 103.8198 };

function toFahrenheit(celsius: number) {
  return Math.round((celsius * 9) / 5 + 32);
}

function mapWeatherCodeToCondition(code: number): CustomerWeather["condition"] {
  if ([61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) {
    return "rainy";
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return "snowy";
  }

  if ([0, 1].includes(code)) {
    return "sunny";
  }

  return "cloudy";
}

function mapWeatherCodeToDescription(code: number) {
  const descriptions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
  };

  return descriptions[code] ?? "Unknown conditions";
}

function getFallbackWeather(): CustomerWeather {
  return {
    temperature: 82,
    humidity: 60,
    condition: "sunny",
    description: "Weather data temporarily unavailable",
  };
}

export async function getCurrentWeather(): Promise<CustomerWeather> {
  const query = new URLSearchParams({
    latitude: DEFAULT_COORDS.latitude.toString(),
    longitude: DEFAULT_COORDS.longitude.toString(),
    current: "temperature_2m,relative_humidity_2m,weather_code",
    timezone: "auto",
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      current?: {
        temperature_2m?: number;
        relative_humidity_2m?: number;
        weather_code?: number;
      };
    };

    if (
      typeof data.current?.temperature_2m !== "number" ||
      typeof data.current?.relative_humidity_2m !== "number" ||
      typeof data.current?.weather_code !== "number"
    ) {
      throw new Error("Unexpected weather payload");
    }

    return {
      temperature: toFahrenheit(data.current.temperature_2m),
      humidity: data.current.relative_humidity_2m,
      condition: mapWeatherCodeToCondition(data.current.weather_code),
      description: mapWeatherCodeToDescription(data.current.weather_code),
    };
  } catch {
    return getFallbackWeather();
  }
}
