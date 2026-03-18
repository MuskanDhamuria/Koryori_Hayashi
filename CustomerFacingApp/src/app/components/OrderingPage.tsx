import { useEffect, useState } from "react";
import { toast } from "sonner";
import { InAppGames } from "./InAppGames";
import type { LoyaltyProfile } from "./LoyaltyCard";
import { PaymentDialog } from "./PaymentDialog";
import { ShoppingCart } from "./ShoppingCart";
import { OrderingCatalog } from "./ordering/OrderingCatalog";
import { OrderingHeader } from "./ordering/OrderingHeader";
import { OrderingItemDialog } from "./ordering/OrderingItemDialog";
import { OrderingLoadingState } from "./ordering/OrderingLoadingState";
import { OrderingLoyaltyInfoDialog } from "./ordering/OrderingLoyaltyInfoDialog";
import { OrderingStyles } from "./ordering/OrderingStyles";
import {
  BASE_MENU_ITEMS,
  getPerfectWeatherMessage,
  getTierFromPoints,
  getWeatherIcon,
  mergeMenuImages,
  ORDERING_CATEGORIES,
} from "../data/ordering";
import { useOrderingExperience } from "../hooks/useOrderingExperience";
import type { CartItem, DiscountId, FlavorPreferences, MenuItem as MenuItemType } from "../types";

interface OrderingPageProps {
  tableNumber: string;
  userName: string;
  phoneNumber: string;
  flavorPreferences?: FlavorPreferences;
  onUpdateFlavorPreferences: () => void;
}

