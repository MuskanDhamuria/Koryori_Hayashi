import { Cloud, CloudRain, Sun } from "lucide-react";
import type { JSX } from "react";
import type { MenuItem, WeatherData } from "../types";
import type { LoyaltyProfile } from "../components/LoyaltyCard";

export const BASE_MENU_ITEMS: MenuItem[] = [
  {
    id: "101",
    name: "Japanese Fresh Oyster",
    description: "Fresh Japanese oyster served chilled",
    price: 3.8,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1604908177522-432b8d7a9c8d",
    isHighMargin: false,
    flavorProfile: { umami: 0.9, citrus: 0.2, refreshing: 0.8, hearty: 0.2 },
    weatherTags: ["sunny", "hot"],
  },
  {
    id: "102",
    name: "Crab Meat Cream Croquette",
    description: "Crispy croquette filled with creamy crab meat",
    price: 4.8,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1600891964599-f61ba0e24092",
    isHighMargin: true,
    flavorProfile: { umami: 0.8, citrus: 0.1, refreshing: 0.2, hearty: 0.9 },
  },
  {
    id: "103",
    name: "Fried Oyster",
    description: "Golden deep-fried oysters with crispy coating",
    price: 3.8,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947",
    isHighMargin: true,
    flavorProfile: { umami: 0.9, citrus: 0.1, refreshing: 0.3, hearty: 0.7 },
  },
  {
    id: "104",
    name: "Geso Karaage (Squid)",
    description: "Japanese fried squid karaage",
    price: 4.8,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1625944525533-473f1c5c2a6a",
    isHighMargin: true,
    flavorProfile: { umami: 0.8, citrus: 0.1, refreshing: 0.4, hearty: 0.6 },
  },
  {
    id: "105",
    name: "Aji Fry",
    description: "Breaded and fried Japanese horse mackerel",
    price: 3.8,
    category: "appetizers",
    image: "/images/menu/aji_fry.png",
    isHighMargin: true,
    flavorProfile: { umami: 0.7, citrus: 0.2, refreshing: 0.3, hearty: 0.6 },
  },
  {
    id: "106",
    name: "King Prawn",
    description: "Large king prawn, lightly fried",
    price: 7.8,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6c2c",
    isHighMargin: false,
    flavorProfile: { umami: 0.8, citrus: 0.2, refreshing: 0.4, hearty: 0.5 },
  },
  {
    id: "107",
    name: "Mentaiko Pasta",
    description: "Japanese pasta with creamy cod roe sauce",
    price: 9.8,
    category: "mains",
    image: "https://images.unsplash.com/photo-1608756687911-aa1599ab3bd9",
    isHighMargin: true,
    flavorProfile: { umami: 0.9, citrus: 0.1, refreshing: 0.2, hearty: 0.8 },
  },
  {
    id: "108",
    name: "Creamy Truffle Mushroom Pasta",
    description: "Rich truffle cream pasta with mushrooms",
    price: 9.8,
    category: "mains",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc353d2e5",
    isHighMargin: true,
    flavorProfile: { umami: 0.9, citrus: 0.0, refreshing: 0.1, hearty: 0.9 },
  },
  {
    id: "109",
    name: "Chicken/Pork Katsu Don",
    description: "Breaded cutlet served over rice with egg and sauce",
    price: 8.8,
    category: "mains",
    image: "https://images.unsplash.com/photo-1604908177522-432b8d7a9c8d",
    isHighMargin: true,
    flavorProfile: { umami: 0.8, citrus: 0.1, refreshing: 0.2, hearty: 0.9 },
  },
  {
    id: "110",
    name: "Chicken Nanban Don",
    description: "Japanese fried chicken with tangy sauce over rice",
    price: 8.8,
    category: "mains",
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6c2c",
    isHighMargin: true,
    flavorProfile: { umami: 0.8, citrus: 0.3, refreshing: 0.3, hearty: 0.8 },
  },
  {
    id: "111",
    name: "Salmon Teriyaki Don",
    description: "Grilled salmon with teriyaki sauce over rice",
    price: 9.8,
    category: "mains",
    image: "https://images.unsplash.com/photo-1598514982501-3b7b02c27d64",
    isHighMargin: false,
    flavorProfile: { umami: 0.9, citrus: 0.2, refreshing: 0.4, hearty: 0.7 },
  },
  {
    id: "112",
    name: "Kitsune Udon",
    description: "Udon noodles with sweet fried tofu",
    price: 7.8,
    category: "ramen",
    image: "https://images.unsplash.com/photo-1610554666975-339e1f736bc8",
    isHighMargin: true,
    flavorProfile: { umami: 0.7, citrus: 0.1, refreshing: 0.3, hearty: 0.7 },
    weatherTags: ["rainy", "cold"],
  },
  {
    id: "113",
    name: "Sukiyaki Beef Udon",
    description: "Udon noodles with sweet soy beef sukiyaki",
    price: 9.8,
    category: "ramen",
    image: "https://images.unsplash.com/photo-1610554666975-339e1f736bc8",
    isHighMargin: false,
    flavorProfile: { umami: 0.9, citrus: 0.1, refreshing: 0.2, hearty: 0.9 },
    weatherTags: ["rainy", "cold"],
  },
  {
    id: "114",
    name: "Tempura Udon",
    description: "Udon noodle soup served with crispy tempura",
    price: 11.8,
    category: "ramen",
    image: "https://images.unsplash.com/photo-1610554666975-339e1f736bc8",
    isHighMargin: true,
    flavorProfile: { umami: 0.8, citrus: 0.1, refreshing: 0.3, hearty: 0.8 },
    weatherTags: ["rainy", "cold"],
  },
  {
    id: "115",
    name: "Ice Cream (Matcha/Yuzu/Black Sesame/Houjicha/Jersey Milk)",
    description: "Japanese flavored ice cream selection",
    price: 2.5,
    category: "desserts",
    image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb",
    isHighMargin: true,
    flavorProfile: { umami: 0.3, citrus: 0.6, refreshing: 0.8, hearty: 0.2 },
    weatherTags: ["sunny", "hot"],
  },
  {
    id: "116",
    name: "Monaka Shell Ice Cream",
    description: "Ice cream served in crispy monaka wafer shell",
    price: 3.0,
    category: "desserts",
    image: "https://images.unsplash.com/photo-1505253216365-73a1f6e8b6af",
    isHighMargin: true,
    flavorProfile: { umami: 0.3, citrus: 0.4, refreshing: 0.7, hearty: 0.3 },
  },
  {
    id: "117",
    name: "Tempura Ice Cream",
    description: "Deep fried ice cream (vanilla or chocolate)",
    price: 4.8,
    category: "desserts",
    image: "https://images.unsplash.com/photo-1551024601-bec78aea704b",
    isHighMargin: true,
    isNew: true,
    flavorProfile: { umami: 0.2, citrus: 0.2, refreshing: 0.5, hearty: 0.7 },
  },
  {
    id: "118",
    name: "Spicy Tuna Roll",
    description: "Fresh tuna mixed with spicy mayo and wrapped with rice and nori",
    price: 14.99,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56",
    spicy: 2,
    isHighMargin: true,
    flavorProfile: { umami: 0.8, citrus: 0.3, refreshing: 0.6, hearty: 0.4 },
    weatherTags: ["sunny", "hot"],
  },
  {
    id: "119",
    name: "Volcano Ramen",
    description: "Extra spicy ramen with chili oil, minced pork, and soft boiled egg",
    price: 17.99,
    category: "mains",
    image: "https://images.unsplash.com/photo-1617093727343-374698b1b08d",
    spicy: 4,
    isHighMargin: true,
    flavorProfile: { umami: 0.9, citrus: 0.1, refreshing: 0.2, hearty: 1.0 },
    weatherTags: ["rainy", "cold"],
  },
  {
    id: "120",
    name: "Spicy Karaage Chicken",
    description: "Japanese fried chicken tossed in spicy chili sauce",
    price: 10.99,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1604908177522-040a5c1a3f10",
    spicy: 3,
    isHighMargin: true,
    flavorProfile: { umami: 0.8, citrus: 0.2, refreshing: 0.3, hearty: 0.7 },
  },
  {
    id: "121",
    name: "Truffle Salmon Roll",
    description: "NEW! Seared salmon sushi roll with truffle oil and avocado",
    price: 18.99,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351",
    isNew: true,
    isHighMargin: true,
    flavorProfile: { umami: 0.9, citrus: 0.2, refreshing: 0.6, hearty: 0.5 },
    weatherTags: ["sunny"],
  },
  {
    id: "122",
    name: "Matcha Cheesecake",
    description: "NEW! Creamy cheesecake infused with premium Japanese matcha",
    price: 7.99,
    category: "desserts",
    image: "https://images.unsplash.com/photo-1586985289906-406988974504",
    isNew: true,
    isHighMargin: true,
    flavorProfile: { umami: 0.3, citrus: 0.2, refreshing: 0.5, hearty: 0.6 },
  },
  {
    id: "123",
    name: "Yuzu Sparkling Soda",
    description: "NEW! Refreshing Japanese citrus soda with yuzu flavor",
    price: 4.99,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1558640479-823d3b9c7c2d",
    isNew: true,
    isHighMargin: true,
    flavorProfile: { umami: 0.1, citrus: 0.9, refreshing: 1.0, hearty: 0.1 },
    weatherTags: ["sunny", "hot"],
  },
  {
    id: "124",
    name: "Iced Lemon Tea",
    description: "Refreshing black tea served over ice with fresh lemon slices.",
    price: 3.5,
    category: "drinks",
    image: "images/drinks/iced-lemon-tea.jpg",
    isHighMargin: true,
    isNew: false,
  },
  {
    id: "125",
    name: "Thai Milk Tea",
    description: "Classic Thai-style tea brewed strong and blended with sweetened milk, served chilled.",
    price: 4.5,
    category: "drinks",
    image: "images/drinks/thai-milk-tea.jpg",
    isHighMargin: true,
    isNew: false,
  },
  {
    id: "126",
    name: "Fresh Watermelon Juice",
    description: "Freshly blended watermelon juice with no added sugar, naturally sweet and hydrating.",
    price: 5.5,
    category: "drinks",
    image: "images/drinks/watermelon-juice.jpg",
    isHighMargin: false,
    isNew: true,
  },
];

