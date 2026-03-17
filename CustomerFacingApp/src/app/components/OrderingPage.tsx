import { useState, useEffect, useMemo } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { MenuItem } from "./MenuItem";
import { RecommendationCard } from "./RecommendationCard";
import { ShoppingCart } from "./ShoppingCart";
import { PaymentDialog } from "./PaymentDialog";
import { LoyaltyCard, LoyaltyProfile } from "./LoyaltyCard";
import { InAppGames } from "./InAppGames";
import { Skeleton } from "./ui/skeleton";
import { QrCode, UtensilsCrossed, Sparkles, CloudRain, Sun, Cloud, Gift, Users, Star, Plus, Flame } from "lucide-react";
import { toast } from "sonner";
import { CherryBlossom, SeigaihaPattern } from "./JapanesePattern";
import { MenuItem as MenuItemType, CartItem, FlavorPreferences, WeatherData } from "../types";
import { generateRecommendations } from "../services/recommendationService";
import { applyDynamicPricing, recordFlashSaleOrder, hasActiveFlashSale } from "../services/dynamicPricingService";
import { getCurrentWeather } from "../services/weatherService";
import { recordSuccess } from "../services/mabService";
import { createOrder, fetchCustomerOrderHistory, fetchLoyaltyProfile, fetchMenuItems, fetchMenuItemPairings, type BackendMenuItemPairing } from "../services/api";
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

