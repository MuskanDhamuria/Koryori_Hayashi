import { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { QrCode, ScanLine, MapPin, Check, Bird } from "lucide-react";
import { motion } from "motion/react";

interface QRScannerProps {
  userName: string;
  onScanComplete: (tableNumber: string) => void;
}

export function QRScanner({ userName, onScanComplete }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [tableNumber, setTableNumber] = useState("");

  const handleScan = () => {
    setIsScanning(true);
    
    setTimeout(() => {
      const mockTableNumber = `A-${Math.floor(Math.random() * 20) + 1}`;
      setTableNumber(mockTableNumber);
      setScanned(true);
      setIsScanning(false);
    }, 2000);
  };

  const handleConfirm = () => {
    onScanComplete(tableNumber);
  };

  const handleManualEntry = (table: string) => {
    setTableNumber(table);
    setScanned(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F1729] to-[#1A2642] flex items-center justify-center p-4">
      {/* Subtle grid pattern */}
      <div className="fixed inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      <Card className="w-full max-w-md relative bg-white shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#0F1729] to-[#2D3E5F] rounded-full mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <h2 className="text-2xl font-bold text-[#0F1729] mb-2">
              Welcome, {userName}!
            </h2>
            <p className="text-[#6B7280]">Scan the QR code at your table</p>
          </div>

          {!scanned ? (
            <>
              {/* QR Scanner */}
              <div className="mb-8">
                <div className="relative aspect-square max-w-xs mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6] rounded-2xl border-2 border-[#E5E7EB] overflow-hidden">
                    {!isScanning ? (
                      <div className="flex items-center justify-center h-full">
                        <QrCode className="w-32 h-32 text-[#6B7280]" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#0F1729] to-[#1A2642]">
                        <div className="relative w-48 h-48 border-2 border-[#D4AF37] rounded-lg">
                          <motion.div
                            className="absolute left-0 right-0 h-0.5 bg-[#D4AF37] shadow-lg shadow-[#D4AF37]/50"
                            animate={{ top: ["0%", "100%"] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                          <ScanLine className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-[#D4AF37] opacity-50" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Corner decorations */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-[#D4AF37] rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-2 border-r-2 border-[#D4AF37] rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-2 border-l-2 border-[#D4AF37] rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-[#D4AF37] rounded-br-lg" />
                </div>
              </div>

              <Button
                onClick={handleScan}
                disabled={isScanning}
                className="w-full h-12 bg-[#0F1729] hover:bg-[#1A2642] text-white shadow-md mb-6"
              >
                {isScanning ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <ScanLine className="w-5 h-5" />
                    </motion.div>
                    Scanning...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <QrCode className="w-5 h-5" />
                    Scan QR Code
                  </span>
                )}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#E5E7EB]" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-xs text-[#6B7280] uppercase">
                    Or select table
                  </span>
                </div>
              </div>

              {/* Manual Table Selection */}
              <div className="grid grid-cols-4 gap-2">
                {["A-1", "A-5", "A-12", "B-3", "B-7", "B-15", "C-2", "C-9"].map((table) => (
                  <Button
                    key={table}
                    variant="outline"
                    className="border-2 hover:bg-[#F9FAFB] hover:border-[#D4AF37]"
                    onClick={() => handleManualEntry(table)}
                  >
                    {table}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Success */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-50 rounded-full mb-4 border-2 border-emerald-500">
                  <Check className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-[#0F1729] mb-2">Table Confirmed!</h3>
                <div className="inline-flex items-center gap-2 bg-[#F9FAFB] border-2 border-[#D4AF37] rounded-lg px-6 py-3">
                  <MapPin className="w-5 h-5 text-[#D4AF37]" />
                  <span className="text-2xl font-bold text-[#0F1729]">{tableNumber}</span>
                </div>
              </motion.div>

              <div className="bg-[#F9FAFB] rounded-xl p-6 mb-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <span className="text-lg">📱</span>
                  </div>
                  <p className="text-sm text-[#0F1729]">Browse our digital menu</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <span className="text-lg">🍱</span>
                  </div>
                  <p className="text-sm text-[#0F1729]">Order directly from your phone</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                    <span className="text-lg">⭐</span>
                  </div>
                  <p className="text-sm text-[#0F1729]">Earn loyalty points automatically</p>
                </div>
              </div>

              <Button
                onClick={handleConfirm}
                className="w-full h-12 bg-[#0F1729] hover:bg-[#1A2642] text-white shadow-md mb-3"
              >
                Start Ordering
              </Button>

              <Button
                variant="ghost"
                onClick={() => setScanned(false)}
                className="w-full"
              >
                Change Table
              </Button>
            </>
          )}
        </div>

        {/* Gold accent line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
      </Card>
    </div>
  );
}
