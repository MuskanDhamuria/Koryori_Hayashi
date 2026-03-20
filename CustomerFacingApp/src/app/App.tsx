import { useState } from "react";
import { MobileLogin } from "./components/MobileLogin";
import { QRScanner } from "./components/QRScanner";
import { OrderingPage } from "./components/OrderingPage";
import { FlavorProfileQuiz } from "./components/FlavorProfileQuiz";
import { Toaster } from "./components/ui/sonner";
import type { FlavorPreferences } from "./types";
import {
  fetchCustomerProfile,
  saveCustomerPreferences,
} from "./services/api";
import { getFallbackCustomerName } from "./lib/customerProfiles";

type AppState = "login" | "flavor-quiz" | "qr-scan" | "ordering";

export default function App() {
  const [appState, setAppState] = useState<AppState>("login");
  const [postQuizState, setPostQuizState] = useState<"qr-scan" | "ordering">("qr-scan");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userName, setUserName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [flavorPreferences, setFlavorPreferences] = useState<FlavorPreferences | undefined>();

  const handleLogin = async (phone: string) => {
    setPhoneNumber(phone);

    const profile = await fetchCustomerProfile(phone);
    const resolvedName = profile?.fullName || getFallbackCustomerName(phone);
    setUserName(resolvedName);

    if (profile?.loyaltyProfile) {
      setUserName(profile.loyaltyProfile.name);
    }

    if (profile?.flavorProfile) {
      setFlavorPreferences(profile.flavorProfile);
      setAppState("qr-scan");
      return;
    }

    setPostQuizState("qr-scan");
    setAppState("flavor-quiz");
  };

  const handleFlavorProfileComplete = async (preferences: FlavorPreferences) => {
    setFlavorPreferences(preferences);
    await saveCustomerPreferences({
      phoneNumber,
      fullName: userName || "Guest",
      flavorProfile: preferences,
    });
    setAppState(postQuizState);
  };

  const handleScanComplete = (table: string) => {
    setTableNumber(table);
    setAppState("ordering");
  };

  const handleUpdateFlavorPreferences = () => {
    setPostQuizState("ordering");
    setAppState("flavor-quiz");
  };

  return (
    <>
      <Toaster />

      {appState === "login" && <MobileLogin onLogin={handleLogin} />}

      {appState === "flavor-quiz" && (
        <FlavorProfileQuiz
          userName={userName}
          initialPreferences={flavorPreferences}
          onComplete={handleFlavorProfileComplete}
          onClose={() => setAppState(postQuizState)}
        />
      )}

      {appState === "qr-scan" && (
        <QRScanner
          userName={userName}
          onScanComplete={handleScanComplete}
        />
      )}

      {appState === "ordering" && (
        <OrderingPage
          tableNumber={tableNumber}
          userName={userName}
          phoneNumber={phoneNumber}
          flavorPreferences={flavorPreferences}
          onUpdateFlavorPreferences={handleUpdateFlavorPreferences}
        />
      )}
    </>
  );
}
