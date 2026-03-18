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
import { QrCode, UtensilsCrossed, Sparkles, CloudRain, Sun, Cloud, Info, Gift, Users, Star, Plus, Flame } from "lucide-react";
import { toast } from "sonner";
import { CherryBlossom } from "./JapanesePattern";
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
    description: "Refreshing black tea served over ice with fresh lemon slices.",
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
    case 'rainy': return <CloudRain className="w-4 h-4" />;
    case 'sunny': return <Sun className="w-4 h-4" />;
    case 'cloudy': return <Cloud className="w-4 h-4" />;
    default: return <Sun className="w-4 h-4" />;
  }
}

function getPerfectWeatherMessage(weather: WeatherData): string {
  if (weather.condition === "rainy" || weather.condition === "snowy") return "Perfect weather for hot ramen and warm udon";
  if (weather.condition === "sunny" && weather.temperature > 80) return "Perfect weather for sashimi, yuzu soda, and ice cream";
  if (weather.condition === "sunny") return "Perfect weather for sushi rolls and donburi";
  return "Perfect weather for cozy bowls and comfort dishes";
}

function getTierFromPoints(points: number): LoyaltyProfile["tier"] {
  if (points >= 1500) return "platinum";
  if (points >= 500) return "gold";
  return "silver";
}

function mergeMenuImages(items: MenuItemType[]): MenuItemType[] {
  const fallbackImageByName = new Map(BASE_MENU_ITEMS.map((item) => [item.name, item.image]));
  return items.map((item) => ({ ...item, image: item.image || fallbackImageByName.get(item.name) || "" }));
}

const CATEGORIES = [
  { key: "mains", label: "Mains", emoji: "🍱" },
  { key: "appetizers", label: "Appetizers", emoji: "🥟" },
  { key: "ramen", label: "Udon", emoji: "🍜" },
  { key: "desserts", label: "Desserts", emoji: "🍦" },
  { key: "drinks", label: "Drinks", emoji: "🍵" },
];