export const ORDERING_CATEGORIES = [
  { key: "mains", label: "Mains", emoji: "🍱" },
  { key: "appetizers", label: "Appetizers", emoji: "🥟" },
  { key: "ramen", label: "Udon", emoji: "🍜" },
  { key: "desserts", label: "Desserts", emoji: "🍦" },
  { key: "drinks", label: "Drinks", emoji: "🍵" },
];

export function getWeatherIcon(condition: string): JSX.Element {
  switch (condition) {
    case "rainy":
      return <CloudRain className="w-5 h-5" />;
    case "sunny":
      return <Sun className="w-5 h-5" />;
    case "cloudy":
      return <Cloud className="w-5 h-5" />;
    default:
      return <Sun className="w-5 h-5" />;
  }
}

export function getPerfectWeatherMessage(weather: WeatherData): string {
  if (weather.condition === "rainy" || weather.condition === "snowy") {
    return "Perfect weather for hot ramen and warm udon";
  }
  if (weather.condition === "sunny" && weather.temperature > 80) {
    return "Perfect weather for sashimi, yuzu soda, and ice cream";
  }
  if (weather.condition === "sunny") {
    return "Perfect weather for sushi rolls and donburi";
  }
  return "Perfect weather for cozy bowls and comfort dishes";
}

export function getTierFromPoints(points: number): LoyaltyProfile["tier"] {
  if (points >= 1500) {
    return "platinum";
  }
  if (points >= 500) {
    return "gold";
  }
  return "silver";
}

export function mergeMenuImages(items: MenuItem[]): MenuItem[] {
  const fallbackImageByName = new Map(BASE_MENU_ITEMS.map((item) => [item.name, item.image]));
  return items.map((item) => ({
    ...item,
    image: item.image || fallbackImageByName.get(item.name) || "",
  }));
}
