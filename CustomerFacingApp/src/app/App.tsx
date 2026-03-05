import { useState } from "react";
import { MobileLogin } from "./components/MobileLogin";
import { QRScanner } from "./components/QRScanner";
import { OrderingPage } from "./components/OrderingPage";
import { Toaster } from "./components/ui/sonner";

type AppState = "login" | "qr-scan" | "ordering";

export default function App() {
  const [appState, setAppState] = useState<AppState>("login");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userName, setUserName] = useState("");
  const [tableNumber, setTableNumber] = useState("");

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
        />
      )}
    </>
  );
}