export function OrderingPage({
  tableNumber,
  userName,
  phoneNumber,
  flavorPreferences,
  onUpdateFlavorPreferences,
}: OrderingPageProps) {
  const fallbackCustomerProfile = useMemo(() => getFallbackCustomerProfile(phoneNumber), [phoneNumber]);
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

  useEffect(() => {
    const fetchWeather = async () => { const data = await getCurrentWeather(); setWeatherData(data); };
    fetchWeather();
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMenuItemPairings().then((p) => { if (!cancelled) setMenuItemPairings(p); }).catch(() => { if (!cancelled) setMenuItemPairings(null); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!phoneNumber || phoneNumber.trim().length < 6) { setOrderHistoryItemIds([]); return () => { cancelled = true; }; }
    fetchCustomerOrderHistory(phoneNumber).then((ids) => { if (!cancelled) setOrderHistoryItemIds(ids); }).catch(() => { if (!cancelled) setOrderHistoryItemIds([]); });
    return () => { cancelled = true; };
  }, [phoneNumber]);

  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        const items = await fetchMenuItems();
        if (items.length > 0) { setMenuItems(applyDynamicPricing(mergeMenuImages(items))); setActiveCategory(items[0]?.category ?? "mains"); }
      } catch { setMenuItems(applyDynamicPricing(BASE_MENU_ITEMS)); }
      finally { setIsMenuLoading(false); }
    };
    void loadMenuItems();
  }, []);

  useEffect(() => {
    const loadLoyaltyProfile = async () => {
      const profile = await fetchLoyaltyProfile(phoneNumber);
      if (profile) { setLoyaltyProfile(profile); }
      else { setLoyaltyProfile({ ...fallbackCustomerProfile.loyaltyProfile, name: userName || fallbackCustomerProfile.fullName }); }
      setIsLoyaltyLoading(false);
    };
    void loadLoyaltyProfile();
  }, [fallbackCustomerProfile, phoneNumber, userName]);

  const isInitialDataLoading = isMenuLoading || isLoyaltyLoading;

  const handleItemClick = (item: MenuItemType) => { setSelectedItem(item); setItemDialogOpen(true); };
  const handleAddFromDialog = (item: MenuItemType) => { handleAddToCart(item); setItemDialogOpen(false); setSelectedItem(null); };

  useEffect(() => {
    const newRecommendations = generateRecommendations(menuItems, { cartItems: cart, flavorPreferences, weather: weatherData || undefined, menuItemPairings: menuItemPairings || undefined, userHistory: orderHistoryItemIds }, 6);
    setRecommendations(newRecommendations);
  }, [cart, flavorPreferences, weatherData, menuItems, menuItemPairings, orderHistoryItemIds]);

  const handleAddToCart = (item: MenuItemType) => {
    recordSuccess(item.id);
    if (hasActiveFlashSale(item.id)) { recordFlashSaleOrder(item.id); toast.success(`🎉 Flash sale discount applied! ${item.name} added to cart`); }
    else { toast.success(`${item.name} added to cart`); }
    setCart((prev) => { const existing = prev.find((i) => i.id === item.id); if (existing) return prev.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i); return [...prev, { ...item, quantity: 1 }]; });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) { handleRemoveItem(id); return; }
    setCart((prev) => prev.map((item) => item.id === id ? { ...item, quantity } : item));
  };

  const handleRemoveItem = (id: string) => { setCart((prev) => prev.filter((item) => item.id !== id)); toast.info("Item removed from cart"); };
  const handleCheckout = () => setPaymentDialogOpen(true);

  const addLoyaltyPoints = (pointsToAdd: number, source: string, updatedLoyalty?: { pointsBalance: number; tier: LoyaltyProfile["tier"] }) => {
    if (pointsToAdd <= 0 && !updatedLoyalty) return;
    setLoyaltyProfile((current) => {
      if (updatedLoyalty) return { ...current, points: updatedLoyalty.pointsBalance, tier: updatedLoyalty.tier };
      const updatedPoints = current.points + pointsToAdd;
      return { ...current, points: updatedPoints, tier: getTierFromPoints(updatedPoints) };
    });
    toast.success(`+${pointsToAdd} points from ${source}`);
  };

  const handlePaymentComplete = async (paymentMethod: "card" | "mobile", selectedDiscountId: DiscountId | null) => {
    const subtotal = calculateCartSubtotal(cart);
    const pricing = calculatePricing(subtotal, loyaltyProfile, selectedDiscountId);
    let completionResult: { earnedPoints: number; pointsBalance: number } | undefined;
    setIsSubmittingOrder(true);
    try {
      const response = await createOrder({ customerName: userName, phoneNumber, tableCode: tableNumber, items: cart.map((item) => ({ menuItemId: item.id, quantity: item.quantity })), paymentMethod: paymentMethod === "card" ? "CARD" : "MOBILE", birthdayDiscountPercent: pricing.birthdayDiscountPercent, selectedDiscountId: pricing.selectedDiscountId });
      cart.forEach((item) => recordSuccess(item.id));
      if (phoneNumber && phoneNumber.trim().length >= 6) fetchCustomerOrderHistory(phoneNumber).then((ids) => setOrderHistoryItemIds(ids)).catch(() => setOrderHistoryItemIds([]));
      if (response.loyalty) {
        setLoyaltyProfile((current) => ({ ...current, points: response.loyalty!.pointsBalance, tier: response.loyalty!.tier }));
        toast.success(`Payment successful. You earned ${response.loyalty.earnedPoints} points.`);
        completionResult = { earnedPoints: response.loyalty.earnedPoints, pointsBalance: response.loyalty.pointsBalance };
      } else {
        const refreshedProfile = await fetchLoyaltyProfile(phoneNumber);
        if (refreshedProfile) { setLoyaltyProfile(refreshedProfile); completionResult = { earnedPoints: pricing.pointsEarned, pointsBalance: refreshedProfile.points }; }
        else { toast.success("Payment successful. Redirecting you to Games."); }
      }
      setHasPlacedOrder(true); setCurrentView("games"); setPaymentDialogOpen(false); setCart([]);
      return completionResult;
    } catch (error) { throw new Error(error instanceof Error ? error.message : "Unable to place your order right now."); }
    finally { setIsSubmittingOrder(false); }
  };

  const subtotal = calculateCartSubtotal(cart);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-cream)" }}>

      {/* ── HEADER ── */}
      <header style={{ background: "var(--navy)", borderBottom: "1px solid var(--navy-light)" }} className="sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Logo */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--gold)" }}>
                <UtensilsCrossed className="w-4 h-4" style={{ color: "var(--navy)" }} strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-bold leading-tight tracking-wide" style={{ color: "var(--cream)", fontFamily: "'Georgia', serif" }}>
                  Koryori Hayashi
                </h1>
                <p className="text-[10px]" style={{ color: "var(--gold-light)", letterSpacing: "0.15em" }}>小料理林</p>
              </div>
            </div>

            {/* Right — weather + table */}
            <div className="flex items-center gap-2 shrink-0">
              {weatherData && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "var(--navy-light)" }}>
                  <span style={{ color: "var(--gold)" }}>{getWeatherIcon(weatherData.condition)}</span>
                  <span className="text-xs font-semibold" style={{ color: "var(--cream)" }}>{weatherData.temperature}°F</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "var(--navy-light)" }}>
                <QrCode className="w-3.5 h-3.5" style={{ color: "var(--gold)" }} />
                <span className="text-xs" style={{ color: "var(--cream-muted)" }}>Table</span>
                <span className="text-sm font-bold" style={{ color: "var(--cream)" }}>{tableNumber}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── GAMES VIEW ── */}
      {currentView === "games" ? (
        <InAppGames
          currentPoints={loyaltyProfile.points}
          phoneNumber={phoneNumber}
          userName={userName}
          onEarnPoints={addLoyaltyPoints}
          onBackToOrdering={() => setCurrentView("ordering")}
        />
      ) : (
        <main className="container mx-auto px-4 sm:px-6 py-6">

          {isInitialDataLoading ? (
            /* ── SKELETON ── */
            <div className="space-y-5">
              <div className="rounded-2xl border p-5" style={{ background: "var(--card-bg)", borderColor: "var(--border)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-12 w-12 rounded-full" style={{ background: "var(--skeleton)" }} />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" style={{ background: "var(--skeleton)" }} />
                    <Skeleton className="h-3 w-24" style={{ background: "var(--skeleton)" }} />
                  </div>
                </div>
                <Skeleton className="h-16 w-full" style={{ background: "var(--skeleton)" }} />
              </div>
              <div className="rounded-2xl border p-5" style={{ background: "var(--card-bg)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--navy)" }}>Syncing your menu and rewards</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>Pulling the latest data for this session.</p>
                  </div>
                  <div className="h-6 w-6 animate-spin rounded-full border-2" style={{ borderColor: "var(--gold-light)", borderTopColor: "var(--gold)" }} />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="rounded-2xl border p-4" style={{ borderColor: "var(--border)" }}>
                      <Skeleton className="mb-4 h-44 w-full rounded-xl" style={{ background: "var(--skeleton)" }} />
                      <Skeleton className="mb-2 h-4 w-2/3" style={{ background: "var(--skeleton)" }} />
                      <Skeleton className="mb-4 h-3 w-full" style={{ background: "var(--skeleton)" }} />
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-16" style={{ background: "var(--skeleton)" }} />
                        <Skeleton className="h-9 w-28 rounded-lg" style={{ background: "var(--skeleton)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ── LOYALTY CARD ── */}
              <div className="mb-4">
                <LoyaltyCard profile={loyaltyProfile} />
              </div>

              {/* ── ACTION BADGES ROW (flows naturally, no overlap) ── */}
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <button
                  onClick={() => setLoyaltyInfoOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                  style={{ background: "var(--card-bg)", border: "1px solid var(--border)", color: "var(--navy)" }}
                >
                  <span>👋</span>
                  <span className="font-semibold">{userName}</span>
                  <span style={{ color: "var(--text-muted)" }}>•</span>
                  <span style={{ color: "var(--gold)" }}>⭐</span>
                  <span className="font-semibold">{isLoyaltyLoading ? "…" : loyaltyProfile.points}</span>
                  <span className="capitalize" style={{ color: "var(--text-muted)", fontSize: "10px" }}>
                    ({isLoyaltyLoading ? "loading" : loyaltyProfile.tier})
                  </span>
                </button>

                {hasPlacedOrder && (
                  <button
                    onClick={() => setCurrentView("games")}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-white transition-colors"
                    style={{ background: "var(--navy)" }}
                  >
                    Play Games
                  </button>
                )}

                {flavorPreferences && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50">
                    <Sparkles className="w-3 h-3" /> Personalized
                  </div>
                )}

                <button
                  onClick={onUpdateFlavorPreferences}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                  style={{ background: "var(--gold-bg)", color: "var(--navy)" }}
                >
                  <Info className="h-3 w-3" style={{ color: "var(--gold-dark)" }} />
                  Update Taste Profile
                </button>

                {loyaltyProfile.isBirthday && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-pink-700 bg-pink-50">
                    🎂 Birthday Bonus Active
                  </div>
                )}
              </div>

              {/* ── WEATHER BANNER ── */}
              {weatherData && (
                <div className="mb-5 rounded-xl p-4 flex items-center gap-3" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0" style={{ background: "var(--gold-bg)" }}>
                    <span style={{ color: "var(--gold-dark)" }}>{getWeatherIcon(weatherData.condition)}</span>
                    <span className="text-xs font-semibold" style={{ color: "var(--navy)" }}>{weatherData.temperature}°F</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}>
                      {getPerfectWeatherMessage(weatherData)}
                    </h3>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{weatherData.description}</p>
                  </div>
                </div>
              )}

              {/* ── CATEGORY FILTER CHIPS — mobile horizontal scroll ── */}
              <div className="lg:hidden mb-5">
                {/* Header row: filter label + scroll hint */}
                <div className="flex items-center gap-2 mb-2.5 px-1">
                  <div className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 2.5h10M3 6h6M5 9.5h2" stroke="var(--gold-dark)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--text-muted)" }}>
                      Filter
                    </span>
                  </div>
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  <span className="text-[10px]" style={{ color: "var(--cream-muted)" }}>scroll ›</span>
                </div>

                {/* Scroll container */}
                <div className="relative">
                  {/* Right fade hint */}
                  <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 z-10"
                    style={{ background: "linear-gradient(to right, transparent, var(--bg-cream))" }} />

                  <div className="cat-scroll overflow-x-auto pb-2.5 -mx-4 px-4">
                    <div className="flex gap-2" style={{ width: "max-content" }}>
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.key}
                          onClick={() => setActiveCategory(cat.key)}
                          className="filter-chip flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all"
                          style={
                            activeCategory === cat.key
                              ? {
                                  background: "var(--navy)",
                                  color: "var(--cream)",
                                  border: "1.5px solid var(--navy)",
                                  borderRadius: "999px",
                                  padding: "0.3rem 0.85rem",
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  fontFamily: "'Georgia', serif",
                                }
                              : {
                                  background: "var(--card-bg)",
                                  color: "var(--text-muted)",
                                  border: "1.5px solid var(--border)",
                                  borderRadius: "999px",
                                  padding: "0.3rem 0.85rem",
                                  fontSize: "0.8rem",
                                  fontWeight: 400,
                                  fontFamily: "'Georgia', serif",
                                }
                          }
                        >
                          <span className="text-sm leading-none">{cat.emoji}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop: vertical sidebar + content */}
              <div className="flex gap-6">
                {/* Sidebar — desktop only */}
                <aside className="hidden lg:block w-28 shrink-0">
                  <div className="sticky top-20 rounded-xl p-2" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                    <div className="flex flex-col gap-1">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.key}
                          onClick={() => setActiveCategory(cat.key)}
                          className="w-full flex items-center gap-1.5 px-2.5 py-2.5 rounded-lg text-left transition-all"
                          style={
                            activeCategory === cat.key
                              ? { background: "var(--navy)", color: "var(--cream)" }
                              : { color: "var(--navy)" }
                          }
                        >
                          <span className="text-base">{cat.emoji}</span>
                          <span className="text-xs truncate font-medium">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </aside>

                {/* ── MENU ITEMS ── */}
                <section className="flex-1 min-w-0 menu-card-grid">
                  {CATEGORIES.map((cat) =>
                    activeCategory === cat.key ? (
                      <div key={cat.key}>
                        <h2 className="text-2xl sm:text-3xl font-bold mb-5" style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}>
                          {cat.label}
                        </h2>
                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5 items-stretch">
                          {menuItems
                            .filter((item) => item.category === cat.key)
                            .map((item) => (
                              <div
                                key={item.id}
                                className="mi-wrap w-full h-full cursor-pointer transition-transform hover:scale-[1.02]"
                                onClick={() => handleItemClick(item)}
                              >
                                <MenuItem item={item} onAddToCart={handleAddToCart} />
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : null
                  )}
                </section>
              </div>

              {/* ── RECOMMENDATIONS ── */}
              {recommendations.length > 0 && (
                <div className="mt-16 relative">
                  <div className="absolute -top-8 left-0 right-0 flex items-center justify-center">
                    <div className="flex items-center gap-3">
                      <div className="h-px w-20" style={{ background: "linear-gradient(to right, transparent, var(--gold-light))" }} />
                      {[0.4, 0.6, 1, 0.6, 0.4].map((o, i) => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: `rgba(200, 168, 75, ${o})` }} />
                      ))}
                      <div className="h-px w-20" style={{ background: "linear-gradient(to left, transparent, var(--gold-light))" }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-7 mt-8 flex-wrap">
                    <div className="relative">
                      <div className="absolute inset-0 w-14 h-14 rounded-full blur-xl animate-pulse" style={{ background: "var(--gold-bg)" }} />
                      <div className="relative rounded-2xl p-3 shadow-xl" style={{ background: "linear-gradient(135deg, var(--navy), var(--navy-light))" }}>
                        <Sparkles className="w-7 h-7 relative z-10" style={{ color: "var(--gold)" }} strokeWidth={2} />
                      </div>
                      <CherryBlossom className="absolute -bottom-1 -right-1 opacity-90 drop-shadow-md" size={24} />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl sm:text-4xl font-bold mb-1" style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}>
                        Recommendations おすすめ
                      </h2>
                      <p className="text-xs" style={{ color: "var(--text-muted)", letterSpacing: "0.05em" }}>
                        Multi-Armed Bandit · Thompson Sampling · Weather-Aware · Flavor-Matched
                      </p>
                    </div>
                  </div>

                  <div className="rec-card-grid grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
      )}

      {/* ── SHOPPING CART ── */}
      {!isInitialDataLoading && (
        <ShoppingCart
          items={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleCheckout}
          loyaltyProfile={loyaltyProfile}
        />
      )}

      {/* ── PAYMENT DIALOG ── */}
      <PaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        onPaymentComplete={handlePaymentComplete}
        subtotal={subtotal}
        loyaltyProfile={loyaltyProfile}
        isSubmittingOrder={isSubmittingOrder}
      />

      {/* ── ITEM DETAIL DIALOG ── */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--card-bg)" }}>
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-xl" style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--navy)" }}>
                    <UtensilsCrossed className="w-5 h-5" style={{ color: "var(--gold)" }} />
                  </div>
                  {selectedItem.name}
                </DialogTitle>
                <DialogDescription style={{ color: "var(--text-muted)" }}>{selectedItem.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
                  <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {selectedItem.isNew && (
                      <Badge className="bg-purple-600 text-white px-3 py-1"><Sparkles className="w-3 h-3 mr-1" />NEW</Badge>
                    )}
                    {selectedItem.spicy && (
                      <Badge className="bg-red-500 text-white px-2 py-1">
                        {Array.from({ length: selectedItem.spicy }).map((_, i) => <span key={i}>🌶️</span>)}
                      </Badge>
                    )}
                  </div>
                  {selectedItem.isHighMargin && !selectedItem.isNew && (
                    <Badge className="absolute top-3 right-3 px-3 py-1" style={{ background: "var(--gold)", color: "var(--navy)" }}>
                      <Sparkles className="w-3 h-3 mr-1" />Chef's Pick
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-4" style={{ background: "var(--gold-bg)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Price</p>
                    <p className="text-2xl font-bold" style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}>${selectedItem.price.toFixed(2)}</p>
                    {selectedItem.originalPrice && (
                      <p className="text-xs line-through" style={{ color: "var(--text-muted)" }}>${selectedItem.originalPrice.toFixed(2)}</p>
                    )}
                  </div>
                  <div className="rounded-xl p-4" style={{ background: "var(--gold-bg)" }}>
                    <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>Category</p>
                    <p className="text-lg font-semibold capitalize" style={{ color: "var(--navy)" }}>{selectedItem.category}</p>
                  </div>
                </div>

                {selectedItem.flavorProfile && (
                  <div className="rounded-xl p-4" style={{ background: "var(--gold-bg)" }}>
                    <h3 className="font-semibold mb-3" style={{ color: "var(--navy)" }}>Flavor Profile</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {(["umami", "citrus", "refreshing", "hearty"] as const).map((key) =>
                        selectedItem.flavorProfile?.[key] !== undefined ? (
                          <div key={key}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="capitalize" style={{ color: "var(--text-muted)" }}>{key}</span>
                              <span className="font-medium" style={{ color: "var(--navy)" }}>{((selectedItem.flavorProfile[key] ?? 0) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                              <div className="h-full rounded-full" style={{ width: `${(selectedItem.flavorProfile[key] ?? 0) * 100}%`, background: "var(--gold)" }} />
                            </div>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                )}

                {selectedItem.weatherTags && selectedItem.weatherTags.length > 0 && (
                  <div className="rounded-xl p-4 bg-blue-50">
                    <h3 className="font-semibold mb-2" style={{ color: "var(--navy)" }}>Perfect for</h3>
                    <div className="flex gap-2 flex-wrap">
                      {selectedItem.weatherTags.map((tag) => (
                        <Badge key={tag} variant="outline" className="bg-white capitalize">
                          {tag === 'sunny' && '☀️ '}{tag === 'rainy' && '🌧️ '}{tag === 'cold' && '❄️ '}{tag === 'hot' && '🔥 '}{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.flashSaleRemaining && selectedItem.flashSaleRemaining > 0 && (
                  <div className="rounded-xl p-4 text-white bg-gradient-to-r from-orange-500 to-red-500">
                    <div className="flex items-center gap-2 mb-1"><Flame className="w-5 h-5" /><h3 className="font-bold">Flash Sale!</h3></div>
                    <p className="text-sm">{selectedItem.discountPercentage}% OFF · Only {selectedItem.flashSaleRemaining} left!</p>
                    {selectedItem.surplusIngredient && <p className="text-xs text-white/80 mt-1">♻️ Made with fresh {selectedItem.surplusIngredient}</p>}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setItemDialogOpen(false)} className="flex-1">Close</Button>
                  <Button
                    onClick={() => handleAddFromDialog(selectedItem)}
                    className="flex-1 text-white"
                    style={
                      selectedItem.flashSaleRemaining && selectedItem.flashSaleRemaining > 0
                        ? { background: "linear-gradient(to right, #f97316, #ef4444)" }
                        : { background: "var(--navy)" }
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add to Cart
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── LOYALTY INFO DIALOG ── */}
      <Dialog open={loyaltyInfoOpen} onOpenChange={setLoyaltyInfoOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" style={{ background: "var(--card-bg)" }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl" style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--navy)" }}>
                <Star className="w-5 h-5" style={{ color: "var(--gold)" }} />
              </div>
              Loyalty Program
            </DialogTitle>
            <DialogDescription style={{ color: "var(--text-muted)" }}>
              Earn points, unlock rewards, and enjoy exclusive benefits
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-xl p-5 text-white" style={{ background: "linear-gradient(135deg, var(--navy), var(--navy-light))" }}>
              <h3 className="text-base font-bold mb-3" style={{ fontFamily: "'Georgia', serif" }}>How It Works</h3>
              {[
                { n: "1", title: "Order & Earn", desc: "Earn points automatically with every purchase" },
                { n: "2", title: "Level Up", desc: "Reach Silver, Gold, and Platinum tiers" },
                { n: "3", title: "Redeem Rewards", desc: "Use points for discounts and exclusive items" },
              ].map((s) => (
                <div key={s.n} className="flex items-start gap-3 mb-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-sm font-bold" style={{ background: "var(--gold)", color: "var(--navy)" }}>{s.n}</div>
                  <div><p className="font-semibold text-sm">{s.title}</p><p className="text-xs text-white/75">{s.desc}</p></div>
                </div>
              ))}
              <Button onClick={onUpdateFlavorPreferences} variant="outline" className="mt-2 border-white/30 bg-white/10 text-white hover:bg-white/20 text-sm">
                Update My Taste Profile
              </Button>
            </div>

            <div>
              <h3 className="text-base font-bold mb-3" style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}>Membership Tiers</h3>
              <div className="space-y-3">
                {[
                  { tier: "silver", emoji: "🌸", label: "Silver", sub: "Starting tier", benefits: ["Earn 1 point per $1 spent", "5% birthday discount", "Early access to seasonal menu"] },
                  { tier: "gold", emoji: "⭐", label: "Gold", sub: "500+ points", benefits: ["Earn 1.5 points per $1 spent", "10% birthday discount", "Free appetizer on birthday", "Priority seating"] },
                  { tier: "platinum", emoji: "💎", label: "Platinum", sub: "1500+ points", benefits: ["Earn 2 points per $1 spent", "15% birthday discount", "Free meal on birthday", "Exclusive VIP events", "Personal chef recommendations"] },
                ].map((t) => (
                  <div key={t.tier} className="border-2 rounded-xl p-4" style={loyaltyProfile.tier === t.tier ? { borderColor: "var(--gold)", background: "var(--gold-bg)" } : { borderColor: "var(--border)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{t.emoji}</span>
                        <div><h4 className="font-bold text-sm" style={{ color: "var(--navy)" }}>{t.label}</h4><p className="text-xs" style={{ color: "var(--text-muted)" }}>{t.sub}</p></div>
                      </div>
                      {loyaltyProfile.tier === t.tier && <Badge style={{ background: "var(--gold)", color: "var(--navy)" }}>Current</Badge>}
                    </div>
                    <ul className="space-y-1">
                      {t.benefits.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-xs"><span className="text-emerald-600">✓</span><span style={{ color: "var(--text-muted)" }}>{b}</span></li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-5" style={{ background: "var(--gold-bg)", border: "1px solid var(--border)" }}>
              <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}>
                <Gift className="w-4 h-4" style={{ color: "var(--gold-dark)" }} /> Redeem Your Points
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[["$5 Off", "100 pts"], ["$10 Off", "200 pts"], ["$15 Off", "300 pts"], ["Free Appetizer", "250 pts"]].map(([label, pts]) => (
                  <div key={label} className="rounded-lg p-3" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
                    <p className="font-semibold text-sm" style={{ color: "var(--navy)" }}>{label}</p>
                    <Badge variant="outline" className="text-xs mt-1" style={{ borderColor: "var(--gold)", color: "var(--gold-dark)" }}>{pts}</Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>Redeem points at checkout when placing your order</p>
            </div>

            <div className="rounded-xl p-5 border-2 bg-blue-50 border-blue-200">
              <h3 className="text-base font-bold mb-2 flex items-center gap-2" style={{ color: "var(--navy)", fontFamily: "'Georgia', serif" }}>
                <Users className="w-4 h-4 text-blue-600" /> Refer a Friend
              </h3>
              <p className="text-xs text-blue-700/70 mb-3">Share your referral code and both of you get 100 bonus points!</p>
              <div className="rounded-lg p-3 bg-white border-2 border-dashed border-blue-300">
                <p className="text-xs text-blue-400 mb-1">Your Referral Code</p>
                <p className="text-lg font-bold text-blue-600 tracking-widest">{loyaltyProfile.referralCode}</p>
              </div>
            </div>

            <Button onClick={() => setLoyaltyInfoOpen(false)} className="w-full text-white" style={{ background: "var(--navy)" }}>Got it!</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── CSS ── */}
      <style>{`
        :root {
          --navy:        #1a2240;
          --navy-light:  #2a3560;
          --cream:       #f5f0e8;
          --cream-muted: #cdc6b8;
          --bg-cream:    #ede8dc;
          --card-bg:     #faf7f2;
          --border:      #ddd6c8;
          --gold:        #c8a84b;
          --gold-light:  #e0c97a;
          --gold-dark:   #a8862e;
          --gold-bg:     #f5edd8;
          --text-muted:  #7a7060;
          --skeleton:    #e5dfd4;
        }

        /* ══════════════════════════════════
           CATEGORY FILTER CHIP STRIP
        ══════════════════════════════════ */
        .filter-chip {
          -webkit-tap-highlight-color: transparent;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
          letter-spacing: 0.01em;
        }
        .filter-chip:hover {
          border-color: var(--navy) !important;
          color: var(--navy) !important;
        }

        /* Keep old cat-tab in case desktop sidebar references it */
        .cat-tab {
          font-size: 0.8125rem;
          font-family: 'Georgia', serif;
          padding: 0.45rem 1rem 0.55rem;
          background: transparent;
          border: none;
          outline: none;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: color 0.15s, border-color 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .cat-tab:hover { color: var(--navy) !important; }

        /* ══════════════════════════════════
           AESTHETIC SCROLLBAR — always visible
        ══════════════════════════════════ */
        .cat-scroll {
          scrollbar-width: thin;
          scrollbar-color: var(--gold) var(--gold-bg);
        }
        .cat-scroll::-webkit-scrollbar { height: 5px; }
        .cat-scroll::-webkit-scrollbar-track {
          background: var(--gold-bg);
          border-radius: 99px;
          margin: 0 16px;
        }
        .cat-scroll::-webkit-scrollbar-thumb {
          background: var(--gold);
          border-radius: 99px;
          min-width: 24px;
        }

        /* ══════════════════════════════════
           EQUAL HEIGHT CARDS
        ══════════════════════════════════ */
        .mi-wrap {
          display: flex !important;
          flex-direction: column !important;
        }
        .mi-wrap > * {
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
        }
        /* Push the button to the bottom */
        .mi-wrap > * > div:not(:first-child) {
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: space-between !important;
        }



        /* The card root: no gap between image and body */
        .mi-wrap > *,
        .mi-wrap > * > * {
          gap: 0 !important;
        }

        /* Every direct child div of the card: kill all vertical margin */
        .mi-wrap > * > div {
          margin-top: 0 !important;
          margin-bottom: 0 !important;
        }

        /* The image wrapper — flush bottom */
        .mi-wrap > * > div:first-child {
          padding-bottom: 0 !important;
          margin-bottom: 0 !important;
          line-height: 0;
        }

        /* The image itself */
        .mi-wrap img {
          display: block;
          margin: 0 !important;
          padding: 0 !important;
          vertical-align: bottom;
        }

        /* The content body — consistent padding, flush top */
        .mi-wrap > * > div:not(:first-child) {
          padding-top: 10px !important;
          padding-bottom: 14px !important;
          padding-left: 12px !important;
          padding-right: 12px !important;
          margin-top: 0 !important;
        }

        /* Also flatten via class-name selectors as backup */
        .mi-wrap [class*="relative"]:has(img) {
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
          line-height: 0;
        }
        .mi-wrap [class*="p-4"],
        .mi-wrap [class*="p-3"] {
          padding-top: 10px !important;
          padding-left: 12px !important;
          padding-right: 12px !important;
          padding-bottom: 14px !important;
        }

        /* ══════════════════════════════════
           ADD TO CART BUTTON — DARK NAVY
        ══════════════════════════════════ */
        .menu-card-grid button {
          background: var(--navy) !important;
          color: var(--cream) !important;
        }
        .menu-card-grid button:hover {
          background: var(--navy-light) !important;
        }

        /* ══════════════════════════════════
           CHEF'S PICK BADGE — SMALLER ON MOBILE
        ══════════════════════════════════ */
        .mi-wrap [class*="badge"],
        .mi-wrap [class*="Badge"],
        .mi-wrap span[class*="absolute"],
        .mi-wrap div[class*="absolute"] span,
        .mi-wrap div[class*="absolute"] {
          font-size: 0.65rem !important;
          padding: 0.2rem 0.5rem !important;
          gap: 0.2rem !important;
        }
        .mi-wrap div[class*="absolute"] svg,
        .mi-wrap span[class*="absolute"] svg {
          width: 0.6rem !important;
          height: 0.6rem !important;
        }
        @media (min-width: 640px) {
          .mi-wrap [class*="badge"],
          .mi-wrap [class*="Badge"],
          .mi-wrap div[class*="absolute"] {
            font-size: 0.75rem !important;
            padding: 0.25rem 0.65rem !important;
          }
        }

        /* ══════════════════════════════════
           FLOATING CART FAB — DARK NAVY
        ══════════════════════════════════ */
        .fixed.bottom-6 button,
        .fixed.bottom-4 button,
        .fixed.bottom-6 > button,
        .fixed.bottom-4 > button,
        [class*="fixed"][class*="bottom"] button,
        [class*="fixed"][class*="bottom"] > button,
        [class*="fixed"][class*="bottom"] > div > button,
        [class*="fixed"][class*="bottom"] [class*="rounded-full"] {
          background: var(--navy) !important;
          background-color: var(--navy) !important;
          color: var(--cream) !important;
        }
        .fixed.bottom-6 button:hover,
        .fixed.bottom-4 button:hover,
        [class*="fixed"][class*="bottom"] button:hover {
          background: var(--navy-light) !important;
          background-color: var(--navy-light) !important;
        }

        /* ══════════════════════════════════
           RECOMMENDATION CARD BUTTONS — DARK NAVY
        ══════════════════════════════════ */
        .rec-card-grid button,
        .rec-card-grid [role="button"] {
          background: var(--navy) !important;
          color: var(--cream) !important;
        }
        .rec-card-grid button:hover {
          background: var(--navy-light) !important;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
