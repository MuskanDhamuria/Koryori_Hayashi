import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { MenuItem, MenuItemData } from "./MenuItem";
import { RecommendationCard } from "./RecommendationCard";
import { ShoppingCart } from "./ShoppingCart";
import { PaymentDialog } from "./PaymentDialog";
import { LoyaltyCard, LoyaltyProfile, LoyaltyTier } from "./LoyaltyCard";
import { QrCode, UtensilsCrossed, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SeigaihaPattern, CherryBlossom } from "./JapanesePattern";

interface CartItem extends MenuItemData {
  quantity: number;
}

interface OrderingPageProps {
  tableNumber: string;
  userName: string;
  phoneNumber: string;
}

const MENU_ITEMS: MenuItemData[] = [
  {
    id: "1",
    name: "Deluxe Sushi Platter",
    description: "Assorted nigiri and maki rolls with fresh wasabi and ginger",
    price: 32.99,
    category: "sushi",
    image: "https://images.unsplash.com/photo-1625937751876-4515cd8e78bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXNoaSUyMHBsYXR0ZXJ8ZW58MXx8fHwxNzcyNjUxODA3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    isHighMargin: true,
  },
  {
    id: "2",
    name: "California Roll",
    description: "Crab, avocado, cucumber wrapped in rice and nori",
    price: 12.99,
    category: "sushi",
    image: "https://images.unsplash.com/photo-1559410545-0bdcd187e0a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWxpZm9ybmlhJTIwcm9sbCUyMHN1c2hpfGVufDF8fHx8MTc3MjU3MTE0OXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "3",
    name: "Salmon Sashimi",
    description: "Fresh Norwegian salmon sliced to perfection",
    price: 18.99,
    category: "sushi",
    image: "https://images.unsplash.com/photo-1675870792392-116a80bd7ad6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWxtb24lMjBzYXNoaW1pfGVufDF8fHx8MTc3MjY4NDgwNXww&ixlib=rb-4.1.0&q=80&w=1080",
    isHighMargin: true,
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
  },
  {
    id: "5",
    name: "Spicy Miso Ramen",
    description: "Fermented soybean broth with ground pork and vegetables",
    price: 15.99,
    category: "ramen",
    image: "https://images.unsplash.com/photo-1635379511574-bc167ca085c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYW1lbiUyMGJvd2wlMjBqYXBhbmVzZXxlbnwxfHx8fDE3NzI2ODQ4MDN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    spicy: 3,
  },
  {
    id: "6",
    name: "Udon Noodle Soup",
    description: "Thick wheat noodles in dashi broth with tempura",
    price: 14.99,
    category: "ramen",
    image: "https://images.unsplash.com/photo-1610554666975-339e1f736bc8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1ZG9uJTIwbm9vZGxlcyUyMGJvd2x8ZW58MXx8fHwxNzcyNjg0ODA3fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "7",
    name: "Gyoza",
    description: "Pan-fried pork and vegetable dumplings (6 pieces)",
    price: 8.99,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1703080173985-936514c7c8bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW96YSUyMGR1bXBsaW5nc3xlbnwxfHx8fDE3NzI2NDc3NzV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "8",
    name: "Edamame",
    description: "Steamed young soybeans with sea salt",
    price: 5.99,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1575262599410-837a72005862?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZGFtYW1lJTIwYmVhbnN8ZW58MXx8fHwxNzcyNjQ3Nzc1fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "9",
    name: "Shrimp Tempura",
    description: "Lightly battered and fried shrimp with dipping sauce",
    price: 11.99,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1673238104258-38b63f973848?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZW1wdXJhJTIwc2hyaW1wfGVufDF8fHx8MTc3MjY4NDgwM3ww&ixlib=rb-4.1.0&q=80&w=1080",
    isHighMargin: true,
  },
  {
    id: "10",
    name: "Miso Soup",
    description: "Traditional soybean soup with tofu and seaweed",
    price: 3.99,
    category: "appetizers",
    image: "https://images.unsplash.com/photo-1680137248903-7af5d51a3350?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaXNvJTIwc291cHxlbnwxfHx8fDE3NzI2MTcwMjN8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "11",
    name: "Teriyaki Chicken",
    description: "Grilled chicken with homemade teriyaki sauce and rice",
    price: 13.99,
    category: "mains",
    image: "https://images.unsplash.com/photo-1609183480237-ccbb2d7c5772?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZXJpeWFraSUyMGNoaWNrZW58ZW58MXx8fHwxNzcyNjg0ODA1fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "12",
    name: "Green Tea",
    description: "Premium Japanese sencha green tea",
    price: 3.99,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1708572727896-117b5ea25a86?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmVlbiUyMHRlYSUyMG1hdGNoYXxlbnwxfHx8fDE3NzI2ODQ4MDV8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "13",
    name: "Sake",
    description: "Premium Japanese rice wine, served warm or cold",
    price: 9.99,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1703756292847-833e3cb741eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYWtlJTIwamFwYW5lc2UlMjBkcmlua3xlbnwxfHx8fDE3NzI2MzE2NTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

const RECOMMENDATION_RULES = {
  pairings: {
    "1": ["12", "13"],
    "2": ["12", "10"],
    "3": ["13", "10"],
    "4": ["7", "8"],
    "5": ["7", "8"],
    "6": ["9", "7"],
    "11": ["10", "12"],
  },
  highMargin: ["1", "3", "4", "9"],
};

function generateRecommendations(cartItems: CartItem[], allItems: MenuItemData[]): Array<{ item: MenuItemData; reason: string }> {
  const cartItemIds = cartItems.map(item => item.id);
  const recommendations: Array<{ item: MenuItemData; reason: string }> = [];
  
  cartItems.forEach(cartItem => {
    const pairings = RECOMMENDATION_RULES.pairings[cartItem.id as keyof typeof RECOMMENDATION_RULES.pairings];
    if (pairings) {
      pairings.forEach(pairedId => {
        if (!cartItemIds.includes(pairedId)) {
          const item = allItems.find(i => i.id === pairedId);
          if (item && !recommendations.find(r => r.item.id === item.id)) {
            recommendations.push({
              item,
              reason: `Pairs perfectly with ${cartItem.name}`,
            });
          }
        }
      });
    }
  });
  
  if (cartItems.length > 0 && recommendations.length < 3) {
    RECOMMENDATION_RULES.highMargin.forEach(itemId => {
      if (!cartItemIds.includes(itemId)) {
        const item = allItems.find(i => i.id === itemId);
        if (item && !recommendations.find(r => r.item.id === item.id)) {
          recommendations.push({
            item,
            reason: "Chef's special recommendation for you",
          });
        }
      }
    });
  }
  
  return recommendations.slice(0, 3);
}

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

export function OrderingPage({ tableNumber, userName, phoneNumber }: OrderingPageProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<Array<{ item: MenuItemData; reason: string }>>([]);
  const [loyaltyProfile] = useState<LoyaltyProfile>(getUserProfile(phoneNumber));

  useEffect(() => {
    const newRecommendations = generateRecommendations(cart, MENU_ITEMS);
    setRecommendations(newRecommendations);
  }, [cart]);

  const handleAddToCart = (item: MenuItemData) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id);
      if (existingItem) {
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added to cart`);
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
    <div className="min-h-screen bg-[#E8DCC8] relative">
      {/* Subtle sage green glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#7C8A7A]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-20 w-80 h-80 bg-[#9BA89A]/10 rounded-full blur-3xl" />
      </div>

      {/* Floating Cherry Blossoms */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <CherryBlossom className="absolute top-20 left-10 animate-float opacity-15" size={40} />
        <CherryBlossom className="absolute top-60 right-20 animate-float-delayed opacity-12" size={30} />
        <CherryBlossom className="absolute bottom-40 left-1/4 animate-float opacity-13" size={35} />
        <CherryBlossom className="absolute top-1/2 right-1/4 animate-float-delayed opacity-10" size={25} />
      </div>
      
      {/* Header */}
      <header className="relative bg-gradient-to-r from-[#7C8A7A] via-[#8A9889] to-[#7C8A7A] shadow-lg border-b border-[#6B7969]">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
        <div className="container mx-auto px-4 py-8 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-full p-3 shadow-lg relative">
                <UtensilsCrossed className="w-10 h-10 text-[#7C8A7A]" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />
                <CherryBlossom className="absolute -top-1 -right-1 opacity-80" size={24} />
              </div>
              <div>
                <h1 className="text-5xl font-bold text-white mb-1" style={{ fontFamily: 'serif' }}>
                  Koryori Hayashi
                </h1>
                <div className="flex items-center gap-2">
                  <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/50" />
                  <p className="text-white/90 text-sm tracking-widest">Authentic Japanese Cuisine</p>
                  <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/50" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-5 py-3 rounded-xl shadow-lg border border-white/50">
                <QrCode className="w-5 h-5 text-[#7C8A7A]" />
                <div>
                  <p className="text-xs text-[#6B7669]">Table</p>
                  <p className="font-bold text-[#4A5548]">{tableNumber}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Loyalty Card */}
          <div className="max-w-md">
            <LoyaltyCard profile={loyaltyProfile} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-4 py-8">
        <Tabs defaultValue="sushi" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-[#F5F0E8]/80 backdrop-blur-sm shadow-lg border border-[#7C8A7A]/20 p-1.5 rounded-xl">
            <TabsTrigger 
              value="sushi"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C8A7A] data-[state=active]:to-[#9BA89A] data-[state=active]:text-white data-[state=active]:font-semibold rounded-lg transition-all text-[#6B7669]"
            >
              🍱 Sushi
            </TabsTrigger>
            <TabsTrigger 
              value="ramen"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C8A7A] data-[state=active]:to-[#9BA89A] data-[state=active]:text-white data-[state=active]:font-semibold rounded-lg transition-all text-[#6B7669]"
            >
              🍜 Ramen
            </TabsTrigger>
            <TabsTrigger 
              value="appetizers"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C8A7A] data-[state=active]:to-[#9BA89A] data-[state=active]:text-white data-[state=active]:font-semibold rounded-lg transition-all text-[#6B7669]"
            >
              🥟 Appetizers
            </TabsTrigger>
            <TabsTrigger 
              value="drinks"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#7C8A7A] data-[state=active]:to-[#9BA89A] data-[state=active]:text-white data-[state=active]:font-semibold rounded-lg transition-all text-[#6B7669]"
            >
              🍵 Drinks
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sushi" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MENU_ITEMS.filter((item) => item.category === "sushi").map((item) => (
                <MenuItem key={item.id} item={item} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ramen" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MENU_ITEMS.filter((item) => item.category === "ramen").map((item) => (
                <MenuItem key={item.id} item={item} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="appetizers" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MENU_ITEMS.filter((item) => item.category === "appetizers" || item.category === "mains").map((item) => (
                <MenuItem key={item.id} item={item} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="drinks" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MENU_ITEMS.filter((item) => item.category === "drinks").map((item) => (
                <MenuItem key={item.id} item={item} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-12 relative">
            <div className="absolute -top-4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#7C8A7A]/30 to-transparent" />
            
            <div className="flex items-center gap-3 mb-6 mt-8">
              <div className="bg-gradient-to-br from-[#7C8A7A] to-[#9BA89A] rounded-full p-2.5 shadow-lg relative">
                <Sparkles className="w-6 h-6 text-white" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />
                <CherryBlossom className="absolute -top-1 -right-1 opacity-80" size={20} />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-[#4A5548]" style={{ fontFamily: 'serif' }}>おすすめ</h2>
                <p className="text-sm text-[#6B7669]">Recommended For You</p>
              </div>
              <Badge variant="secondary" className="bg-gradient-to-r from-[#7C8A7A]/20 to-[#9BA89A]/20 text-[#4A5548] border border-[#7C8A7A]/30 ml-auto backdrop-blur-sm font-medium">
                ✨ AI Powered
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
      />

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
