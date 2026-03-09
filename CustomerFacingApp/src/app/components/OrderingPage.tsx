import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { MenuItem } from "./MenuItem";
import { RecommendationCard } from "./RecommendationCard";
import { ShoppingCart } from "./ShoppingCart";
import { PaymentDialog } from "./PaymentDialog";
import { LoyaltyCard, LoyaltyProfile } from "./LoyaltyCard";
import {InAppGames} from "./InAppGames";
import { Skeleton } from "./ui/skeleton";
import { QrCode, UtensilsCrossed, Sparkles, CloudRain, Sun, Cloud, Info, Gift, Users, Star, Plus, Flame } from "lucide-react";
import { toast } from "sonner";
import { CherryBlossom } from "./JapanesePattern";
import { MenuItem as MenuItemType, CartItem, FlavorPreferences, WeatherData } from "../types";
import { generateRecommendations } from "../services/recommendationService";
import { applyDynamicPricing, recordFlashSaleOrder, hasActiveFlashSale } from "../services/dynamicPricingService";
import { getCurrentWeather } from "../services/weatherService";
import { recordSuccess } from "../services/mabService";
import { createOrder, fetchLoyaltyProfile, fetchMenuItems } from "../services/api";
import { calculateCartSubtotal, calculatePricing, type DiscountId } from "../lib/pricing";
import { getFallbackCustomerProfile } from "../lib/customerProfiles";

interface OrderingPageProps {
  tableNumber: string;
  userName: string;
  phoneNumber: string;
  flavorPreferences?: FlavorPreferences;
  onUpdateFlavorPreferences: () => void;
}

// Enhanced menu items with flavor profiles, weather tags, and MAB properties
const BASE_MENU_ITEMS: MenuItemType[] = [
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
    image: "https://images.unsplash.com/photo-1598514982501-3b7b02c27d64",
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
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754",
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
    weatherTags: ['sunny', 'hot'],
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
    weatherTags: ['rainy', 'cold'],
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
    weatherTags: ['sunny'],
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
    weatherTags: ['sunny', 'hot'],
  },

  {
    id: "124",
    name: "Iced Lemon Tea",
    description: "Refreshing black tea served over ice with fresh lemon slices for a light citrus taste.",
    price: 3.50,
    category: "drinks",
    image: "images/drinks/iced-lemon-tea.jpg",
    isHighMargin: true,
    isNew: false
  },
  {
    id: "125",
    name: "Thai Milk Tea",
    description: "Classic Thai-style tea brewed strong and blended with sweetened milk, served chilled.",
    price: 4.50,
    category: "drinks",
    image: "images/drinks/thai-milk-tea.jpg",
    isHighMargin: true,
    isNew: false
  },
  {
    id: "126",
    name: "Fresh Watermelon Juice",
    description: "Freshly blended watermelon juice with no added sugar, naturally sweet and hydrating.",
    price: 5.50,
    category: "drinks",
    image: "images/drinks/watermelon-juice.jpg",
    isHighMargin: false,
    isNew: true
  },
];

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

