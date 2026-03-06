import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { MenuItem } from "./MenuItem";
import { RecommendationCard } from "./RecommendationCard";
import { ShoppingCart } from "./ShoppingCart";
import { PaymentDialog } from "./PaymentDialog";
import { LoyaltyProfile } from "./LoyaltyCard";
import { QrCode, UtensilsCrossed, Sparkles, CloudRain, Sun, Cloud, Info, Gift, Users, Star } from "lucide-react";
import { toast } from "sonner";
import { CherryBlossom } from "./JapanesePattern";
import { MenuItem as MenuItemType, CartItem, FlavorPreferences, WeatherData } from "../types";
import { generateRecommendations } from "../services/recommendationService";
import { applyDynamicPricing, recordFlashSaleOrder, hasActiveFlashSale } from "../services/dynamicPricingService";
import { getCurrentWeather } from "../services/weatherService";
import { recordSuccess } from "../services/mabService";

interface OrderingPageProps {
  tableNumber: string;
  userName: string;
  phoneNumber: string;
  flavorPreferences?: FlavorPreferences;
}

// Enhanced menu items with flavor profiles, weather tags, and MAB properties
const BASE_MENU_ITEMS: MenuItemType[] = [
  {
    id: "1",
    name: "Deluxe Sushi Platter",
    description: "Assorted nigiri and maki rolls with fresh wasabi and ginger",
    price: 32.99,
    category: "sushi",
    image: "https://images.unsplash.com/photo-1625937751876-4515cd8e78bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXNoaSUyMHBsYXR0ZXJ8ZW58MXx8fHwxNzcyNjUxODA3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    isHighMargin: true,
    flavorProfile: { umami: 0.9, citrus: 0.3, refreshing: 0.7, hearty: 0.4 },
    weatherTags: ['sunny', 'hot'],
  },
  {
    id: "2",
    name: "California Roll",
    description: "Crab, avocado, cucumber wrapped in rice and nori",
    price: 12.99,
    category: "sushi",
    image: "https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxpZm9ybmlhJTIwcm9sbCUyMHN1c2hpfGVufDF8fHx8MTc3MjU3MTE0OXww&ixlib=rb-4.1.0&q=80&w=1080",
    flavorProfile: { umami: 0.6, citrus: 0.4, refreshing: 0.8, hearty: 0.3 },
    weatherTags: ['sunny'],
  },
  {
    id: "3",
    name: "Salmon Sashimi",
    description: "Fresh Norwegian salmon sliced to perfection",
    price: 18.99,
    category: "sushi",
    image: "https://images.unsplash.com/photo-1675870792392-116a80bd7ad6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWxtb24lMjBzYXNoaW1pfGVufDF8fHx8MTc3MjY4NDgwNXww&ixlib=rb-4.1.0&q=80&w=1080",
    isHighMargin: true,
    flavorProfile: { umami: 0.8, citrus: 0.2, refreshing: 0.9, hearty: 0.2 },
    weatherTags: ['sunny', 'hot'],
  },
  {
    id: "4",
    name: "Tonkotsu Ramen",
    description: "Rich pork bone broth with chashu, egg, and bamboo shoots",
    price: 16.99,
    category: "ramen",
    image: "https://images.unsplash.com/photo-1635379511574-bc167ca085c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYW1lbiUyMGJvd2wlMjBqYXBhbmVzZXxlbnwxfHx8fDE3NzI2ODQ4MDN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    spicy: 1,
    isHighMargin: true,
    flavorProfile: { umami: 1.0, citrus: 0.0, refreshing: 0.1, hearty: 1.0 },
    weatherTags: ['rainy', 'cold'],
  },
  {
    id: "5",
    name: "Spicy Miso Ramen",
    description: "Fermented soybean broth with ground pork and vegetables",
    price: 15.99,
    category: "ramen",
    image: "https://images.unsplash.com/photo-1635379511574-bc167ca085c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYW1lbiUyMGJvd2wlMjBqYXBhbmVzZXxlbnwxfHx8fDE3NzI2ODQ4MDN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    spicy: 3,
    flavorProfile: { umami: 0.9, citrus: 0.1, refreshing: 0.2, hearty: 0.9 },
    weatherTags: ['rainy', 'cold'],
  },
  {
    id: "6",
    name: "Udon Noodle Soup",
    description: "Thick wheat noodles in dashi broth with tempura",
    price: 14.99,
    category: "ramen",
    image: "https://images.unsplash.com/photo-1610554666975-339e1f736bc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1ZG9uJTIwbm9vZGxlcyUyMGJvd2x8ZW58MXx8fHwxNzcyNjg0ODA3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    flavorProfile: { umami: 0.7, citrus: 0.1, refreshing: 0.3, hearty: 0.8 },
    weatherTags: ['rainy', 'cold'],
  },
  {
    id: "7",
    name: "Gyoza",
    description: "Pan-fried pork and vegetable dumplings (6 pieces)",
    price: 8.99,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1703080173985-936514c7c8bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW96YSUyMGR1bXBsaW5nc3xlbnwxfHx8fDE3NzI2NDc3NzV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    flavorProfile: { umami: 0.7, citrus: 0.2, refreshing: 0.4, hearty: 0.6 },
  },
  {
    id: "8",
    name: "Edamame",
    description: "Steamed young soybeans with sea salt",
    price: 5.99,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1575262599410-837a72005862?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZGFtYW1lJTIwYmVhbnN8ZW58MXx8fHwxNzcyNjQ3Nzc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    flavorProfile: { umami: 0.5, citrus: 0.3, refreshing: 0.7, hearty: 0.4 },
  },
  {
    id: "9",
    name: "Shrimp Tempura",
    description: "Lightly battered and fried shrimp with dipping sauce",
    price: 11.99,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1673238104258-38b63f973848?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZW1wdXJhJTIwc2hyaW1wfGVufDF8fHx8MTc3MjY4NDgwM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    isHighMargin: true,
    flavorProfile: { umami: 0.6, citrus: 0.4, refreshing: 0.5, hearty: 0.5 },
  },
  {
    id: "10",
    name: "Miso Soup",
    description: "Traditional soybean soup with tofu and seaweed",
    price: 3.99,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1680137248903-7af5d51a3350?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaXNvJTIwc291cHxlbnwxfHx8fDE3NzI2MTcwMjN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    flavorProfile: { umami: 0.9, citrus: 0.1, refreshing: 0.4, hearty: 0.6 },
    weatherTags: ['rainy', 'cold'],
  },
  {
    id: "11",
    name: "Teriyaki Chicken",
    description: "Grilled chicken with homemade teriyaki sauce and rice",
    price: 13.99,
    category: "mains",
    image: "https://images.unsplash.com/photo-1609183480237-ccbb2d7c5772?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXJpeWFraSUyMGNoaWNrZW58ZW58MXx8fHwxNzcyNjg0ODA1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    flavorProfile: { umami: 0.8, citrus: 0.2, refreshing: 0.3, hearty: 0.7 },
  },
  {
    id: "12",
    name: "Green Tea",
    description: "Premium Japanese sencha green tea",
    price: 3.99,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1708572727896-117b5ea25a86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMHRlYSUyMG1hdGNoYXxlbnwxfHx8fDE3NzI2ODQ4MDV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    flavorProfile: { umami: 0.3, citrus: 0.6, refreshing: 0.9, hearty: 0.1 },
    weatherTags: ['sunny'],
  },
  {
    id: "13",
    name: "Sake",
    description: "Premium Japanese rice wine, served warm or cold",
    price: 9.99,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1703756292847-833e3cb741eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWtlJTIwamFwYW5lc2UlMjBkcmlua3xlbnwxfHx8fDE3NzI2MzE2NTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    flavorProfile: { umami: 0.6, citrus: 0.2, refreshing: 0.7, hearty: 0.3 },
    weatherTags: ['sunny', 'hot'],
  },
  {
    id: "14",
    name: "Fusion Dragon Roll",
    description: "NEW! Spicy tuna, eel, and mango with special sauce",
    price: 16.99,
    category: "sushi",
    image: "https://images.unsplash.com/photo-1625937751876-4515cd8e78bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXNoaSUyMHBsYXR0ZXJ8ZW58MXx8fHwxNzcyNjUxODA3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    isNew: true,
    isHighMargin: true,
    spicy: 2,
    flavorProfile: { umami: 0.8, citrus: 0.5, refreshing: 0.6, hearty: 0.5 },
    weatherTags: ['sunny'],
  },
];