export function OrderingPage({
  tableNumber,
  userName,
  phoneNumber,
  flavorPreferences,
  onUpdateFlavorPreferences,
}: OrderingPageProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [loyaltyInfoOpen, setLoyaltyInfoOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"ordering" | "games">("ordering");
  const [hasPlacedOrder, setHasPlacedOrder] = useState(false);
  const [activeCategory, setActiveCategory] = useState("mains");
  const [selectedItem, setSelectedItem] = useState<MenuItemType | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const {
    recommendations,
    loyaltyProfile,
    weatherData,
    menuItems,
    pricingPreview,
    availableDiscounts,
    isExperienceLoading,
    isPreviewLoading,
    setSelectedDiscountId,
    setLoyaltyProfile,
    refreshRecommendationsForCart,
    refreshPricingPreview,
    submitOrder,
  } = useOrderingExperience({
    phoneNumber,
    userName,
    tableNumber,
    flavorPreferences,
  });

  useEffect(() => {
    if (menuItems.length > 0) {
      setActiveCategory((currentCategory) =>
        menuItems.some((item) => item.category === currentCategory)
          ? currentCategory
          : menuItems[0]?.category ?? "mains",
      );
    }
  }, [menuItems]);

  useEffect(() => {
    let cancelled = false;

    const loadRecommendations = async () => {
      try {
        await refreshRecommendationsForCart(cart);
      } catch {
        if (!cancelled) {
          toast.error("Unable to refresh recommendations right now.");
        }
      }
    };

    void loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [cart, refreshRecommendationsForCart]);

  useEffect(() => {
    let cancelled = false;

    const loadPreview = async () => {
      try {
        await refreshPricingPreview(cart);
      } catch {
        if (!cancelled && cart.length > 0) {
          toast.error("Unable to calculate your live total right now.");
        }
      }
    };

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [cart, refreshPricingPreview]);

  const handleItemClick = (item: MenuItemType) => {
    setSelectedItem(item);
    setItemDialogOpen(true);
  };

  const handleAddToCart = (item: MenuItemType) => {
    toast.success(`${item.name} added to cart`);
    setCart((prev) => {
      const existing = prev.find((cartItem) => cartItem.id === item.id);
      if (existing) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const handleAddFromDialog = (item: MenuItemType) => {
    handleAddToCart(item);
    setItemDialogOpen(false);
    setSelectedItem(null);
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(id);
      return;
    }
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)));
  };

  const handleRemoveItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
    toast.info("Item removed from cart");
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      return;
    }

    if (isPreviewLoading || !pricingPreview) {
      toast.info("Updating your live total. Please try again in a moment.");
      return;
    }

    setPaymentDialogOpen(true);
  };

  const addLoyaltyPoints = (
    pointsToAdd: number,
    source: string,
    updatedLoyalty?: { pointsBalance: number; tier: LoyaltyProfile["tier"] },
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
      return { ...current, points: updatedPoints, tier: getTierFromPoints(updatedPoints) };
    });
    toast.success(`+${pointsToAdd} points from ${source}`);
  };

  const handlePaymentComplete = async (
    paymentMethod: "card" | "mobile",
    selectedDiscountId: DiscountId | null,
  ) => {
    if (!pricingPreview) {
      throw new Error("Live pricing is still loading. Please try again.");
    }

    let completionResult: { earnedPoints: number; pointsBalance: number } | undefined;
    setIsSubmittingOrder(true);
    try {
      const response = await submitOrder(cart, paymentMethod, selectedDiscountId);
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
        toast.success("Payment successful. Redirecting you to Games.");
        completionResult = {
          earnedPoints: pricingPreview.pointsEarned,
          pointsBalance: pricingPreview.projectedPointsBalance,
        };
      }
      setHasPlacedOrder(true);
      setCurrentView("games");
      setPaymentDialogOpen(false);
      setCart([]);
      setSelectedDiscountId(null);
      return completionResult;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Unable to place your order right now.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const hydratedMenuItems = menuItems.length > 0 ? mergeMenuImages(menuItems) : BASE_MENU_ITEMS;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-cream)" }}>
      <OrderingHeader tableNumber={tableNumber} weatherData={weatherData} />

      {currentView === "games" ? (
        <InAppGames
          currentPoints={loyaltyProfile.points}
          phoneNumber={phoneNumber}
          userName={userName}
          onEarnPoints={addLoyaltyPoints}
          onBackToOrdering={() => setCurrentView("ordering")}
        />
      ) : (
        <main className="container mx-auto px-4 py-6 sm:px-6">
          {isExperienceLoading ? (
            <OrderingLoadingState />
          ) : (
            <OrderingCatalog
              hasPlacedOrder={hasPlacedOrder}
              onShowGames={() => setCurrentView("games")}
              onUpdateFlavorPreferences={onUpdateFlavorPreferences}
              loyaltyProfile={loyaltyProfile}
              weatherData={weatherData}
              getWeatherIcon={getWeatherIcon}
              getPerfectWeatherMessage={getPerfectWeatherMessage}
              categories={ORDERING_CATEGORIES}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              menuItems={hydratedMenuItems}
              onItemClick={handleItemClick}
              recommendations={recommendations}
              onAddToCart={handleAddToCart}
            />
          )}
        </main>
      )}

      {!isExperienceLoading && (
        <ShoppingCart
          items={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleCheckout}
          loyaltyProfile={loyaltyProfile}
          pricing={pricingPreview}
        />
      )}

      <PaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        onDiscountChange={setSelectedDiscountId}
        onPaymentComplete={handlePaymentComplete}
        loyaltyProfile={loyaltyProfile}
        pricing={pricingPreview}
        availableDiscounts={availableDiscounts}
        isSubmittingOrder={isSubmittingOrder}
      />

      <OrderingItemDialog
        item={selectedItem}
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        onAddFromDialog={handleAddFromDialog}
      />

      <OrderingLoyaltyInfoDialog
        open={loyaltyInfoOpen}
        onOpenChange={setLoyaltyInfoOpen}
        loyaltyProfile={loyaltyProfile}
        onUpdateFlavorPreferences={onUpdateFlavorPreferences}
      />

      <OrderingStyles />
    </div>
  );
}