const CATEGORY_OPTIONS = [
  { id: "mains", label: "Mains" },
  { id: "appetizers", label: "Appetizers" },
  { id: "ramen", label: "Udon" },
  { id: "desserts", label: "Desserts" },
  { id: "drinks", label: "Drinks" },
] as const;

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
  const [menuItemPairings, setMenuItemPairings] = useState<BackendMenuItemPairing[] | null>(null);
  const [orderHistoryItemIds, setOrderHistoryItemIds] = useState<string[]>([]);
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
    let cancelled = false;

    fetchMenuItemPairings()
      .then((pairings) => {
        if (cancelled) return;
        setMenuItemPairings(pairings);
      })
      .catch(() => {
        if (cancelled) return;
        setMenuItemPairings(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!phoneNumber || phoneNumber.trim().length < 6) {
      setOrderHistoryItemIds([]);
      return () => {
        cancelled = true;
      };
    }

    fetchCustomerOrderHistory(phoneNumber)
      .then((itemIds) => {
        if (cancelled) return;
        setOrderHistoryItemIds(itemIds);
      })
      .catch(() => {
        if (cancelled) return;
        setOrderHistoryItemIds([]);
      });

    return () => {
      cancelled = true;
    };
  }, [phoneNumber]);

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
        menuItemPairings: menuItemPairings || undefined,
        userHistory: orderHistoryItemIds,
      },
      6
    );
    setRecommendations(newRecommendations);
  }, [cart, flavorPreferences, weatherData, menuItems, menuItemPairings, orderHistoryItemIds]);

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

      if (phoneNumber && phoneNumber.trim().length >= 6) {
        fetchCustomerOrderHistory(phoneNumber)
          .then((itemIds) => setOrderHistoryItemIds(itemIds))
          .catch(() => setOrderHistoryItemIds([]));
      }

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
  const activeCategoryLabel =
    CATEGORY_OPTIONS.find((category) => category.id === activeCategory)?.label ?? "Mains";
  const activeMenuItems = menuItems.filter((item) => item.category === activeCategory);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SeigaihaPattern />
      <div className="pointer-events-none absolute left-[-6rem] top-12 h-64 w-64 rounded-full bg-[color:var(--gold)]/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-7rem] right-[-4rem] h-72 w-72 rounded-full bg-[color:var(--olive)]/10 blur-3xl" />
            {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[rgba(248,244,234,0.88)] shadow-sm backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo and User Info in one row */}
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[color:var(--ink)] text-[color:var(--gold)] shadow-[0_16px_32px_rgba(40,52,90,0.15)]">
                  <UtensilsCrossed className="h-6 w-6" />
                </div>
                <div>
                  <p className="menu-kicker mb-1">Koryori Hayashi</p>
                  <h1 className="menu-title text-3xl leading-none text-[color:var(--ink)]">Lunch Menu</h1>
                </div>
              </div>
            </div>
            
            {/* Right side - Weather and Table */}
            <div className="flex flex-wrap items-center justify-end gap-2">
              {weatherData && (
                <div className="stamp-badge flex items-center gap-2 rounded-full px-3 py-2 text-xs uppercase tracking-[0.14em]">
                  {getWeatherIcon(weatherData.condition)}
                  <span>{weatherData.temperature}F</span>
                </div>
              )}

              <div className="stamp-badge flex items-center gap-2 rounded-full px-3 py-2 text-xs uppercase tracking-[0.14em]">
                <QrCode className="h-3.5 w-3.5" />
                <span>Table {tableNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

            


         {currentView === "games" ? (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <InAppGames
            currentPoints={loyaltyProfile.points}
            phoneNumber={phoneNumber}
            userName={userName}
            onEarnPoints={addLoyaltyPoints}
            onBackToOrdering={() => setCurrentView("ordering")}
          />
        </main>
      ) : (
      <>
            {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 relative">
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
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        
        <section className="space-y-6">
          {weatherData && (
            <div className="paper-panel flex flex-col gap-4 rounded-[28px] border-[color:var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-center gap-3">
                <div className="stamp-badge flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.14em]">
                  {getWeatherIcon(weatherData.condition)}
                  <span>{weatherData.temperature}F</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--ink)]">
                    {getPerfectWeatherMessage(weatherData)}
                  </h3>
                  <p className="text-xs text-[color:var(--ink-soft)]">{weatherData.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="stamp-badge rounded-full px-4 py-2 text-xs uppercase tracking-[0.14em] text-[color:var(--ink)]">
                  Table {tableNumber}
                </div>
                <div className="stamp-badge rounded-full px-4 py-2 text-xs uppercase tracking-[0.14em] text-[color:var(--ink)]">
                  {userName}
                </div>
              </div>
            </div>
          )}

          <div className="paper-panel rounded-[28px] border-[color:var(--border)] p-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {CATEGORY_OPTIONS.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`shrink-0 rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.14em] transition-colors ${
                    activeCategory === category.id
                      ? "bg-[color:var(--ink)] text-[color:var(--paper)] shadow-[0_14px_30px_rgba(40,52,90,0.14)]"
                      : "border border-[color:var(--border)] bg-white/72 text-[color:var(--ink)] hover:border-[color:var(--gold)]/45 hover:bg-white"
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <div className="paper-panel rounded-[30px] border-[color:var(--border)] p-6 sm:p-8">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="menu-kicker mb-2">Menu</p>
                <h2 className="menu-title text-4xl text-[color:var(--ink)]">{activeCategoryLabel}</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {flavorPreferences && (
                  <div className="rounded-full border border-emerald-600/18 bg-emerald-50 px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-emerald-700">
                    Personalized
                  </div>
                )}
                {loyaltyProfile.isBirthday && (
                  <div className="rounded-full border border-[color:var(--rose)]/20 bg-pink-50 px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-pink-700">
                    Birthday Bonus Active
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
              {activeMenuItems.map((item) => (
                <div
                  key={item.id}
                  className="w-full cursor-pointer transition-transform hover:scale-[1.01]"
                  onClick={() => handleItemClick(item)}
                >
                  <MenuItem item={item} onAddToCart={handleAddToCart} />
                </div>
              ))}
            </div>
          </div>

          {recommendations.length > 0 && (
            <div className="paper-panel rounded-[30px] border-[color:var(--border)] p-6 sm:p-8">
              <div className="mb-8 flex flex-wrap items-center gap-4">
                <div className="relative rounded-[22px] bg-[linear-gradient(135deg,var(--ink),rgba(40,52,90,0.76))] p-3 shadow-xl">
                  <Sparkles className="relative z-10 h-7 w-7 text-white" strokeWidth={2} />
                  <div className="absolute inset-0 rounded-[22px] bg-gradient-to-t from-transparent to-white/20" />
                  <CherryBlossom className="absolute -bottom-2 -right-2 opacity-90 drop-shadow-md" size={24} />
                </div>

                <div>
                  <p className="menu-kicker mb-2">Suggested Dishes</p>
                  <h2 className="menu-title text-4xl text-[color:var(--ink)]">Recommended for Your Table</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
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
        </section>

        <aside className="order-first space-y-4 self-start xl:order-none xl:sticky xl:top-24">
          <LoyaltyCard profile={loyaltyProfile} />

          <div className="paper-panel rounded-[30px] border-[color:var(--border)] p-5 sm:p-6">
            <p className="menu-kicker mb-2">Quick Actions</p>
            <h3 className="menu-title text-3xl text-[color:var(--ink)]">Your Table</h3>

            <div className="mt-5 space-y-3">
              <Button
                onClick={onUpdateFlavorPreferences}
                className="h-12 w-full rounded-[20px] bg-[color:var(--ink)] text-sm font-semibold text-[color:var(--paper)] shadow-[0_18px_34px_rgba(40,52,90,0.16)] hover:bg-[color:var(--ink)]/92"
              >
                <Sparkles className="mr-2 h-4 w-4 text-[color:var(--gold)]" />
                Update Taste Profile
              </Button>

              {hasPlacedOrder && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentView("games")}
                  className="h-12 w-full rounded-[20px] border-[color:var(--border)] bg-white/78 text-sm font-semibold text-[color:var(--ink)] hover:border-[color:var(--gold)]/45 hover:bg-white"
                >
                  Play Games
                </Button>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[22px] border border-[color:var(--border)] bg-white/72 px-4 py-4">
                <p className="menu-kicker mb-2">Member</p>
                <p className="text-lg font-semibold text-[color:var(--ink)]">{userName}</p>
                <p className="mt-1 text-xs text-[color:var(--ink-soft)] capitalize">
                  {isLoyaltyLoading ? "Syncing rewards" : `${loyaltyProfile.points} points | ${loyaltyProfile.tier}`}
                </p>
              </div>

              <div className="rounded-[22px] border border-[color:var(--border)] bg-white/72 px-4 py-4">
                <p className="menu-kicker mb-2">Session</p>
                <p className="text-lg font-semibold text-[color:var(--ink)]">Table {tableNumber}</p>
                <p className="mt-1 text-xs text-[color:var(--ink-soft)]">Ready for ordering</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
        
                   {/* Main Content with Vertical Categories */}
      <div className="hidden">
               {/* Left Sidebar - Vertical Categories */}
        <aside className="w-32 shrink-0">
          <div className="paper-panel sticky top-24 rounded-[24px] border-[color:var(--border)] p-3">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setActiveCategory("mains")}
                title="Mains"
                className={`w-full px-3 py-3 rounded-[18px] text-left transition-colors ${
                  activeCategory === "mains" 
                    ? "bg-[color:var(--ink)] text-[color:var(--paper)]" 
                    : "hover:bg-white text-[color:var(--ink)]"
                }`}
              >
                <span className="text-base mr-1.5">🍱</span>
                <span className="text-xs truncate">Mains</span>
              </button>
              <button
                onClick={() => setActiveCategory("appetizers")}
                title="Appetizers"
                className={`w-full px-3 py-3 rounded-[18px] text-left transition-colors ${
                  activeCategory === "appetizers" 
                    ? "bg-[color:var(--ink)] text-[color:var(--paper)]" 
                    : "hover:bg-white text-[color:var(--ink)]"
                }`}
              >
                <span className="text-base mr-1.5">🥟</span>
                <span className="text-xs truncate">Appetizers</span>
              </button>
              <button
                onClick={() => setActiveCategory("ramen")}
                title="Ramen"
                className={`w-full px-3 py-3 rounded-[18px] text-left transition-colors ${
                  activeCategory === "ramen" 
                    ? "bg-[color:var(--ink)] text-[color:var(--paper)]" 
                    : "hover:bg-white text-[color:var(--ink)]"
                }`}
              >
                <span className="text-base mr-1.5">🍜</span>
                <span className="text-xs truncate">Udon</span>
              </button>
              <button
                onClick={() => setActiveCategory("desserts")}
                title="Desserts"
                className={`w-full px-3 py-3 rounded-[18px] text-left transition-colors ${
                  activeCategory === "desserts" 
                    ? "bg-[color:var(--ink)] text-[color:var(--paper)]" 
                    : "hover:bg-white text-[color:var(--ink)]"
                }`}
              >
                <span className="text-base mr-1.5">🍦</span>
                <span className="text-xs truncate">Desserts</span>
              </button>
              <button
                onClick={() => setActiveCategory("drinks")}
                title="Drinks"
                className={`w-full px-3 py-3 rounded-[18px] text-left transition-colors ${
                  activeCategory === "drinks" 
                    ? "bg-[color:var(--ink)] text-[color:var(--paper)]" 
                    : "hover:bg-white text-[color:var(--ink)]"
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
              <h2 className="menu-title mb-6 text-4xl text-[color:var(--ink)]">Mains</h2>
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
              <h2 className="menu-title mb-6 text-4xl text-[color:var(--ink)]">Appetizers</h2>
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
              <h2 className="menu-title mb-6 text-4xl text-[color:var(--ink)]">Ramen</h2>
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
              <h2 className="menu-title mb-6 text-4xl text-[color:var(--ink)]">Desserts</h2>
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
              <h2 className="menu-title mb-6 text-4xl text-[color:var(--ink)]">Drinks</h2>
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

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="hidden">
            {/* Divider */}
            <div className="absolute -top-8 left-0 right-0 flex items-center justify-center">
              <div className="flex items-center gap-3">
                <div className="h-px w-20 bg-gradient-to-r from-transparent to-[color:var(--gold)]/40" />
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]/35" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]/55" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]/55" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--gold)]/35" />
                </div>
                <div className="h-px w-20 bg-gradient-to-l from-transparent to-[color:var(--gold)]/40" />
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-8 mt-8 flex-wrap">
              <div className="relative">
                {/* Animated glow */}
                <div className="absolute inset-0 h-14 w-14 rounded-full bg-[color:var(--gold)]/20 blur-xl animate-pulse" />
                
                <div className="relative rounded-2xl bg-[linear-gradient(135deg,var(--ink),rgba(40,52,90,0.76))] p-3 shadow-xl">
                  <Sparkles className="w-7 h-7 text-white relative z-10" strokeWidth={2} />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/30" />
                  
                  {/* Sparkle decorations */}
                  <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-[color:var(--gold)] opacity-70 animate-ping" strokeWidth={2} />
                </div>
                
                <CherryBlossom className="absolute -bottom-1 -right-1 opacity-90 drop-shadow-md" size={24} />
              </div>
              
              <div className="flex-1">
                <h2 className="menu-title mb-1 text-4xl text-[color:var(--ink)]">Recommendations</h2>
                <p className="text-sm tracking-wide text-[color:var(--ink-soft)]">
                  Thompson sampling, weather cues, flavor matching, order history, and pairing data.
                </p>
              </div>
              
              
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