function getUserProfile(phoneNumber: string): LoyaltyProfile {
  if (phoneNumber === "+1 (555) 123-4567") {
    return {
      tier: "gold",
      points: 850,
      name: "Yuki Tanaka",
      isBirthday: true,
      referralCode: "YUKI2026",
    };
  } else if (phoneNumber === "+1 (555) 987-6543") {
    return {
      tier: "platinum",
      points: 2100,
      name: "Akira Sato",
      isBirthday: false,
      referralCode: "AKIRA2026",
    };
  } else {
    return {
      tier: "silver",
      points: 0,
      name: "New Customer",
      isBirthday: false,
      referralCode: "WELCOME2026",
    };
  }
}

function getWeatherIcon(condition: string) {
  switch (condition) {
    case 'rainy':
      return <CloudRain className="w-5 h-5" />;
    case 'sunny':
      return <Sun className="w-5 h-5" />;
    case 'cloudy':
      return <Cloud className="w-5 h-5" />;
    default:
      return <Sun className="w-5 h-5" />;
  }
}

export function OrderingPage({ tableNumber, userName, phoneNumber, flavorPreferences }: OrderingPageProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [loyaltyInfoOpen, setLoyaltyInfoOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<Array<{ item: MenuItemType; reason: string }>>([]);
  const [loyaltyProfile] = useState<LoyaltyProfile>(getUserProfile(phoneNumber));
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>(BASE_MENU_ITEMS);

  // Fetch weather on mount
  useEffect(() => {
    const fetchWeather = async () => {
      const data = await getCurrentWeather();
      setWeatherData(data);
    };
    fetchWeather();
  }, []);

  // Apply dynamic pricing based on surplus inventory
  useEffect(() => {
    const pricedItems = applyDynamicPricing(BASE_MENU_ITEMS);
    setMenuItems(pricedItems);
  }, []);

  // Generate recommendations when cart or flavor preferences change
  useEffect(() => {
    const newRecommendations = generateRecommendations(
      menuItems,
      {
        cartItems: cart,
        flavorPreferences,
        weather: weatherData || undefined,
      },
      3
    );
    setRecommendations(newRecommendations);
  }, [cart, flavorPreferences, weatherData, menuItems]);

  const handleAddToCart = (item: MenuItemType) => {
    // Record success for MAB algorithm
    recordSuccess(item.id);
    
    // Record flash sale order if applicable
    if (hasActiveFlashSale(item.id)) {
      recordFlashSaleOrder(item.id);
      toast.success(`🎉 Flash sale discount applied! ${item.name} added to cart`);
    } else {
      toast.success(`${item.name} added to cart`);
    }
    
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id);
      if (existingItem) {
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    toast.info("Item removed from cart");
  };

  const handleCheckout = () => {
    setPaymentDialogOpen(true);
  };

  const handlePaymentComplete = () => {
    // Record successful orders for MAB
    cart.forEach(item => {
      recordSuccess(item.id);
    });
    
    setPaymentDialogOpen(false);
    setCart([]);
    toast.success("Thank you for your order!");
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const birthdayDiscountPercent = loyaltyProfile.isBirthday 
    ? (loyaltyProfile.tier === "platinum" ? 15 : loyaltyProfile.tier === "gold" ? 10 : 5)
    : 0;
  const birthdayDiscountAmount = subtotal * (birthdayDiscountPercent / 100);
  const total = (subtotal - birthdayDiscountAmount) * 1.1;
  const pointsMultiplier = loyaltyProfile.tier === "platinum" ? 2 : loyaltyProfile.tier === "gold" ? 1.5 : 1;
  const loyaltyPoints = Math.floor(total * pointsMultiplier);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#0F1729] to-[#2D3E5F] rounded-full flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 text-[#D4AF37]" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#0F1729]">Koryori Hayashi</h1>
                <p className="text-xs text-[#6B7280]">小料理林</p>
              </div>
            </div>
            
            {/* Right side */}
            <div className="flex items-center gap-4">
              {weatherData && (
                <div className="flex items-center gap-2 bg-[#F3F4F6] px-3 py-2 rounded-lg">
                  {getWeatherIcon(weatherData.condition)}
                  <span className="text-sm font-medium text-[#0F1729]">{weatherData.temperature}°F</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 bg-[#F3F4F6] px-4 py-2 rounded-lg">
                <QrCode className="w-4 h-4 text-[#6B7280]" />
                <div>
                  <p className="text-xs text-[#6B7280]">Table</p>
                  <p className="text-sm font-bold text-[#0F1729]">{tableNumber}</p>
                </div>
              </div>
            </div>
          </div>

          {/* User info bar */}
          <div className="mt-4 pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#6B7280]">Welcome back,</span>
              <span className="text-sm font-semibold text-[#0F1729]">{userName}</span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Loyalty Points Display */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-[#0F1729] to-[#2D3E5F] px-4 py-2 rounded-lg relative">
                <div className="flex items-center gap-2">
                  <div className="text-xl">
                    {loyaltyProfile.tier === 'platinum' ? '💎' : loyaltyProfile.tier === 'gold' ? '⭐' : '🌸'}
                  </div>
                  <div>
                    <p className="text-xs text-white/70">Your Points</p>
                    <p className="text-lg font-bold text-white">{loyaltyProfile.points.toLocaleString()}</p>
                  </div>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div>
                  <p className="text-xs text-white/70">Status</p>
                  <p className="text-sm font-bold text-[#D4AF37] uppercase">{loyaltyProfile.tier}</p>
                </div>
                {/* Info Button */}
                <button
                  onClick={() => setLoyaltyInfoOpen(true)}
                  className="ml-2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors group"
                  aria-label="Loyalty program information"
                >
                  <Info className="w-4 h-4 text-white group-hover:text-[#D4AF37]" />
                </button>
              </div>
              
              {flavorPreferences && (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-xs font-medium">
                  <Sparkles className="w-3 h-3" />
                  Personalized
                </div>
              )}
              
              {loyaltyProfile.isBirthday && (
                <div className="flex items-center gap-2 bg-pink-50 text-pink-700 px-3 py-2 rounded-lg text-xs font-medium">
                  🎂 Birthday Bonus Active
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Weather banner */}
        {weatherData && (
          <div className="mb-6 bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center">
              {getWeatherIcon(weatherData.condition)}
            </div>
            <div>
              <h3 className="font-semibold text-[#0F1729] text-sm">
                {weatherData.condition === 'rainy' && 'Perfect weather for hot ramen'}
                {weatherData.condition === 'sunny' && weatherData.temperature > 75 && 'Refreshing sashimi weather'}
                {weatherData.condition === 'sunny' && weatherData.temperature <= 75 && 'Beautiful day for dining'}
                {weatherData.condition === 'cloudy' && 'Cozy weather ahead'}
              </h3>
              <p className="text-xs text-[#6B7280]">{weatherData.description}</p>
            </div>
          </div>
        )}
        
        <Tabs defaultValue="sushi" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-white border border-[#E5E7EB] p-1">
            <TabsTrigger 
              value="sushi"
              className="data-[state=active]:bg-[#0F1729] data-[state=active]:text-white"
            >
              <span className="mr-2">🍱</span>
              Sushi
            </TabsTrigger>
            <TabsTrigger 
              value="ramen"
              className="data-[state=active]:bg-[#0F1729] data-[state=active]:text-white"
            >
              <span className="mr-2">🍜</span>
              Ramen
            </TabsTrigger>
            <TabsTrigger 
              value="appetizers"
              className="data-[state=active]:bg-[#0F1729] data-[state=active]:text-white"
            >
              <span className="mr-2">🥟</span>
              Appetizers
            </TabsTrigger>
            <TabsTrigger 
              value="drinks"
              className="data-[state=active]:bg-[#0F1729] data-[state=active]:text-white"
            >
              <span className="mr-2">🍵</span>
              Drinks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sushi" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.filter((item) => item.category === "sushi").map((item) => (
                <MenuItem key={item.id} item={item} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ramen" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.filter((item) => item.category === "ramen").map((item) => (
                <MenuItem key={item.id} item={item} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="appetizers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.filter((item) => item.category === "appetizers" || item.category === "mains").map((item) => (
                <MenuItem key={item.id} item={item} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="drinks" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {menuItems.filter((item) => item.category === "drinks").map((item) => (
                <MenuItem key={item.id} item={item} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* AI Recommendations - Enhanced with MAB */}
        {recommendations.length > 0 && (
          <div className="mt-16 relative">
            {/* Elegant divider */}
            <div className="absolute -top-8 left-0 right-0 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="h-px w-20 bg-gradient-to-r from-transparent to-[#7C8A7A]/30" />
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C8A7A]/40" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C8A7A]/60" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C8A7A]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C8A7A]/60" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C8A7A]/40" />
                </div>
                <div className="h-px w-20 bg-gradient-to-l from-transparent to-[#7C8A7A]/30" />
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-8 mt-8 flex-wrap">
              <div className="relative">
                {/* Animated glow */}
                <div className="absolute inset-0 w-14 h-14 bg-[#7C8A7A]/30 rounded-full blur-xl animate-pulse" />
                
                <div className="relative bg-gradient-to-br from-[#7C8A7A] to-[#9BA89A] rounded-2xl p-3 shadow-xl">
                  <Sparkles className="w-7 h-7 text-white relative z-10" strokeWidth={2} />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/30" />
                  
                  {/* Sparkle decorations */}
                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-[#7C8A7A] opacity-70 animate-ping" strokeWidth={2} />
                </div>
                
                <CherryBlossom className="absolute -bottom-1 -right-1 opacity-90 drop-shadow-md" size={24} />
              </div>
              
              <div className="flex-1">
                <h2 className="text-4xl font-bold text-[#4A5548] mb-1" style={{ fontFamily: 'serif' }}>おすすめ</h2>
                <p className="text-sm text-[#6B7669] font-light tracking-wide">
                  Multi-Armed Bandit AI • Thompson Sampling • Weather-Aware • Flavor-Matched
                </p>
              </div>
              
              <Badge variant="secondary" className="bg-gradient-to-r from-[#7C8A7A]/15 to-[#9BA89A]/15 text-[#4A5548] border-2 border-[#7C8A7A]/30 backdrop-blur-sm font-semibold px-4 py-2 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" strokeWidth={2} />
                AI Powered
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.item.id}
                  item={rec.item}
                  reason={rec.reason}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Shopping Cart */}
      <ShoppingCart
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
        loyaltyTier={loyaltyProfile.tier}
        birthdayDiscount={loyaltyProfile.isBirthday}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onClose={handlePaymentComplete}
        total={total}
        loyaltyPoints={loyaltyPoints}
        loyaltyProfile={loyaltyProfile}
      />

      {/* Loyalty Info Dialog */}
      <Dialog open={loyaltyInfoOpen} onOpenChange={setLoyaltyInfoOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0F1729] to-[#2D3E5F] rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-[#D4AF37]" />
              </div>
              Loyalty Program
            </DialogTitle>
            <DialogDescription>
              Earn points, unlock rewards, and enjoy exclusive benefits
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* How It Works */}
            <div className="bg-gradient-to-r from-[#0F1729] to-[#2D3E5F] rounded-xl p-6 text-white">
              <h3 className="text-lg font-bold mb-4">How It Works</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-[#0F1729]">1</span>
                  </div>
                  <div>
                    <p className="font-semibold">Order & Earn</p>
                    <p className="text-sm text-white/80">Earn points automatically with every purchase</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-[#0F1729]">2</span>
                  </div>
                  <div>
                    <p className="font-semibold">Level Up</p>
                    <p className="text-sm text-white/80">Reach Silver, Gold, and Platinum tiers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#D4AF37] rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-[#0F1729]">3</span>
                  </div>
                  <div>
                    <p className="font-semibold">Redeem Rewards</p>
                    <p className="text-sm text-white/80">Use points for discounts and exclusive items</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Membership Tiers */}
            <div>
              <h3 className="text-lg font-bold text-[#0F1729] mb-4">Membership Tiers</h3>
              <div className="space-y-4">
                {/* Silver Tier */}
                <div className={`border-2 rounded-xl p-4 ${loyaltyProfile.tier === 'silver' ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-[#E5E7EB]'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🌸</span>
                      <div>
                        <h4 className="font-bold text-[#0F1729]">Silver</h4>
                        <p className="text-xs text-[#6B7280]">Starting tier</p>
                      </div>
                    </div>
                    {loyaltyProfile.tier === 'silver' && (
                      <Badge className="bg-[#D4AF37] text-white">Current</Badge>
                    )}
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-600">✓</span>
                      <span className="text-[#6B7280]">Earn 1 point per $1 spent</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-600">✓</span>
                      <span className="text-[#6B7280]">5% birthday discount</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-600">✓</span>
                      <span className="text-[#6B7280]">Early access to seasonal menu</span>
                    </li>
                  </ul>
                </div>

                {/* Gold Tier */}
                <div className={`border-2 rounded-xl p-4 ${loyaltyProfile.tier === 'gold' ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-[#E5E7EB]'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⭐</span>
                      <div>
                        <h4 className="font-bold text-[#0F1729]">Gold</h4>
                        <p className="text-xs text-[#6B7280]">500+ points</p>
                      </div>
                    </div>
                    {loyaltyProfile.tier === 'gold' && (
                      <Badge className="bg-[#D4AF37] text-white">Current</Badge>
                    )}
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-600">✓</span>
                      <span className="text-[#6B7280]">Earn 1.5 points per $1 spent</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-600">✓</span>
                      <span className="text-[#6B7280]">10% birthday discount</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-600">✓</span>
                      <span className="text-[#6B7280]">Free appetizer on birthday</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-600">✓</span>
                      <span className="text-[#6B7280]">Priority seating</span>
                    </li>
                  </ul>
                </div>

                {/* Platinum Tier */}
                <div className={`border-2 rounded-xl p-4 ${loyaltyProfile.tier === 'platinum' ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-[#E5E7EB]'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💎</span>
                      <div>
                        <h4 className="font-bold text-[#0F1729]">Platinum</h4>
                        <p className="text-xs text-[#6B7280]">1500+ points</p>
                      </div>
                    </div>
                    {loyaltyProfile.tier === 'platinum' && (
                      <Badge className="bg-[#D4AF37] text-white">Current</Badge>
                    )}
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-600">✓</span>
                      <span className="text-[#6B7280]">Earn 2 points per $1 spent</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-600">✓</span>
                      <span className="text-[#6B7280]">15% birthday discount</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-600">✓</span>
                      <span className="text-[#6B7280]">Free meal on birthday</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-600">✓</span>
                      <span className="text-[#6B7280]">Exclusive VIP events</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-600">✓</span>
                      <span className="text-[#6B7280]">Personal chef recommendations</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Redeem Points */}
            <div className="bg-[#F9FAFB] rounded-xl p-6">
              <h3 className="text-lg font-bold text-[#0F1729] mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-[#D4AF37]" />
                Redeem Your Points
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-[#E5E7EB]">
                  <p className="font-semibold text-sm text-[#0F1729]">$5 Off</p>
                  <Badge variant="outline" className="text-xs border-[#D4AF37] text-[#D4AF37] mt-1">100 pts</Badge>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#E5E7EB]">
                  <p className="font-semibold text-sm text-[#0F1729]">$10 Off</p>
                  <Badge variant="outline" className="text-xs border-[#D4AF37] text-[#D4AF37] mt-1">200 pts</Badge>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#E5E7EB]">
                  <p className="font-semibold text-sm text-[#0F1729]">$15 Off</p>
                  <Badge variant="outline" className="text-xs border-[#D4AF37] text-[#D4AF37] mt-1">300 pts</Badge>
                </div>
                <div className="bg-white rounded-lg p-3 border border-[#E5E7EB]">
                  <p className="font-semibold text-sm text-[#0F1729]">Free Appetizer</p>
                  <Badge variant="outline" className="text-xs border-[#D4AF37] text-[#D4AF37] mt-1">250 pts</Badge>
                </div>
              </div>
              <p className="text-xs text-[#6B7280] mt-4">
                Redeem points at checkout when placing your order
              </p>
            </div>

            {/* Referral Program */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-[#0F1729] mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Refer a Friend
              </h3>
              <p className="text-sm text-[#6B7280] mb-4">
                Share your referral code and both of you get 100 bonus points!
              </p>
              <div className="bg-white rounded-lg p-4 border-2 border-dashed border-blue-300">
                <p className="text-xs text-[#6B7280] mb-1">Your Referral Code</p>
                <p className="text-xl font-bold text-blue-600 tracking-wider">{loyaltyProfile.referralCode}</p>
              </div>
            </div>

            {/* Close Button */}
            <Button 
              onClick={() => setLoyaltyInfoOpen(false)}
              className="w-full bg-[#0F1729] hover:bg-[#1A2642] text-white"
            >
              Got it!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(-5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}