function getPerfectWeatherMessage(weather: WeatherData): string {
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

function getTierFromPoints(points: number): LoyaltyProfile["tier"] {
  if (points >= 1500) return "platinum";
  if (points >= 500) return "gold";
  return "silver";
}

function mergeMenuImages(items: MenuItemType[]): MenuItemType[] {
  const fallbackImageByName = new Map(
    BASE_MENU_ITEMS.map((item) => [item.name, item.image]),
  );

  return items.map((item) => ({
    ...item,
    image: item.image || fallbackImageByName.get(item.name) || "",
  }));
}

export function OrderingPage({
  tableNumber,
  userName,
  phoneNumber,
  flavorPreferences,
  onUpdateFlavorPreferences,
}: OrderingPageProps) {
  const fallbackCustomerProfile = useMemo(
    () => getFallbackCustomerProfile(phoneNumber),
    [phoneNumber],
  );
  const initialLoyaltyProfile: LoyaltyProfile = {
    tier: fallbackCustomerProfile.loyaltyProfile.tier,
    points: fallbackCustomerProfile.loyaltyProfile.points,
    name: userName || fallbackCustomerProfile.fullName,
    isBirthday: fallbackCustomerProfile.loyaltyProfile.isBirthday,
    referralCode: fallbackCustomerProfile.loyaltyProfile.referralCode,
  };
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [loyaltyInfoOpen, setLoyaltyInfoOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"ordering" | "games">("ordering");
  const [hasPlacedOrder, setHasPlacedOrder] = useState(false);
  const [recommendations, setRecommendations] = useState<Array<{ item: MenuItemType; reason: string }>>([]);
  const [loyaltyProfile, setLoyaltyProfile] = useState<LoyaltyProfile>(initialLoyaltyProfile);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemType[]>(BASE_MENU_ITEMS);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [isLoyaltyLoading, setIsLoyaltyLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("mains");
  const [selectedItem, setSelectedItem] = useState<MenuItemType | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Fetch weather on mount
  useEffect(() => {
    const fetchWeather = async () => {
      const data = await getCurrentWeather();
      setWeatherData(data);
    };
    fetchWeather();
  }, []);

  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        const items = await fetchMenuItems();
        if (items.length > 0) {
          setMenuItems(applyDynamicPricing(mergeMenuImages(items)));
          setActiveCategory(items[0]?.category ?? "mains");
        }
      } catch {
        setMenuItems(applyDynamicPricing(BASE_MENU_ITEMS));
      } finally {
        setIsMenuLoading(false);
      }
    };

    void loadMenuItems();
  }, []);

  useEffect(() => {
    const loadLoyaltyProfile = async () => {
      const profile = await fetchLoyaltyProfile(phoneNumber);
      if (profile) {
        setLoyaltyProfile(profile);
      } else {
        setLoyaltyProfile({
          ...fallbackCustomerProfile.loyaltyProfile,
          name: userName || fallbackCustomerProfile.fullName,
        });
      }
      setIsLoyaltyLoading(false);
    };

    void loadLoyaltyProfile();
  }, [fallbackCustomerProfile, phoneNumber, userName]);

  const isInitialDataLoading = isMenuLoading || isLoyaltyLoading;

  const handleItemClick = (item: MenuItemType) => {
  setSelectedItem(item);
  setItemDialogOpen(true);
};

