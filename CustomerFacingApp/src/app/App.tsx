import { useState } from "react";
import { MobileLogin } from "./components/MobileLogin";
import { QRScanner } from "./components/QRScanner";
import { OrderingPage } from "./components/OrderingPage";
import { FlavorProfileQuiz } from "./components/FlavorProfileQuiz";
import { Toaster } from "./components/ui/sonner";
import { FlavorPreferences } from "./types";

type AppState = "login" | "flavor-quiz" | "qr-scan" | "ordering";

export default function App() {
  const [appState, setAppState] = useState<AppState>("login");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userName, setUserName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [flavorPreferences, setFlavorPreferences] = useState<FlavorPreferences | undefined>();

  const handleLogin = (phone: string) => {
    setPhoneNumber(phone);
    
    // Extract user name from phone number (mock)
    if (phone === "+1 (555) 123-4567") {
      setUserName("Yuki");
    } else if (phone === "+1 (555) 987-6543") {
      setUserName("Akira");
    } else {
      setUserName("Guest");
    }
    
    setAppState("flavor-quiz");
  };

  const handleFlavorProfileComplete = (preferences: FlavorPreferences) => {
    setFlavorPreferences(preferences);
    setAppState("qr-scan");
  };

  const handleScanComplete = (table: string) => {
    setTableNumber(table);
    setAppState("ordering");
  };

  return (
    <>
      <Toaster />
      
      {appState === "login" && (
        <MobileLogin onLogin={handleLogin} />
      )}
      
      {appState === "flavor-quiz" && (
        <FlavorProfileQuiz 
          userName={userName}
          onComplete={handleFlavorProfileComplete}
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
        />
      )}
    </>
  );
}