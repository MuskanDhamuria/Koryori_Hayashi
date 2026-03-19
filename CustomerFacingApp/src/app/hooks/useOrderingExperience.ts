import { useCallback, useEffect, useState } from "react";
import type { LoyaltyProfile } from "../components/LoyaltyCard";
import { BASE_MENU_ITEMS, mergeMenuImages } from "../data/ordering";
import {
  createOrder,
  fetchCustomerRecommendations,
  fetchLoyaltyProfile,
  fetchMenuItems,
  fetchOrderPreview,
} from "../services/api";
import type {
  AvailableDiscount,
  CartItem,
  DiscountId,
  FlavorPreferences,
  MenuItem,
  PricingBreakdown,
  WeatherData,
} from "../types";

type UseOrderingExperienceInput = {
  phoneNumber: string;
  userName: string;
  tableNumber: string;
  flavorPreferences?: FlavorPreferences;
};

export function useOrderingExperience({
  phoneNumber,
  userName,
  tableNumber,
  flavorPreferences,
}: UseOrderingExperienceInput) {
  const [recommendations, setRecommendations] = useState<Array<{ item: MenuItem; reason: string }>>(
    [],
  );
  const [loyaltyProfile, setLoyaltyProfile] = useState<LoyaltyProfile>({
    tier: "silver",
    points: 0,
    name: userName || "Guest",
    isBirthday: false,
    referralCode: "",
  });
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(BASE_MENU_ITEMS);
  const [pricingPreview, setPricingPreview] = useState<PricingBreakdown | null>(null);
  const [availableDiscounts, setAvailableDiscounts] = useState<AvailableDiscount[]>([]);
  const [selectedDiscountId, setSelectedDiscountId] = useState<DiscountId | null>(null);
  const [isExperienceLoading, setIsExperienceLoading] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadExperience = async () => {
      setIsExperienceLoading(true);

      try {
        if (cancelled) {
          return;
        }

        const [menuResult, loyaltyResult] = await Promise.allSettled([
          fetchMenuItems(),
          fetchLoyaltyProfile(phoneNumber),
        ]);

        if (cancelled) {
          return;
        }

        if (menuResult.status === "fulfilled") {
          const mergedMenu = mergeMenuImages(menuResult.value);
          setMenuItems(mergedMenu.length > 0 ? mergedMenu : BASE_MENU_ITEMS);
        } else {
          setMenuItems(BASE_MENU_ITEMS);
        }

        if (loyaltyResult.status === "fulfilled" && loyaltyResult.value) {
          setLoyaltyProfile(loyaltyResult.value);
        } else {
          setLoyaltyProfile({
            tier: "silver",
            points: 0,
            name: userName || "Guest",
            isBirthday: false,
            referralCode: "",
          });
        }
      } catch {
        if (cancelled) {
          return;
        }

        setMenuItems(BASE_MENU_ITEMS);
        setLoyaltyProfile({
          tier: "silver",
          points: 0,
          name: userName || "Guest",
          isBirthday: false,
          referralCode: "",
        });
      } finally {
        if (!cancelled) {
          setIsExperienceLoading(false);
        }
      }
    };

    void loadExperience();

    return () => {
      cancelled = true;
    };
  }, [phoneNumber, userName]);

  const refreshRecommendationsForCart = useCallback(
    async (cart: CartItem[]) => {
      const response = await fetchCustomerRecommendations({
        phoneNumber,
        cartItemIds: cart.flatMap((item) =>
          Array.from({ length: item.quantity }, () => item.id),
        ),
        flavorPreferences,
      });

      setRecommendations(response.recommendations);
      setWeatherData(response.weather);
    },
    [flavorPreferences, phoneNumber],
  );

  useEffect(() => {
    let cancelled = false;

    const loadRecommendations = async () => {
      try {
        const response = await fetchCustomerRecommendations({
          phoneNumber,
          cartItemIds: [],
          flavorPreferences,
        });

        if (cancelled) {
          return;
        }

        setRecommendations(response.recommendations);
        setWeatherData(response.weather);
      } catch {
        if (!cancelled) {
          setRecommendations([]);
        }
      }
    };

    void loadRecommendations();

    return () => {
      cancelled = true;
    };
  }, [flavorPreferences, phoneNumber]);

  const refreshPricingPreview = useCallback(
    async (cart: CartItem[], discountId = selectedDiscountId) => {
      if (cart.length === 0 || !tableNumber) {
        setPricingPreview(null);
        setAvailableDiscounts([]);
        return;
      }

      setIsPreviewLoading(true);
      try {
        const preview = await fetchOrderPreview({
          customerName: userName || "Guest",
          phoneNumber,
          tableCode: tableNumber,
          items: cart.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
          selectedDiscountId: discountId,
        });

        setPricingPreview(preview.pricing);
        setAvailableDiscounts(preview.availableDiscounts);
        setLoyaltyProfile(preview.loyaltyProfile);
      } finally {
        setIsPreviewLoading(false);
      }
    },
    [phoneNumber, selectedDiscountId, tableNumber, userName],
  );

  const submitOrder = useCallback(
    async (
      cart: CartItem[],
      paymentMethod: "card" | "mobile",
      discountId = selectedDiscountId,
    ) => {
      const response = await createOrder({
        customerName: userName || "Guest",
        phoneNumber,
        tableCode: tableNumber,
        items: cart.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
        paymentMethod: paymentMethod === "card" ? "CARD" : "MOBILE",
        selectedDiscountId: discountId,
      });

      if (response.loyalty) {
        setLoyaltyProfile((current) => ({
          ...current,
          points: response.loyalty!.pointsBalance,
          tier: response.loyalty!.tier,
        }));
      }

      return response;
    },
    [phoneNumber, selectedDiscountId, tableNumber, userName],
  );

  return {
    recommendations,
    loyaltyProfile,
    weatherData,
    menuItems,
    pricingPreview,
    availableDiscounts,
    selectedDiscountId,
    isExperienceLoading,
    isPreviewLoading,
    setSelectedDiscountId,
    setLoyaltyProfile,
    refreshRecommendationsForCart,
    refreshPricingPreview,
    submitOrder,
  };
}