const handleAddFromDialog = (item: MenuItemType) => {
  handleAddToCart(item);
  setItemDialogOpen(false);
  setSelectedItem(null);
};

  // Generate recommendations when cart or flavor preferences change
  useEffect(() => {
    const newRecommendations = generateRecommendations(
      menuItems,
      {
        cartItems: cart,
        flavorPreferences,
        weather: weatherData || undefined,
      },
      4
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

  const addLoyaltyPoints = (
    pointsToAdd: number,
    source: string,
    updatedLoyalty?: {
      pointsBalance: number;
      tier: LoyaltyProfile["tier"];
    },
  ) => {
    if (pointsToAdd <= 0 && !updatedLoyalty) {
      return;
    }

    setLoyaltyProfile((current) => {
      if (updatedLoyalty) {
        return {
          ...current,
          points: updatedLoyalty.pointsBalance,
          tier: updatedLoyalty.tier,
        };
      }

      const updatedPoints = current.points + pointsToAdd;

      return {
        ...current,
        points: updatedPoints,
        tier: getTierFromPoints(updatedPoints),
      };
    });

    toast.success(`+${pointsToAdd} points from ${source}`);
  };

  const handlePaymentComplete = async (
    paymentMethod: "card" | "mobile",
    selectedDiscountId: DiscountId | null,
  ) => {
    const subtotal = calculateCartSubtotal(cart);
    const pricing = calculatePricing(subtotal, loyaltyProfile, selectedDiscountId);
    let completionResult:
      | {
          earnedPoints: number;
          pointsBalance: number;
        }
      | undefined;

    setIsSubmittingOrder(true);

    try {
      const response = await createOrder({
        customerName: userName,
        phoneNumber,
        tableCode: tableNumber,
        items: cart.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity
        })),
        paymentMethod: paymentMethod === "card" ? "CARD" : "MOBILE",
        birthdayDiscountPercent: pricing.birthdayDiscountPercent,
        selectedDiscountId: pricing.selectedDiscountId,
      });

      cart.forEach((item) => {
        recordSuccess(item.id);
      });

      if (response.loyalty) {
        setLoyaltyProfile((current) => ({
          ...current,
          points: response.loyalty!.pointsBalance,
          tier: response.loyalty!.tier,
        }));
        toast.success(`Payment successful. You earned ${response.loyalty.earnedPoints} points.`);
        completionResult = {
          earnedPoints: response.loyalty.earnedPoints,
          pointsBalance: response.loyalty.pointsBalance,
        };
      } else {
        const refreshedProfile = await fetchLoyaltyProfile(phoneNumber);
        if (refreshedProfile) {
          setLoyaltyProfile(refreshedProfile);
          completionResult = {
            earnedPoints: pricing.pointsEarned,
            pointsBalance: refreshedProfile.points,
          };
        } else {
          toast.success("Payment successful. Redirecting you to Games.");
        }
      }

      setHasPlacedOrder(true);
      setCurrentView("games");
      setPaymentDialogOpen(false);
      setCart([]);

      return completionResult;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Unable to place your order right now.",
      );
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const subtotal = calculateCartSubtotal(cart);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
            {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB] shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and User Info in one row */}
            <div className="flex items-center gap-6">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#0F1729] to-[#2D3E5F] rounded-full flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4 text-[#D4AF37]" strokeWidth={2} />
                </div>
                <div>
                  <h1 className="text-base font-bold text-[#0F1729] leading-tight">Koryori Hayashi</h1>
                  <p className="text-[10px] text-[#6B7280]">小料理林</p>
                </div>
              </div>
            </div>
            
            {/* Right side - Weather and Table */}
            <div className="flex items-center gap-3">
              
              <div className="flex items-center gap-1.5 bg-[#F3F4F6] px-3 py-1.5 rounded-lg">
                <QrCode className="w-3.5 h-3.5 text-[#6B7280]" />
                <span className="text-xs text-[#6B7280]">Table</span>
                <span className="text-sm font-bold text-[#0F1729]">{tableNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

            


         {currentView === "games" ? (
        <InAppGames
          currentPoints={loyaltyProfile.points}
          phoneNumber={phoneNumber}
          userName={userName}
          onEarnPoints={addLoyaltyPoints}
          onBackToOrdering={() => setCurrentView("ordering")}
        />
      ) : (
      <>
            {/* Main Content */}
      <main className="container mx-auto px-6 py-8 pt-16 relative">
        {isInitialDataLoading ? (
          <div className="space-y-6">
            <div className="max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full bg-[#F3F4F6]" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-[#F3F4F6]" />
                  <Skeleton className="h-3 w-24 bg-[#F3F4F6]" />
                </div>
              </div>
              <Skeleton className="h-20 w-full bg-[#F3F4F6]" />
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#0F1729]">Syncing your menu and rewards</p>
                  <p className="text-xs text-[#6B7280]">Pulling the latest backend data for this session.</p>
                </div>
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37]" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }, (_, index) => (
                  <div
                    key={`menu-skeleton-${index}`}
                    className="rounded-2xl border border-[#E5E7EB] p-4"
                  >
                    <Skeleton className="mb-4 h-40 w-full rounded-xl bg-[#F3F4F6]" />
                    <Skeleton className="mb-2 h-4 w-2/3 bg-[#F3F4F6]" />
                    <Skeleton className="mb-4 h-3 w-full bg-[#F3F4F6]" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-16 bg-[#F3F4F6]" />
                      <Skeleton className="h-9 w-24 rounded-lg bg-[#F3F4F6]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
        <>
        <div className="mb-6 max-w-md">
          <LoyaltyCard profile={loyaltyProfile} />
        </div>

        {/* Status Badges - Now in a single row */}
        <div className="absolute top-6 right-6 flex items-center gap-2">
          {/* Guest/Loyalty Info Button - moved here */}
           <button
            onClick={() => setLoyaltyInfoOpen(true)}
            className="flex items-center gap-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] px-3 py-2 rounded-lg text-xs font-medium transition-colors"
          >

            <span className="text-[#6B7280]">👋</span>
            <span className="text-[#0F1729] font-medium">{userName}</span>
            <span className="text-[#6B7280]">•</span>
            <span className="text-[#D4AF37]">⭐</span>
            <span className="text-[#0F1729] font-medium">
              {isLoyaltyLoading ? "Syncing..." : loyaltyProfile.points}
            </span>
             <span className="text-[#6B7280] text-[10px] capitalize">
              {isLoyaltyLoading ? "(loading)" : `(${loyaltyProfile.tier})`}
             </span>
          </button>

          {hasPlacedOrder && (
            <button
              onClick={() => setCurrentView("games")}
              className="flex items-center gap-2 bg-[#0F1729] hover:bg-[#1A2642] px-3 py-2 rounded-lg text-xs font-medium text-white transition-colors"
            >
              Play Games
            </button>
          )}
          
          {/* Personalized badge */}

          {flavorPreferences && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-xs font-medium">
              <Sparkles className="w-3 h-3" />
              Personalized
            </div>
          )}

          <button
            onClick={onUpdateFlavorPreferences}
            className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
          >
            <Info className="h-3 w-3" />
            Update Taste Profile
          </button>
          
          {/* Birthday badge */}
          {loyaltyProfile.isBirthday && (
            <div className="flex items-center gap-2 bg-pink-50 text-pink-700 px-3 py-2 rounded-lg text-xs font-medium">
              🎂 Birthday Bonus Active
            </div>
          )}
        </div>
        
        {/* Weather banner */}
        {weatherData && (
          <div className="mb-6 bg-white border border-[#E5E7EB] rounded-xl p-4 flex items-center gap-3">
             {weatherData && (
                <div className="flex items-center gap-1.5 bg-[#F3F4F6] px-2 py-1.5 rounded-lg">
                  {getWeatherIcon(weatherData.condition)}
                  <span className="text-xs font-medium text-[#0F1729]">{weatherData.temperature}°F</span>
                </div>
              )}
            <div>
              <h3 className="font-semibold text-[#0F1729] text-sm">
                {getPerfectWeatherMessage(weatherData)}
              </h3>
              <p className="text-xs text-[#6B7280]">{weatherData.description}</p>
            </div>
          </div>
        )}
        
                   {/* Main Content with Vertical Categories */}
      <div className="flex gap-6">
               {/* Left Sidebar - Vertical Categories */}
        <aside className="w-24 shrink-0">
          <div className="sticky top-20 bg-white rounded-xl border border-[#E5E7EB] p-2">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveCategory("mains")}
                title="Mains"
                className={`w-full flex items-center px-2 py-2.5 rounded-lg text-left transition-colors ${
                  activeCategory === "mains" 
                    ? "bg-[#0F1729] text-white" 
                    : "hover:bg-[#F3F4F6] text-[#0F1729]"
                }`}
              >
                <span className="text-base mr-1.5">🍱</span>
                <span className="text-xs truncate">Mains</span>
              </button>
              <button
                onClick={() => setActiveCategory("appetizers")}
                title="Appetizers"
                className={`w-full flex items-center px-2 py-2.5 rounded-lg text-left transition-colors ${
                  activeCategory === "appetizers" 
                    ? "bg-[#0F1729] text-white" 
                    : "hover:bg-[#F3F4F6] text-[#0F1729]"
                }`}
              >
                <span className="text-base mr-1.5">🥟</span>
                <span className="text-xs truncate">Appetizers</span>
              </button>
              <button
                onClick={() => setActiveCategory("ramen")}
                title="Ramen"
                className={`w-full flex items-center px-2 py-2.5 rounded-lg text-left transition-colors ${
                  activeCategory === "ramen" 
                    ? "bg-[#0F1729] text-white" 
                    : "hover:bg-[#F3F4F6] text-[#0F1729]"
                }`}
              >
                <span className="text-base mr-1.5">🍜</span>
                <span className="text-xs truncate">Udon</span>
              </button>
              <button
                onClick={() => setActiveCategory("desserts")}
                title="Desserts"
                className={`w-full flex items-center px-2 py-2.5 rounded-lg text-left transition-colors ${
                  activeCategory === "desserts" 
                    ? "bg-[#0F1729] text-white" 
                    : "hover:bg-[#F3F4F6] text-[#0F1729]"
                }`}
              >
                <span className="text-base mr-1.5">🍦</span>
                <span className="text-xs truncate">Desserts</span>
              </button>
              <button
                onClick={() => setActiveCategory("drinks")}
                title="Drinks"
                className={`w-full flex items-center px-2 py-2.5 rounded-lg text-left transition-colors ${
                  activeCategory === "drinks" 
                    ? "bg-[#0F1729] text-white" 
                    : "hover:bg-[#F3F4F6] text-[#0F1729]"
                }`}
              >
                <span className="text-base mr-1.5">🍵</span>
                <span className="text-xs truncate">Drinks</span>
              </button>
            </div>
          </div>
        </aside>

                {/* Right Content - Menu Items */}
        <section className="flex-1 min-w-0">
          {activeCategory === "mains" && (
            <>
              <h2 className="text-2xl font-bold text-[#0F1729] mb-6">Mains</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {menuItems.filter(item => item.category === 'mains').map(item => (
                 <div 
  key={item.id} 
  className="w-full cursor-pointer transition-transform hover:scale-[1.02]"
  onClick={() => handleItemClick(item)}
>
  <MenuItem item={item} onAddToCart={handleAddToCart} />
</div>
                ))}
              </div>
            </>
          )}
          
                  {activeCategory === "appetizers" && (
            <>
              <h2 className="text-2xl font-bold text-[#0F1729] mb-6">Appetizers</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {menuItems.filter(item => item.category === 'appetizers').map(item => (
                  <div 
                    key={item.id} 
                    className="w-full cursor-pointer transition-transform hover:scale-[1.02]"
                    onClick={() => handleItemClick(item)}
                  >
                    <MenuItem item={item} onAddToCart={handleAddToCart} />
                  </div>
                ))}
              </div>
            </>
          )}
          
                    {activeCategory === "ramen" && (
            <>
              <h2 className="text-2xl font-bold text-[#0F1729] mb-6">Ramen</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {menuItems.filter(item => item.category === 'ramen').map(item => (
                  <div 
                    key={item.id} 
                    className="w-full cursor-pointer transition-transform hover:scale-[1.02]"
                    onClick={() => handleItemClick(item)}
                  >
                    <MenuItem item={item} onAddToCart={handleAddToCart} />
                  </div>
                ))}
              </div>
            </>
          )}

                    {activeCategory === "desserts" && (
            <>
              <h2 className="text-2xl font-bold text-[#0F1729] mb-6">Desserts</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {menuItems.filter(item => item.category === 'desserts').map(item => (
                  <div 
                    key={item.id} 
                    className="w-full cursor-pointer transition-transform hover:scale-[1.02]"
                    onClick={() => handleItemClick(item)}
                  >
                    <MenuItem item={item} onAddToCart={handleAddToCart} />
                  </div>
                ))}
              </div>
            </>
          )}
          
                    {activeCategory === "drinks" && (
            <>
              <h2 className="text-2xl font-bold text-[#0F1729] mb-6">Drinks</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {menuItems.filter(item => item.category === 'drinks').map(item => (
                  <div 
                    key={item.id} 
                    className="w-full cursor-pointer transition-transform hover:scale-[1.02]"
                    onClick={() => handleItemClick(item)}
                  >
                    <MenuItem item={item} onAddToCart={handleAddToCart} />
                  </div>
                ))}
              </div>
            </>
          )}

        </section>
      </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
        </>
        )}
      </main>

      {/* Shopping Cart */}
      {!isInitialDataLoading && (
        <ShoppingCart
          items={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleCheckout}
          loyaltyProfile={loyaltyProfile}
        />
      )}

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        onPaymentComplete={handlePaymentComplete}
        subtotal={subtotal}
        loyaltyProfile={loyaltyProfile}
        isSubmittingOrder={isSubmittingOrder}
      />

      {/* Item Detail Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#0F1729] to-[#2D3E5F] rounded-full flex items-center justify-center">
                    <UtensilsCrossed className="w-5 h-5 text-[#D4AF37]" />
                  </div>
                  {selectedItem.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedItem.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Image */}
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                  <img 
                    src={selectedItem.image} 
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {selectedItem.isNew && (
                      <Badge className="bg-purple-600 text-white px-3 py-1.5">
                        <Sparkles className="w-4 h-4 mr-1.5" />
                        NEW
                      </Badge>
                    )}
                    {selectedItem.spicy && (
                      <Badge className="bg-red-500 text-white px-3 py-1.5">
                        {Array.from({ length: selectedItem.spicy }).map((_, i) => (
                          <span key={i}>🌶️</span>
                        ))}
                      </Badge>
                    )}
                  </div>
                  
                  {selectedItem.isHighMargin && !selectedItem.isNew && (
                    <Badge className="absolute top-4 right-4 bg-[#D4AF37] text-white px-3 py-1.5">
                      <Sparkles className="w-4 h-4 mr-1.5" />
                      Chef's Pick
                    </Badge>
                  )}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Price */}
                  <div className="bg-[#F3F4F6] rounded-xl p-4">
                    <p className="text-xs text-[#6B7280] mb-1">Price</p>
                    <p className="text-2xl font-bold text-[#0F1729]">
                      ${selectedItem.price.toFixed(2)}
                    </p>
                    {selectedItem.originalPrice && (
                      <p className="text-xs text-[#9CA3AF] line-through">
                        ${selectedItem.originalPrice.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div className="bg-[#F3F4F6] rounded-xl p-4">
                    <p className="text-xs text-[#6B7280] mb-1">Category</p>
                    <p className="text-lg font-semibold text-[#0F1729] capitalize">
                      {selectedItem.category}
                    </p>
                  </div>
                </div>

                {/* Flavor Profile */}
                {selectedItem.flavorProfile && (
                  <div className="bg-gradient-to-br from-[#F3F4F6] to-white rounded-xl p-4">
                    <h3 className="font-semibold text-[#0F1729] mb-3">Flavor Profile</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedItem.flavorProfile.umami !== undefined && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Umami</span>
                            <span className="font-medium">{(selectedItem.flavorProfile.umami * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-600 rounded-full"
                              style={{ width: `${selectedItem.flavorProfile.umami * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {selectedItem.flavorProfile.citrus !== undefined && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Citrus</span>
                            <span className="font-medium">{(selectedItem.flavorProfile.citrus * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-yellow-400 rounded-full"
                              style={{ width: `${selectedItem.flavorProfile.citrus * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {selectedItem.flavorProfile.refreshing !== undefined && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Refreshing</span>
                            <span className="font-medium">{(selectedItem.flavorProfile.refreshing * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-400 rounded-full"
                              style={{ width: `${selectedItem.flavorProfile.refreshing * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {selectedItem.flavorProfile.hearty !== undefined && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Hearty</span>
                            <span className="font-medium">{(selectedItem.flavorProfile.hearty * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-600 rounded-full"
                              style={{ width: `${selectedItem.flavorProfile.hearty * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Weather Tags */}
                {selectedItem.weatherTags && selectedItem.weatherTags.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4">
                    <h3 className="font-semibold text-[#0F1729] mb-2">Perfect for</h3>
                    <div className="flex gap-2">
                      {selectedItem.weatherTags.map(tag => (
                        <Badge key={tag} variant="outline" className="bg-white capitalize">
                          {tag === 'sunny' && '☀️ '}
                          {tag === 'rainy' && '🌧️ '}
                          {tag === 'cold' && '❄️ '}
                          {tag === 'hot' && '🔥 '}
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flash Sale Info */}
                {selectedItem.flashSaleRemaining && selectedItem.flashSaleRemaining > 0 && (
                  <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-4 text-white">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-5 h-5" />
                      <h3 className="font-bold">Flash Sale!</h3>
                    </div>
                    <p className="text-sm mb-1">
                      {selectedItem.discountPercentage}% OFF - Only {selectedItem.flashSaleRemaining} left!
                    </p>
                    {selectedItem.surplusIngredient && (
                      <p className="text-xs text-white/90">
                        ♻️ Made with fresh {selectedItem.surplusIngredient}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setItemDialogOpen(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => handleAddFromDialog(selectedItem)}
                    className={`flex-1 ${
                      selectedItem.flashSaleRemaining && selectedItem.flashSaleRemaining > 0
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                        : 'bg-[#0F1729] hover:bg-[#1A2642]'
                    } text-white`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
              <Button
                onClick={onUpdateFlavorPreferences}
                variant="outline"
                className="mt-4 border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                Update My Taste Profile
              </Button>
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
      </>
      )}
    </div>
  );
}
