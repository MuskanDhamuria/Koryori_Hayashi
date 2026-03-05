import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { QrCode, ScanLine, MapPin, Check } from "lucide-react";
import { motion } from "motion/react";
import { CherryBlossom } from "./JapanesePattern";

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
    <div className="min-h-screen bg-[#E8DCC8] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle sage green glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#7C8A7A]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-20 w-80 h-80 bg-[#9BA89A]/10 rounded-full blur-3xl" />
      </div>

      {/* Floating Cherry Blossoms */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <CherryBlossom className="absolute top-20 left-10 animate-float opacity-20" size={40} />
        <CherryBlossom className="absolute top-40 right-20 animate-float-delayed opacity-15" size={30} />
        <CherryBlossom className="absolute bottom-32 left-1/4 animate-float opacity-18" size={35} />
        <CherryBlossom className="absolute top-1/3 right-1/3 animate-float-delayed opacity-12" size={25} />
        <CherryBlossom className="absolute bottom-20 right-10 animate-float opacity-25" size={45} />
      </div>

      <Card className="w-full max-w-md relative bg-[#F5F0E8]/95 backdrop-blur-sm border border-[#7C8A7A]/20 shadow-2xl overflow-hidden">
        {/* Top sage accent */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#7C8A7A] to-transparent opacity-60" />
        
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#7C8A7A]/20 to-[#9BA89A]/20 rounded-full mb-4 border-2 border-[#7C8A7A]/30 relative backdrop-blur-sm">
              <span className="text-4xl">👋</span>
              <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/10" />
              <CherryBlossom className="absolute -top-1 -right-1 opacity-80" size={28} />
            </div>
            <h2 className="text-3xl font-bold text-[#4A5548] mb-2" style={{ fontFamily: 'serif' }}>
              いらっしゃいませ
            </h2>
            <p className="text-xl text-[#5A6558] mb-1">Hello, {userName}!</p>
            <p className="text-[#6B7669] text-sm">Please scan the QR code at your table</p>
          </div>

          {!scanned ? (
            <>
              {/* QR Scanner Animation */}
              <div className="mb-8">
                <div className="relative aspect-square max-w-xs mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4C9B8] to-[#E0D5C4] rounded-3xl border-2 border-[#7C8A7A]/30 overflow-hidden shadow-2xl backdrop-blur-sm">
                    {!isScanning ? (
                      <div className="flex items-center justify-center h-full relative">
                        <QrCode className="w-32 h-32 text-[#7C8A7A]/80" />
                        <div className="absolute top-4 right-4">
                          <CherryBlossom size={32} className="opacity-60" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/5" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-[#3A4438] to-[#2A3428]">
                        <div className="relative w-48 h-48 border-2 border-[#7C8A7A] rounded-lg shadow-lg shadow-[#7C8A7A]/30">
                          <motion.div
                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#9BA89A] to-transparent shadow-lg shadow-[#7C8A7A]/50"
                            animate={{
                              top: ["0%", "100%"],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                          <ScanLine className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-[#9BA89A] opacity-50" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Corner decorations */}
                  <div className="absolute -top-2 -left-2 w-12 h-12">
                    <div className="w-full h-full border-t-2 border-l-2 border-[#7C8A7A]/40 rounded-tl-2xl" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-12 h-12">
                    <div className="w-full h-full border-t-2 border-r-2 border-[#7C8A7A]/40 rounded-tr-2xl" />
                  </div>
                  <div className="absolute -bottom-2 -left-2 w-12 h-12">
                    <div className="w-full h-full border-b-2 border-l-2 border-[#7C8A7A]/40 rounded-bl-2xl" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12">
                    <div className="w-full h-full border-b-2 border-r-2 border-[#7C8A7A]/40 rounded-br-2xl" />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleScan}
                disabled={isScanning}
                className="w-full h-12 bg-gradient-to-r from-[#7C8A7A] to-[#9BA89A] hover:from-[#6B7969] hover:to-[#8A9889] text-white shadow-lg mb-6 font-semibold"
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
                  <div className="w-full border-t border-[#7C8A7A]/20" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-[#F5F0E8] px-4 text-xs uppercase tracking-wider text-[#6B7669] flex items-center gap-2">
                    <span>Or select your table</span>
                  </span>
                </div>
              </div>

              {/* Manual Table Selection */}
              <div className="grid grid-cols-4 gap-2">
                {["A-1", "A-5", "A-12", "B-3", "B-7", "B-15", "C-2", "C-9"].map((table) => (
                  <Button
                    key={table}
                    variant="outline"
                    className="border-2 border-[#7C8A7A]/30 hover:bg-[#7C8A7A]/10 hover:border-[#7C8A7A]/50 transition-all font-semibold bg-white/40 text-[#4A5548]"
                    onClick={() => handleManualEntry(table)}
                  >
                    {table}
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Scan Success */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full mb-4 border-2 border-emerald-600/50 relative shadow-lg backdrop-blur-sm">
                  <Check className="w-14 h-14 text-emerald-700" />
                  <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />
                  <CherryBlossom className="absolute -top-2 -right-2 opacity-80" size={36} />
                </div>
                <h3 className="text-3xl font-bold text-[#4A5548] mb-1" style={{ fontFamily: 'serif' }}>確認済み</h3>
                <p className="text-xl text-[#5A6558] mb-3">Table Confirmed!</p>
                <div className="flex items-center justify-center gap-2 text-[#4A5548] bg-gradient-to-r from-[#D4C9B8] to-[#E0D5C4] rounded-full px-6 py-3 inline-flex border-2 border-[#7C8A7A]/30 backdrop-blur-sm shadow-lg">
                  <MapPin className="w-6 h-6 text-[#7C8A7A]" />
                  <span className="text-3xl font-bold">{tableNumber}</span>
                </div>
              </motion.div>

              <div className="bg-gradient-to-br from-[#D4C9B8]/50 to-[#E0D5C4]/50 rounded-2xl p-6 mb-6 border border-[#7C8A7A]/20 backdrop-blur-sm">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#7C8A7A]/20 to-[#9BA89A]/20 rounded-full flex items-center justify-center border border-[#7C8A7A]/30 shadow-sm backdrop-blur-sm">
                      <span className="text-xl">📱</span>
                    </div>
                    <p className="text-sm text-[#4A5548] font-medium">Browse our digital menu</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#7C8A7A]/20 to-[#9BA89A]/20 rounded-full flex items-center justify-center border border-[#7C8A7A]/30 shadow-sm backdrop-blur-sm">
                      <span className="text-xl">🍱</span>
                    </div>
                    <p className="text-sm text-[#4A5548] font-medium">Order directly from your phone</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#7C8A7A]/20 to-[#9BA89A]/20 rounded-full flex items-center justify-center border border-[#7C8A7A]/30 shadow-sm backdrop-blur-sm">
                      <span className="text-xl">⭐</span>
                    </div>
                    <p className="text-sm text-[#4A5548] font-medium">Earn loyalty points automatically</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleConfirm}
                className="w-full h-12 bg-gradient-to-r from-[#7C8A7A] to-[#9BA89A] hover:from-[#6B7969] hover:to-[#8A9889] text-white shadow-lg font-semibold"
              >
                Start Ordering
              </Button>

              <Button
                variant="ghost"
                onClick={() => setScanned(false)}
                className="w-full mt-3 text-[#6B7669] hover:text-[#4A5548] hover:bg-[#7C8A7A]/10"
              >
                Change Table
              </Button>
            </>
          )}
        </div>

        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#7C8A7A]/10 to-transparent rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#9BA89A]/10 to-transparent rounded-tr-full" />
      </Card>

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
